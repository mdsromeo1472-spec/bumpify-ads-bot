import re
import random
from pyrogram.raw import functions, types
import asyncio
import io
import logging
import httpx
from pyrogram import Client
from pyrogram.enums import ParseMode, ChatType
from pyrogram.errors import FloodWait, ChatWriteForbidden, UserBannedInChannel, SessionRevoked, AuthKeyUnregistered
from bot.utils.session_manager import get_pyrogram_client
from bot.utils import db
import telegram
from bot.config import BOT_TOKEN

logger = logging.getLogger(__name__)

_active_tasks: dict[int, asyncio.Task] = {}
_dl_semaphore: asyncio.Semaphore | None = None
_acc_semaphore: asyncio.Semaphore | None = None


def _get_dl_sem() -> asyncio.Semaphore:
    global _dl_semaphore
    if _dl_semaphore is None:
        _dl_semaphore = asyncio.Semaphore(8)
    return _dl_semaphore


def _get_acc_sem() -> asyncio.Semaphore:
    global _acc_semaphore
    if _acc_semaphore is None:
        _acc_semaphore = asyncio.Semaphore(10)
    return _acc_semaphore


async def send_logs(owner_id: int, text: str):
    from bot.config import LOGGER_BOT_TOKEN
    if not LOGGER_BOT_TOKEN:
        return
    try:
        bot = telegram.Bot(token=LOGGER_BOT_TOKEN)
        await bot.send_message(chat_id=owner_id, text=text, parse_mode="HTML")
    except Exception as e:
        logger.warning("send_logs failed: %s", e)


async def _download_file(file_id: str) -> bytes | None:
    async with _get_dl_sem():
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                r = await client.get(
                    f"https://api.telegram.org/bot{BOT_TOKEN}/getFile",
                    params={"file_id": file_id},
                )
                path = r.json()["result"]["file_path"]
                r2 = await client.get(f"https://api.telegram.org/file/bot{BOT_TOKEN}/{path}")
                return r2.content
        except Exception as e:
            logger.warning("download_file failed [%s]: %s", file_id, e)
            return None


async def _send_ad_via_pyrogram(client: Client, chat_id, ad_data: dict):
    msg_type = ad_data.get("type")
    caption = ad_data.get("caption", "") or ""

    if msg_type == "text":
        text = ad_data.get("text", "") or ""
        await client.send_message(chat_id, text, parse_mode=ParseMode.HTML)

    elif msg_type == "forward":
        msgs = [m async for m in client.get_chat_history("me", limit=1)]
        if msgs and msgs[0].id:
            await client.forward_messages(chat_id, "me", msgs[0].id)
        else:
            raise ValueError("No message in Saved Messages to forward")

    elif msg_type == "photo":
        data = await _download_file(ad_data["file_id"])
        if not data:
            raise ValueError("Could not download photo")
        await client.send_photo(chat_id, io.BytesIO(data), caption=caption, parse_mode=ParseMode.HTML)

    elif msg_type == "video":
        data = await _download_file(ad_data["file_id"])
        if not data:
            raise ValueError("Could not download video")
        await client.send_video(chat_id, io.BytesIO(data), caption=caption, parse_mode=ParseMode.HTML)

    elif msg_type == "document":
        data = await _download_file(ad_data["file_id"])
        if not data:
            raise ValueError("Could not download document")
        await client.send_document(chat_id, io.BytesIO(data), caption=caption, parse_mode=ParseMode.HTML)

    elif msg_type == "audio":
        data = await _download_file(ad_data["file_id"])
        if not data:
            raise ValueError("Could not download audio")
        await client.send_audio(chat_id, io.BytesIO(data), caption=caption, parse_mode=ParseMode.HTML)

    elif msg_type == "animation":
        data = await _download_file(ad_data["file_id"])
        if not data:
            raise ValueError("Could not download animation")
        await client.send_animation(chat_id, io.BytesIO(data), caption=caption, parse_mode=ParseMode.HTML)

    elif msg_type == "sticker":
        data = await _download_file(ad_data["file_id"])
        if not data:
            raise ValueError("Could not download sticker")
        await client.send_sticker(chat_id, io.BytesIO(data))

    elif msg_type == "voice":
        data = await _download_file(ad_data["file_id"])
        if not data:
            raise ValueError("Could not download voice")
        await client.send_voice(chat_id, io.BytesIO(data), caption=caption, parse_mode=ParseMode.HTML)

    elif msg_type == "video_note":
        data = await _download_file(ad_data["file_id"])
        if not data:
            raise ValueError("Could not download video note")
        await client.send_video_note(chat_id, io.BytesIO(data))

    else:
        txt = caption or ad_data.get("text", "")
        if txt:
            await client.send_message(chat_id, txt, parse_mode=ParseMode.HTML)


