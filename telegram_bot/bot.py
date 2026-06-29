#!/usr/bin/env python3
"""
OlimFood Telegram Bot
Flow: /start → til tanlash → Web App tugmasi + bot menyu
Admin: yangi buyurtma xabarnomasi + status tugmalari
Sinxronlik: web-panelda status o'zgarsa foydalanuvchiga Telegram xabari
"""

import os
import sys
import logging
from html import escape

# Backend path: bot istagan joydan ishga tushsa ham DB topiladi
_BACKEND = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend")
sys.path.insert(0, _BACKEND)
os.chdir(_BACKEND)          # sqlite:///./olimfood.db ni to'g'ri hal qiladi

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(_BACKEND, "..", ".env"))
except ImportError:
    pass

from database import SessionLocal
import models

from telegram import (
    Update,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
    WebAppInfo,
)
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    MessageHandler,
    ConversationHandler,
    ContextTypes,
    PicklePersistence,
    filters,
)
from telegram.constants import ParseMode

logging.basicConfig(
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

BOT_TOKEN  = os.getenv("BOT_TOKEN", "")
ADMIN_CHAT = int(os.getenv("ADMIN_CHAT_ID", "0"))
WEBAPP_URL = os.getenv("WEBAPP_URL", "").rstrip("/")
DELIVERY   = 15_000

# Conversation states
ASK_NAME, ASK_PHONE, ASK_ADDRESS, ASK_NOTE, ASK_PAYMENT = range(5)

STATUS_LABELS = {
    "new":        "🆕 Yangi",
    "confirmed":  "✅ Tasdiqlangan",
    "preparing":  "👨‍🍳 Tayyorlanmoqda",
    "delivering": "🚗 Yetkazilmoqda",
    "delivered":  "🟢 Yetkazildi",
    "cancelled":  "❌ Bekor qilindi",
}

USER_MSGS = {
    "confirmed":  "✅ Buyurtmangiz <b>#{id}</b> tasdiqlandi! Tez orada tayyorlanadi 🍽️",
    "preparing":  "👨‍🍳 Buyurtmangiz <b>#{id}</b> tayyorlanmoqda! Kutib turing...",
    "delivering": "🚗 Buyurtmangiz <b>#{id}</b> yo'lda! Eshikni kuting 🏠",
    "delivered":  "🟢 Buyurtmangiz <b>#{id}</b> yetkazildi! Ishtahangiz yo'l bo'lsin! 🙏",
    "cancelled":  "❌ Buyurtmangiz <b>#{id}</b> bekor qilindi. Kechirasiz.",
}

PAY_LABELS = {"naqd": "💵 Naqd pul", "karta": "💳 Bank kartasi", "online": "📱 Online"}

# ─── i18n ─────────────────────────────────────────────────────────────────────
_I18N: dict[str, dict[str, str]] = {
    "uz": {
        "lang_prompt": "🌐 Tilni tanlang:",
        "welcome": (
            "🍽️ <b>OlimFood</b>ga xush kelibsiz!\n\n"
            "Mazali taomlarni buyurtma qiling — tez yetkazib beramiz 🚀\n\n"
            "Quyidagi tugma orqali ilovani oching 👇"
        ),
        "open_app":    "🛒  OlimFood — buyurtma berish",
        "bot_menu":    "🍽️ Bot menyusi",
        "cart":        "🛒 Savatcha",
        "my_orders":   "📦 Buyurtmalarim",
        "change_lang": "🌐 Tilni o'zgartirish",
    },
    "ru": {
        "lang_prompt": "🌐 Выберите язык:",
        "welcome": (
            "🍽️ Добро пожаловать в <b>OlimFood</b>!\n\n"
            "Заказывайте вкусные блюда — доставим быстро 🚀\n\n"
            "Нажмите кнопку ниже, чтобы открыть приложение 👇"
        ),
        "open_app":    "🛒  OlimFood — сделать заказ",
        "bot_menu":    "🍽️ Меню бота",
        "cart":        "🛒 Корзина",
        "my_orders":   "📦 Мои заказы",
        "change_lang": "🌐 Сменить язык",
    },
    "en": {
        "lang_prompt": "🌐 Choose language:",
        "welcome": (
            "🍽️ Welcome to <b>OlimFood</b>!\n\n"
            "Order delicious food — delivered fast 🚀\n\n"
            "Tap the button below to open the app 👇"
        ),
        "open_app":    "🛒  OlimFood — place order",
        "bot_menu":    "🍽️ Bot menu",
        "cart":        "🛒 Cart",
        "my_orders":   "📦 My Orders",
        "change_lang": "🌐 Change language",
    },
}


def tr(ctx_or_lang, key: str) -> str:
    lang = ctx_or_lang if isinstance(ctx_or_lang, str) else ctx_or_lang.user_data.get("lang", "uz")
    return _I18N.get(lang, _I18N["uz"]).get(key, key)


h   = lambda s: escape(str(s or ""))
fmt = lambda n: f"{int(n):,}".replace(",", " ")


# ─── Language selection ───────────────────────────────────────────────────────

_LANG_KB = InlineKeyboardMarkup([[
    InlineKeyboardButton("🇺🇿 O'zbek", callback_data="lang_uz"),
    InlineKeyboardButton("🇷🇺 Русский", callback_data="lang_ru"),
    InlineKeyboardButton("🇬🇧 English", callback_data="lang_en"),
]])

_LANG_PROMPT = "🌐 Tilni tanlang / Выберите язык / Choose language"


async def cmd_start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Always show language selection first."""
    # Remove any existing reply keyboard before showing lang selection
    if update.message:
        await update.message.reply_text(
            _LANG_PROMPT,
            reply_markup=ReplyKeyboardRemove(),
        )
        await update.message.reply_text(_LANG_PROMPT, reply_markup=_LANG_KB)
    else:
        q = update.callback_query
        await q.answer()
        await q.message.reply_text(_LANG_PROMPT, reply_markup=_LANG_KB)


async def cb_lang(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """User picked a language — save it and show the welcome/WebApp screen."""
    q    = update.callback_query
    await q.answer()
    lang = q.data[5:]           # "lang_uz" → "uz"
    ctx.user_data["lang"] = lang
    ctx.user_data.setdefault("cart", [])
    await _send_welcome(q.message, ctx, edit=False)


async def cb_change_lang(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer()
    await q.message.reply_text(_LANG_PROMPT, reply_markup=_LANG_KB)


# ─── Welcome / main screen ────────────────────────────────────────────────────

def _welcome_kb(lang: str, cart: list) -> tuple[InlineKeyboardMarkup, "ReplyKeyboardMarkup | None"]:
    """
    Returns (inline_kb, reply_kb).
    inline_kb  — navigation buttons inside the message.
    reply_kb   — WebApp button at the keyboard level (None if no WEBAPP_URL).
    """
    n         = sum(i["qty"] for i in cart)
    cart_badge = f" ({n})" if n else ""

    inline_rows = []

    # WebApp inline button (opens app inside Telegram)
    if WEBAPP_URL:
        url = f"{WEBAPP_URL}?lang={lang}"
        if url.startswith("https://"):
            webapp_btn = InlineKeyboardButton(tr(lang, "open_app"), web_app=WebAppInfo(url=url))
        else:
            # HTTP — use regular URL button (useful for local dev)
            webapp_btn = InlineKeyboardButton(tr(lang, "open_app"), url=url)
        inline_rows.append([webapp_btn])

    inline_rows.append([InlineKeyboardButton(tr(lang, "bot_menu"), callback_data="menu")])
    inline_rows.append([
        InlineKeyboardButton(tr(lang, "cart") + cart_badge, callback_data="cart"),
        InlineKeyboardButton(tr(lang, "my_orders"),         callback_data="my_orders"),
    ])
    inline_rows.append([InlineKeyboardButton(tr(lang, "change_lang"), callback_data="change_lang")])

    inline_kb = InlineKeyboardMarkup(inline_rows)

    # Reply keyboard WebApp button (stays at the bottom of the chat)
    reply_kb = None
    if WEBAPP_URL:
        url = f"{WEBAPP_URL}?lang={lang}"
        if url.startswith("https://"):
            reply_kb = ReplyKeyboardMarkup(
                [[KeyboardButton(tr(lang, "open_app"), web_app=WebAppInfo(url=url))]],
                resize_keyboard=True,
                one_time_keyboard=False,
            )

    return inline_kb, reply_kb


async def _send_welcome(msg, ctx: ContextTypes.DEFAULT_TYPE, *, edit: bool = False):
    lang    = ctx.user_data.get("lang", "uz")
    cart    = ctx.user_data.get("cart", [])
    text    = tr(lang, "welcome")
    ikb, rkb = _welcome_kb(lang, cart)

    # 1. Activate the persistent WebApp button in the reply keyboard
    if rkb:
        await msg.reply_text("👇", reply_markup=rkb)

    # 2. Send the main welcome message with inline navigation
    await msg.reply_text(text, reply_markup=ikb, parse_mode=ParseMode.HTML)


async def cb_main_menu(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """'🏠 Bosh sahifa' tugmasi."""
    q = update.callback_query
    await q.answer()
    ctx.user_data.setdefault("cart", [])

    # If no lang set yet, show lang selection
    if "lang" not in ctx.user_data:
        await q.message.reply_text(_LANG_PROMPT, reply_markup=_LANG_KB)
        return

    lang      = ctx.user_data.get("lang", "uz")
    cart      = ctx.user_data["cart"]
    ikb, _    = _welcome_kb(lang, cart)

    try:
        await q.edit_message_text(tr(lang, "welcome"), reply_markup=ikb, parse_mode=ParseMode.HTML)
    except Exception:
        await q.message.reply_text(tr(lang, "welcome"), reply_markup=ikb, parse_mode=ParseMode.HTML)


# ─── Keyboards ────────────────────────────────────────────────────────────────

def admin_kb(oid):
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("✅ Tasdiqlash",       callback_data=f"as_confirmed_{oid}"),
            InlineKeyboardButton("👨‍🍳 Tayyorlanmoqda",  callback_data=f"as_preparing_{oid}"),
        ],
        [
            InlineKeyboardButton("🚗 Yetkazilmoqda",   callback_data=f"as_delivering_{oid}"),
            InlineKeyboardButton("🟢 Yetkazildi",      callback_data=f"as_delivered_{oid}"),
        ],
        [InlineKeyboardButton("❌ Bekor qilish",        callback_data=f"as_cancelled_{oid}")],
    ])


CANCEL_KB = InlineKeyboardMarkup([[InlineKeyboardButton("❌ Bekor qilish", callback_data="co_cancel")]])
BACK_HOME  = [[InlineKeyboardButton("🏠 Bosh sahifa", callback_data="main_menu")]]


# ─── DB helpers ───────────────────────────────────────────────────────────────

def _cats():
    db = SessionLocal()
    try:
        rows = db.query(models.Category).filter(models.Category.active == True).order_by(models.Category.order).all()
        return [{"id": r.id, "name": r.name, "emoji": r.emoji or "🍽️"} for r in rows]
    finally:
        db.close()


def _prods(cat_id=None):
    db = SessionLocal()
    try:
        q = db.query(models.Product).filter(models.Product.available == True)
        if cat_id:
            q = q.filter(models.Product.cat_id == cat_id)
        rows = q.all()
        return [
            {
                "id": r.id, "name": r.name, "price": r.price, "discount": r.discount,
                "image_url": r.image_url, "cat_id": r.cat_id,
                "description": r.description, "weight": r.weight, "emoji": r.emoji,
            }
            for r in rows
        ]
    finally:
        db.close()


def _prod(pid):
    db = SessionLocal()
    try:
        r = db.query(models.Product).filter(models.Product.id == pid).first()
        if not r:
            return None
        return {
            "id": r.id, "name": r.name, "price": r.price, "discount": r.discount,
            "image_url": r.image_url, "cat_id": r.cat_id,
            "description": r.description, "weight": r.weight, "emoji": r.emoji,
        }
    finally:
        db.close()


def _create_order(data):
    db = SessionLocal()
    try:
        subtotal = data["subtotal"]
        o = models.Order(
            name=data["name"], phone=data["phone"],
            address=data["address"], note=data.get("note", ""),
            payment=data["payment"],
            subtotal=subtotal, delivery=DELIVERY, total=subtotal + DELIVERY,
            items=data["items"], status="new",
            telegram_chat_id=str(data["chat_id"]),
        )
        db.add(o)
        db.commit()
        db.refresh(o)
        return {"id": o.id, "total": o.total}
    finally:
        db.close()


def _set_status(order_id, status):
    db = SessionLocal()
    try:
        o = db.query(models.Order).filter(models.Order.id == order_id).first()
        if not o:
            return None
        o.status = status
        db.commit()
        return {"chat_id": o.telegram_chat_id, "name": o.name}
    finally:
        db.close()


def _user_orders(chat_id):
    db = SessionLocal()
    try:
        rows = (
            db.query(models.Order)
            .filter(models.Order.telegram_chat_id == str(chat_id))
            .order_by(models.Order.created_at.desc())
            .limit(5)
            .all()
        )
        return [
            {"id": r.id, "status": r.status, "total": r.total, "created_at": r.created_at}
            for r in rows
        ]
    finally:
        db.close()


# ─── Nav helper ───────────────────────────────────────────────────────────────

async def _show(q, text, kb, parse_mode=ParseMode.HTML):
    if q.message.photo or q.message.video:
        await q.message.reply_text(text, reply_markup=kb, parse_mode=parse_mode)
        try:
            await q.message.delete()
        except Exception:
            pass
    else:
        try:
            await q.edit_message_text(text, reply_markup=kb, parse_mode=parse_mode)
        except Exception:
            await q.message.reply_text(text, reply_markup=kb, parse_mode=parse_mode)


# ─── Bot menu — Categories ────────────────────────────────────────────────────

async def cb_menu(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer()
    cats = _cats()
    if not cats:
        await _show(q, "Menyu hozircha mavjud emas.", InlineKeyboardMarkup(BACK_HOME))
        return
    kb = [[InlineKeyboardButton(f"{c['emoji']} {c['name']}", callback_data=f"cat_{c['id']}")] for c in cats]
    kb.append([InlineKeyboardButton("🏠 Bosh sahifa", callback_data="main_menu")])
    await _show(q, "📋 <b>Kategoriyalar</b>\n\nQaysi bo'limdan buyurtma berasiz?", InlineKeyboardMarkup(kb))


# ─── Products ─────────────────────────────────────────────────────────────────

async def cb_cat(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer()
    cat_id = int(q.data[4:])
    prods  = _prods(cat_id)
    if not prods:
        await _show(q, "Bu kategoriyada mahsulot yo'q.", InlineKeyboardMarkup([
            [InlineKeyboardButton("🔙 Kategoriyalar", callback_data="menu")],
        ]))
        return
    kb = []
    for p in prods:
        price = int(p["price"] * (1 - p["discount"] / 100)) if p["discount"] else int(p["price"])
        badge = f" 🔥-{p['discount']}%" if p["discount"] else ""
        kb.append([InlineKeyboardButton(
            f"{p['emoji'] or '🍽️'} {p['name']} — {fmt(price)} so'm{badge}",
            callback_data=f"prod_{p['id']}",
        )])
    kb.append([InlineKeyboardButton("🔙 Kategoriyalar", callback_data="menu")])
    await _show(q, "🍽️ <b>Mahsulotlar</b>\n\nBitta tanlang:", InlineKeyboardMarkup(kb))


# ─── Product detail ───────────────────────────────────────────────────────────

async def cb_prod(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer()
    prod_id = int(q.data[5:])
    p = _prod(prod_id)
    if not p:
        await q.answer("Mahsulot topilmadi", show_alert=True)
        return

    price = int(p["price"] * (1 - p["discount"] / 100)) if p["discount"] else int(p["price"])

    parts = [f"<b>{h(p['name'])}</b>"]
    if p["discount"]:
        parts.append(f"<s>{fmt(int(p['price']))} so'm</s>  →  <b>{fmt(price)} so'm</b>  (-{p['discount']}%)")
    else:
        parts.append(f"<b>{fmt(price)} so'm</b>")
    if p["description"]:
        parts.append(f"\n{h(p['description'])}")
    if p["weight"]:
        parts.append(f"⚖️ {h(p['weight'])}")

    text = "\n".join(parts)
    kb   = InlineKeyboardMarkup([
        [InlineKeyboardButton("🛒 Savatga qo'shish", callback_data=f"add_{prod_id}")],
        [InlineKeyboardButton("🔙 Ortga",            callback_data=f"cat_{p['cat_id']}")],
    ])

    if p["image_url"]:
        try:
            await ctx.bot.send_photo(
                chat_id=q.message.chat_id,
                photo=p["image_url"],
                caption=text,
                reply_markup=kb,
                parse_mode=ParseMode.HTML,
            )
            try:
                await q.message.delete()
            except Exception:
                pass
            return
        except Exception as e:
            logger.warning(f"Photo send failed: {e}")

    await _show(q, text, kb)


# ─── Cart operations ──────────────────────────────────────────────────────────

async def cb_add(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    prod_id = int(q.data[4:])
    p = _prod(prod_id)
    if not p:
        await q.answer("Mahsulot topilmadi", show_alert=True)
        return
    cart  = ctx.user_data.setdefault("cart", [])
    price = int(p["price"] * (1 - p["discount"] / 100)) if p["discount"] else int(p["price"])
    for item in cart:
        if item["product_id"] == prod_id:
            item["qty"] += 1
            await q.answer(f"✅ {p['name']} × {item['qty']}")
            return
    cart.append({"product_id": prod_id, "name": p["name"], "price": price, "qty": 1, "emoji": p["emoji"] or "🍽️"})
    await q.answer(f"✅ {p['name']} savatga qo'shildi!")


def _cart_text(cart):
    lines = ["🛒 <b>Savatcha</b>\n"]
    for it in cart:
        lines.append(f"• {it['emoji']} {h(it['name'])} × {it['qty']} = {fmt(it['price'] * it['qty'])} so'm")
    subtotal = sum(i["price"] * i["qty"] for i in cart)
    lines.append(f"\n📦 Yetkazib berish: {fmt(DELIVERY)} so'm")
    lines.append(f"💰 <b>Jami: {fmt(subtotal + DELIVERY)} so'm</b>")
    return "\n".join(lines)


def _cart_kb(cart):
    kb = []
    for it in cart:
        kb.append([
            InlineKeyboardButton("➖", callback_data=f"dec_{it['product_id']}"),
            InlineKeyboardButton(f"{it['name'][:16]} ×{it['qty']}", callback_data="noop"),
            InlineKeyboardButton("➕", callback_data=f"inc_{it['product_id']}"),
        ])
    kb.append([InlineKeyboardButton("🗑️ Tozalash", callback_data="clear_cart")])
    kb.append([InlineKeyboardButton("✅ Buyurtma berish →", callback_data="checkout")])
    kb.append([InlineKeyboardButton("🏠 Bosh sahifa", callback_data="main_menu")])
    return InlineKeyboardMarkup(kb)


async def cb_cart(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer()
    cart = ctx.user_data.get("cart", [])
    if not cart:
        await _show(q, "🛒 Savatcha bo'sh\n\nMazali taomlarni tanlang!", InlineKeyboardMarkup([
            [InlineKeyboardButton("🍽️ Menyuga o'tish", callback_data="menu")],
            [InlineKeyboardButton("🏠 Bosh sahifa",     callback_data="main_menu")],
        ]))
        return
    await _show(q, _cart_text(cart), _cart_kb(cart))


async def cb_inc(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    q   = update.callback_query
    pid = int(q.data[4:])
    for it in ctx.user_data.get("cart", []):
        if it["product_id"] == pid:
            it["qty"] += 1
            break
    await q.answer()
    await cb_cart(update, ctx)


async def cb_dec(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    q    = update.callback_query
    pid  = int(q.data[4:])
    cart = ctx.user_data.get("cart", [])
    for i, it in enumerate(cart):
        if it["product_id"] == pid:
            it["qty"] -= 1
            if it["qty"] <= 0:
                cart.pop(i)
            break
    ctx.user_data["cart"] = cart
    await q.answer()
    await cb_cart(update, ctx)


async def cb_clear(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    ctx.user_data["cart"] = []
    await update.callback_query.answer("🗑️ Savatcha tozalandi")
    await cb_cart(update, ctx)


# ─── Checkout conversation ────────────────────────────────────────────────────

async def start_checkout(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    q    = update.callback_query
    await q.answer()
    cart = ctx.user_data.get("cart", [])
    if not cart:
        await q.answer("Savatcha bo'sh!", show_alert=True)
        return ConversationHandler.END

    subtotal = sum(i["price"] * i["qty"] for i in cart)
    lines    = ["📝 <b>Buyurtma rasmiylashtiruv</b>\n"]
    for it in cart:
        lines.append(f"  {it['emoji']} {h(it['name'])} × {it['qty']}")
    lines.append(f"\n💰 Jami: <b>{fmt(subtotal + DELIVERY)} so'm</b>\n")
    lines.append("Ismingizni kiriting:")

    await _show(q, "\n".join(lines), CANCEL_KB)
    return ASK_NAME


async def got_name(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    ctx.user_data["o_name"] = update.message.text.strip()
    await update.message.reply_text(
        "📞 Telefon raqamingiz?\n<i>(+998 XX XXX XX XX formatida)</i>",
        reply_markup=CANCEL_KB, parse_mode=ParseMode.HTML,
    )
    return ASK_PHONE


async def got_phone(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    ctx.user_data["o_phone"] = update.message.text.strip()
    await update.message.reply_text("📍 Yetkazib berish manzilingiz?", reply_markup=CANCEL_KB)
    return ASK_ADDRESS


async def got_address(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    ctx.user_data["o_address"] = update.message.text.strip()
    await update.message.reply_text(
        "💬 Qo'shimcha izoh? <i>(ixtiyoriy)</i>",
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("⏭️ O'tkazib yuborish", callback_data="co_skip_note")],
            [InlineKeyboardButton("❌ Bekor qilish",       callback_data="co_cancel")],
        ]),
        parse_mode=ParseMode.HTML,
    )
    return ASK_NOTE


async def got_note(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    ctx.user_data["o_note"] = update.message.text.strip()
    await _ask_payment(update.message)
    return ASK_PAYMENT


async def cb_skip_note(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer()
    ctx.user_data["o_note"] = ""
    await _ask_payment(q.message)
    return ASK_PAYMENT


async def _ask_payment(msg):
    await msg.reply_text(
        "💳 To'lov usulini tanlang:",
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("💵 Naqd pul",     callback_data="pay_naqd")],
            [InlineKeyboardButton("💳 Bank kartasi", callback_data="pay_karta")],
            [InlineKeyboardButton("📱 Online",        callback_data="pay_online")],
            [InlineKeyboardButton("❌ Bekor qilish",  callback_data="co_cancel")],
        ]),
    )


async def finish_order(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    q       = update.callback_query
    await q.answer()
    payment = q.data[4:]

    name    = ctx.user_data.get("o_name", "")
    phone   = ctx.user_data.get("o_phone", "")
    address = ctx.user_data.get("o_address", "")
    note    = ctx.user_data.get("o_note", "")
    cart    = ctx.user_data.get("cart", [])
    subtotal = sum(i["price"] * i["qty"] for i in cart)

    items = [
        {"product_id": i["product_id"], "name": i["name"],
         "price": i["price"], "qty": i["qty"], "emoji": i.get("emoji", "")}
        for i in cart
    ]

    result   = _create_order({
        "name": name, "phone": phone, "address": address,
        "note": note, "payment": payment,
        "subtotal": subtotal, "items": items,
        "chat_id": q.message.chat_id,
    })

    ctx.user_data["cart"] = []
    for key in ("o_name", "o_phone", "o_address", "o_note"):
        ctx.user_data.pop(key, None)

    order_id = result["id"]
    total    = result["total"]
    pay_disp = PAY_LABELS.get(payment, payment)

    await q.message.reply_text(
        f"🎉 <b>Buyurtma qabul qilindi!</b>\n\n"
        f"📦 Buyurtma <b>#{order_id}</b>\n"
        f"💰 Jami: <b>{fmt(total)} so'm</b>\n"
        f"💳 To'lov: {pay_disp}\n\n"
        f"Yetkazib berish taxminan <b>30–45 daqiqa</b> ichida.\n"
        f"Status o'zgarishini Telegram orqali bilasiz 👇",
        reply_markup=InlineKeyboardMarkup(BACK_HOME),
        parse_mode=ParseMode.HTML,
    )

    if ADMIN_CHAT:
        items_lines = "\n".join(
            f"  {it.get('emoji','')}{' ' if it.get('emoji') else ''}"
            f"{h(it['name'])} × {it['qty']} = {fmt(it['price']*it['qty'])} so'm"
            for it in items
        )
        note_line = f"💬 {h(note)}\n" if note else ""
        admin_txt = (
            f"🆕 <b>YANGI BUYURTMA #{order_id}</b>\n\n"
            f"👤 <b>{h(name)}</b>\n"
            f"📞 {h(phone)}\n"
            f"📍 {h(address)}\n"
            f"{note_line}"
            f"💳 {pay_disp}\n\n"
            f"<b>Mahsulotlar:</b>\n{items_lines}\n\n"
            f"📦 Yetkazish: {fmt(DELIVERY)} so'm\n"
            f"💰 <b>Jami: {fmt(total)} so'm</b>"
        )
        try:
            await ctx.bot.send_message(
                chat_id=ADMIN_CHAT,
                text=admin_txt,
                parse_mode=ParseMode.HTML,
                reply_markup=admin_kb(order_id),
            )
        except Exception as e:
            logger.error(f"Admin notify error: {e}")

    return ConversationHandler.END


async def cancel_checkout(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    for key in ("o_name", "o_phone", "o_address", "o_note"):
        ctx.user_data.pop(key, None)
    q = update.callback_query
    if q:
        await q.answer()
        await q.message.reply_text("❌ Buyurtma bekor qilindi.")
    elif update.message:
        await update.message.reply_text("❌ Buyurtma bekor qilindi.")
    # Return to main menu
    ctx.user_data.setdefault("cart", [])
    await _send_welcome(
        (update.callback_query.message if update.callback_query else update.message),
        ctx,
        edit=False,
    )
    return ConversationHandler.END


# ─── Admin status panel ───────────────────────────────────────────────────────

async def cb_admin_status(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    if q.message.chat_id != ADMIN_CHAT:
        await q.answer("Ruxsat yo'q", show_alert=True)
        return

    parts    = q.data.split("_")   # as_confirmed_5 → ['as','confirmed','5']
    status   = parts[1]
    order_id = int(parts[-1])

    result = _set_status(order_id, status)
    if not result:
        await q.answer("Buyurtma topilmadi", show_alert=True)
        return

    label = STATUS_LABELS.get(status, status)
    await q.answer(f"✅ {label}")

    try:
        new_txt = (q.message.text or "") + f"\n\n✏️ Status: <b>{label}</b>"
        await q.edit_message_text(new_txt, parse_mode=ParseMode.HTML, reply_markup=admin_kb(order_id))
    except Exception:
        pass

    msg = USER_MSGS.get(status, "").replace("{id}", str(order_id))
    if msg and result.get("chat_id"):
        try:
            await ctx.bot.send_message(
                chat_id=int(result["chat_id"]),
                text=msg,
                parse_mode=ParseMode.HTML,
            )
        except Exception as e:
            logger.error(f"User notify error: {e}")


# ─── My orders ────────────────────────────────────────────────────────────────

async def cb_my_orders(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer()
    orders = _user_orders(q.message.chat_id)
    if not orders:
        await _show(q, "📦 Hali buyurtma bermagansiz.", InlineKeyboardMarkup([
            [InlineKeyboardButton("🍽️ Buyurtma berish", callback_data="menu")],
            [InlineKeyboardButton("🏠 Bosh sahifa",     callback_data="main_menu")],
        ]))
        return
    lines = ["📦 <b>So'nggi buyurtmalarim:</b>\n"]
    for o in orders:
        dt = o["created_at"].strftime("%d.%m %H:%M") if o["created_at"] else ""
        lines.append(
            f"<b>#{o['id']}</b>  {STATUS_LABELS.get(o['status'], o['status'])}  "
            f"|  {fmt(o['total'])} so'm  |  {dt}"
        )
    await _show(q, "\n".join(lines), InlineKeyboardMarkup(BACK_HOME))


# ─── Noop ─────────────────────────────────────────────────────────────────────

async def cb_noop(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.callback_query.answer()


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    if not BOT_TOKEN:
        print("=" * 50)
        print("❌  BOT_TOKEN topilmadi!")
        print("    .env fayliga qo'shing:")
        print("    BOT_TOKEN=your_token_here")
        print("    ADMIN_CHAT_ID=your_chat_id_here")
        print("    WEBAPP_URL=https://yourdomain.com")
        print("=" * 50)
        sys.exit(1)

    pkl_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "bot_data.pkl")
    persistence = PicklePersistence(filepath=pkl_path)

    app = Application.builder().token(BOT_TOKEN).persistence(persistence).build()

    checkout_conv = ConversationHandler(
        entry_points=[CallbackQueryHandler(start_checkout, pattern="^checkout$")],
        states={
            ASK_NAME: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, got_name),
                CallbackQueryHandler(cancel_checkout, pattern="^co_cancel$"),
            ],
            ASK_PHONE: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, got_phone),
                CallbackQueryHandler(cancel_checkout, pattern="^co_cancel$"),
            ],
            ASK_ADDRESS: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, got_address),
                CallbackQueryHandler(cancel_checkout, pattern="^co_cancel$"),
            ],
            ASK_NOTE: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, got_note),
                CallbackQueryHandler(cb_skip_note,    pattern="^co_skip_note$"),
                CallbackQueryHandler(cancel_checkout, pattern="^co_cancel$"),
            ],
            ASK_PAYMENT: [
                CallbackQueryHandler(finish_order,    pattern="^pay_"),
                CallbackQueryHandler(cancel_checkout, pattern="^co_cancel$"),
            ],
        },
        fallbacks=[
            CommandHandler("cancel", cancel_checkout),
            CommandHandler("start",  cancel_checkout),
        ],
        per_message=False,
        allow_reentry=True,
    )

    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(checkout_conv)

    # Language
    app.add_handler(CallbackQueryHandler(cb_lang,        pattern="^lang_"))
    app.add_handler(CallbackQueryHandler(cb_change_lang, pattern="^change_lang$"))

    # Navigation
    app.add_handler(CallbackQueryHandler(cb_main_menu,   pattern="^main_menu$"))
    app.add_handler(CallbackQueryHandler(cb_menu,        pattern="^menu$"))
    app.add_handler(CallbackQueryHandler(cb_cat,         pattern="^cat_"))
    app.add_handler(CallbackQueryHandler(cb_prod,        pattern="^prod_"))
    app.add_handler(CallbackQueryHandler(cb_add,         pattern="^add_"))
    app.add_handler(CallbackQueryHandler(cb_cart,        pattern="^cart$"))
    app.add_handler(CallbackQueryHandler(cb_inc,         pattern="^inc_"))
    app.add_handler(CallbackQueryHandler(cb_dec,         pattern="^dec_"))
    app.add_handler(CallbackQueryHandler(cb_clear,       pattern="^clear_cart$"))
    app.add_handler(CallbackQueryHandler(cb_my_orders,   pattern="^my_orders$"))

    # Admin
    app.add_handler(CallbackQueryHandler(cb_admin_status, pattern="^as_"))

    # Misc
    app.add_handler(CallbackQueryHandler(cb_noop, pattern="^noop$"))

    webapp_status = WEBAPP_URL if WEBAPP_URL else "sozlanmagan (faqat bot menyu)"
    admin_info    = str(ADMIN_CHAT) if ADMIN_CHAT else "belgilanmagan"
    print("=" * 55)
    print("🤖  OlimFood Bot ishga tushdi!")
    print(f"    Web App : {webapp_status}")
    print(f"    Admin   : {admin_info}")
    print("    Ctrl+C bilan to'xtatish mumkin.")
    print("=" * 55)
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
