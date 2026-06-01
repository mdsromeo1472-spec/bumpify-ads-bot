from telegram import Update
from telegram.ext import ContextTypes
from bot.utils import db
from bot.utils.broadcaster import parse_topic_link


async def setforums_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id

    text = update.message.text or ""
    parts = text.split(maxsplit=1)

    if len(parts) < 2:
        await update.message.reply_text(
            "Forum/topic links bhejo:\n\n"
            "<code>/setforums https://t.me/c/1234567890/55\n"
            "https://t.me/mygroup/72</code>",
            parse_mode="HTML",
        )
        return

    raw_links = parts[1].replace(",", "\n").splitlines()

    targets = []
    failed = []

    for link in raw_links:
        link = link.strip()
        if not link:
            continue

        try:
            targets.append(parse_topic_link(link))
        except Exception:
            failed.append(link)

    if not targets:
        await update.message.reply_text(
            "Valid forum/topic link nahi mila.",
            parse_mode="HTML",
        )
        return

    await db.set_forum_targets(user_id, targets)

    msg = f"✅ Saved {len(targets)} forum/topic targets."

    if failed:
        msg += "\n\nInvalid links:\n" + "\n".join(failed[:10])

    await update.message.reply_text(msg)