def _group_link(group) -> str:
    username = getattr(group, "username", None)
    gid = str(group.id)
    if username:
        return f"https://t.me/{username}"
    if gid.startswith("-100"):
        return f"https://t.me/c/{gid[4:]}"
    return ""

def parse_topic_link(link: str) -> dict:
    link = link.strip()

    m = re.search(r"t\.me/c/(\d+)/(\d+)(?:/\d+)?", link)
    if m:
        return {
            "chat_id": int("-100" + m.group(1)),
            "topic_id": int(m.group(2)),
            "link": link,
        }

    m = re.search(r"t\.me/([A-Za-z0-9_]+)/(\d+)(?:/\d+)?", link)
    if m:
        return {
            "chat_id": "@" + m.group(1),
            "topic_id": int(m.group(2)),
            "link": link,
        }

    raise ValueError(f"Invalid topic link: {link}")


async def forward_saved_to_topic(client: Client, chat_id, saved_msg_id: int, topic_id: int):
    to_peer = await client.resolve_peer(chat_id)

    await client.invoke(
        functions.messages.ForwardMessages(
            from_peer=types.InputPeerSelf(),
            id=[saved_msg_id],
            random_id=[random.randint(-(2**63), 2**63 - 1)],
            to_peer=to_peer,
            top_msg_id=topic_id,
        )
    )

async def _process_account(owner_id: int, acc_num: int, acc: dict) -> dict:
    report = {
        "num": acc_num,
        "phone": acc["phone"],
        "name": acc.get("name", acc["phone"]),
        "success": 0,
        "failed": 0,
        "groups": [],
        "error": None,
    }

    async with _get_acc_sem():
        try:
            client = await get_pyrogram_client(acc["session"])
            async with client:
                msgs = [m async for m in client.get_chat_history("me", limit=1)]
                if not msgs or not msgs[0].id:
                    report["error"] = "Ad message set kro"
                    await send_logs(
                        owner_id,
                        f"<b>⚠️ Account #{acc_num} — {acc.get('name', acc['phone'])}</b>\n"
                        f"<code>{acc['phone']}</code>\n\n"
                        "Saved Messages me koi ad message nahi mila.\n"
                        "Pehle Saved Messages me ad save kro.",
                    )
                    return report

                saved_msg_id = msgs[0].id

                targets = await db.get_forum_targets(owner_id)
                if not targets:
                    report["error"] = "No forum/topic links set"
                    await send_logs(owner_id, "No forum/topic links set. Use /setforums first.")
                    return report

                logger.info("Account #%d: %d forum targets found", acc_num, len(targets))

                group_sem = asyncio.Semaphore(5)

                async def send_to_target(target):
                    chat_id = target["chat_id"]
                    topic_id = target["topic_id"]
                    link = target.get("link", "")
                    title = f"Topic {topic_id}"

                    async with group_sem:
                        if not await db.is_ads_running(owner_id):
                            return

                        gid_for_log = chat_id if isinstance(chat_id, int) else 0

                        try:
                            await forward_saved_to_topic(client, chat_id, saved_msg_id, topic_id)

                            await db.log_broadcast(
                                owner_id, acc["phone"], acc_num,
                                gid_for_log, title, "", True
                            )

                            report["success"] += 1
                            report["groups"].append({
                                "title": title,
                                "username": "",
                                "link": link,
                                "id": chat_id,
                                "ok": True,
                            })

                        except FloodWait as e:
                            await asyncio.sleep(min(e.value, 30))
                            try:
                                await forward_saved_to_topic(client, chat_id, saved_msg_id, topic_id)

                                await db.log_broadcast(
                                    owner_id, acc["phone"], acc_num,
                                    gid_for_log, title, "", True
                                )

                                report["success"] += 1
                                report["groups"].append({
                                    "title": title,
                                    "username": "",
                                    "link": link,
                                    "id": chat_id,
                                    "ok": True,
                                })

                            except Exception as ex2:
                                await db.log_broadcast(
                                    owner_id, acc["phone"], acc_num,
                                    gid_for_log, title, "", False, str(ex2)
                                )
                                report["failed"] += 1
                                report["groups"].append({
                                    "title": title,
                                    "username": "",
                                    "link": link,
                                    "id": chat_id,
                                    "ok": False,
                                    "err": str(ex2)[:60],
                                })

                        except (ChatWriteForbidden, UserBannedInChannel):
                            await db.log_broadcast(
                                owner_id, acc["phone"], acc_num,
                                gid_for_log, title, "", False, "No write permission"
                            )
                            report["failed"] += 1
                            report["groups"].append({
                                "title": title,
                                "username": "",
                                "link": link,
                                "id": chat_id,
                                "ok": False,
                                "err": "No write permission",
                            })

                        except Exception as e:
                            await db.log_broadcast(
                                owner_id, acc["phone"], acc_num,
                                gid_for_log, title, "", False, str(e)
                            )
                            report["failed"] += 1
                            report["groups"].append({
                                "title": title,
                                "username": "",
                                "link": link,
                                "id": chat_id,
                                "ok": False,
                                "err": str(e)[:60],
                            })

                    await asyncio.sleep(1)

                await asyncio.gather(
                    *[send_to_target(t) for t in targets],
                    return_exceptions=True
                )

        except (SessionRevoked, AuthKeyUnregistered):
            report["error"] = "Session expired — account removed"
            await db.remove_account(owner_id, acc["phone"])
            await send_logs(
                owner_id,
                f"<b>Account #{acc_num} Session Expired</b>\n"
                f"Phone: <code>{acc['phone']}</code>\n"
                "The account has been automatically removed. Please re-add it.",
            )

        except Exception as e:
            report["error"] = str(e)[:200]
            await send_logs(
                owner_id,
                f"<b>Account #{acc_num} Error</b>\n"
                f"Phone: <code>{acc['phone']}</code>\n"
                f"Error: {str(e)[:200]}",
            )

    return report


