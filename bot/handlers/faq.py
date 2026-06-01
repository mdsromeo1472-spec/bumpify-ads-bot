from telegram import Update, InlineKeyboardMarkup, InlineKeyboardButton
from telegram.ext import ContextTypes
from bot.utils.helpers import safe_edit

FAQ_TEXT = (
    "<b>FAQ</b>\n\n"
    "<blockquote><b>Q: How many accounts can I add?</b>\n"
    "Unlimited. The bot handles any number of accounts concurrently.</blockquote>\n\n"
    "<blockquote><b>Q: Will my sessions expire?</b>\n"
    "Sessions are permanent unless you log out from Telegram settings or get banned.</blockquote>\n\n"
    "<blockquote><b>Q: What message types are supported?</b>\n"
    "Text, photo, video, document, audio, animation, sticker, voice, video note — all formats.</blockquote>\n\n"
    "<blockquote><b>Q: Is markdown/formatting preserved?</b>\n"
    "Yes. Bold, italic, code, blockquote, strikethrough, underline — all preserved when sending.</blockquote>\n\n"
    "<blockquote><b>Q: What is Direct vs Forward mode?</b>\n"
    "Direct sends your saved ad content. Forward forwards the latest message from Saved Messages.</blockquote>"
)

HOWTO_TEXT = (
    "<b>How To Use</b>\n\n"
    "<blockquote>1. Add your Telegram accounts via the web panel\n"
    "2. Set your ad message (any media type)\n"
    "3. Choose Direct or Forward mode\n"
    "4. Set an interval (how often to re-broadcast)\n"
    "5. Press Start Ads</blockquote>\n\n"
    "<blockquote>Your logger bot will receive detailed logs after each cycle showing:\n"
    "- Every group name, username, link and ID\n"
    "- Success / failed counts per account\n"
    "- Next cycle countdown</blockquote>"
)


async def faq_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("How To Use", callback_data="howto", api_kwargs={"style": "primary"})],
        [InlineKeyboardButton("Back", callback_data="home", api_kwargs={"style": "danger"})],
    ])
    await safe_edit(query, FAQ_TEXT, reply_markup=keyboard, parse_mode="HTML", context=context)


async def howto_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("Home", callback_data="home", api_kwargs={"style": "danger"})],
    ])
    await safe_edit(query, HOWTO_TEXT, reply_markup=keyboard, parse_mode="HTML", context=context)