async def broadcast_for_user(owner_id: int):
    accounts = await db.get_accounts(owner_id)
    if not accounts:
        return

    tasks = [_process_account(owner_id, i + 1, acc) for i, acc in enumerate(accounts)]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    interval = await db.get_interval(owner_id)
    mins, secs = divmod(interval, 60)
    time_str = f"{mins}m {secs}s" if mins else f"{secs}s"

    for result in results:
        if isinstance(result, Exception):
            continue
        report = result

        if report.get("error") and not report["groups"]:
            continue

        lines = [
            f"<b>Account #{report['num']} — {report['name']}</b>",
            f"<code>{report['phone']}</code>",
            "",
            f"Sent: <b>{report['success']}</b>  |  Failed: <b>{report['failed']}</b>  |  Total: <b>{len(report['groups'])}</b>",
            "",
        ]

        shown = 0
        for g in report["groups"]:
            if shown >= 50:
                lines.append(f"<i>... and {len(report['groups']) - shown} more groups</i>")
                break
            mark = "✓" if g["ok"] else "✗"
            name = g["title"][:35]
            uname = f"@{g['username']}" if g["username"] else ""
            gid_str = str(g["id"])
            if g["link"]:
                lines.append(f"{mark} <a href='{g['link']}'>{name}</a> {uname} <code>{gid_str}</code>")
            else:
                lines.append(f"{mark} {name} {uname} <code>{gid_str}</code>")
            if not g["ok"] and g.get("err"):
                lines.append(f"   <i>{g['err']}</i>")
            shown += 1

        lines.append(f"\nNext cycle: <code>{time_str}</code>")
        msg = "\n".join(lines)
        if len(msg) > 4096:
            msg = msg[:4000] + "\n<i>... truncated</i>"

        await send_logs(owner_id, msg)


async def start_broadcast(owner_id: int):
    await db.set_ads_running(owner_id, True)

    async def run():
        while await db.is_ads_running(owner_id):
            interval = await db.get_interval(owner_id)
            await broadcast_for_user(owner_id)
            if await db.is_ads_running(owner_id):
                await asyncio.sleep(interval)

    task = asyncio.create_task(run())
    _active_tasks[owner_id] = task


async def stop_broadcast(owner_id: int):
    await db.set_ads_running(owner_id, False)
    task = _active_tasks.pop(owner_id, None)
    if task and not task.done():
        task.cancel()
