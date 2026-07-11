import os
from html import escape
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas
from auth import get_current_admin
from database import get_db
from routers import promos

router = APIRouter(prefix="/api/orders", tags=["orders"])

VALID_STATUSES = {"new", "confirmed", "preparing", "delivering", "delivered", "cancelled"}

_NOTIFY_MSGS = {
    "confirmed":  "✅ Буюртмангиз #{id} тасдиқланди! Тез орада тайёрланади 🍽️",
    "preparing":  "👨‍🍳 Буюртмангиз #{id} тайёрланмоқда! Кутиб туринг...",
    "delivering": "🚗 Буюртмангиз #{id} йўлда! Эшикни кутинг 🏠",
    "delivered":  "🟢 Буюртмангиз #{id} етказилди! Иштаҳангиз очиқ бўлсин! 🙏",
    "cancelled":  "❌ Буюртмангиз #{id} бекор қилинди.",
}

# Kept in sync with the bot's own order flow (telegram_bot/bot.py) so an order
# placed from the Mini App is announced exactly like a bot-placed one.
_PAY_LABELS = {"naqd": "💵 Нақд пул"}

_h   = lambda s: escape(str(s or ""))
_fmt = lambda n: f"{int(n):,}".replace(",", " ")


def _tg_send(chat_id, text: str, reply_markup: dict | None = None) -> None:
    """Fire-and-forget Telegram sendMessage (HTML). Never raises."""
    token = os.getenv("BOT_TOKEN", "")
    if not token or not chat_id or not text:
        return
    payload = {"chat_id": chat_id, "text": text, "parse_mode": "HTML"}
    if reply_markup:
        payload["reply_markup"] = reply_markup
    try:
        httpx.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json=payload,
            timeout=5.0,
        )
    except Exception:
        pass


def _feedback_kb(order_id: int) -> dict | None:
    """Inline button linking to the feedback form, sent once an order is delivered."""
    base = os.getenv("WEBAPP_URL", "").rstrip("/")
    if not base:
        return None
    return {"inline_keyboard": [[
        {"text": "⭐ Fikr bildirish", "url": f"{base}/feedback/{order_id}"},
    ]]}


def _tg_notify(chat_id: str, order_id: int, status: str) -> None:
    reply_markup = _feedback_kb(order_id) if status == "delivered" else None
    _tg_send(chat_id, _NOTIFY_MSGS.get(status, "").replace("{id}", str(order_id)), reply_markup=reply_markup)


def _admin_kb(oid: int) -> dict:
    """Status-change buttons handled by the running bot's `^as_` callback."""
    return {"inline_keyboard": [
        [
            {"text": "✅ Тасдиқлаш",       "callback_data": f"as_confirmed_{oid}"},
            {"text": "👨‍🍳 Тайёрланмоқда",  "callback_data": f"as_preparing_{oid}"},
        ],
        [
            {"text": "🚗 Етказилмоқда",   "callback_data": f"as_delivering_{oid}"},
            {"text": "🟢 Етказилди",      "callback_data": f"as_delivered_{oid}"},
        ],
        [{"text": "❌ Бекор қилиш",        "callback_data": f"as_cancelled_{oid}"}],
    ]}


def _notify_new_order(order: models.Order) -> None:
    """Announce a Mini App / web order: confirm to the customer and alert admins.

    Bot-placed orders write straight to the DB (not this endpoint), so this never
    double-fires for them.
    """
    pay_disp = _PAY_LABELS.get(order.payment, order.payment)

    # 1. Customer confirmation (only Telegram users carry a chat id).
    if order.telegram_chat_id:
        _tg_send(
            order.telegram_chat_id,
            f"🎉 <b>Буюртма қабул қилинди!</b>\n\n"
            f"📦 Буюртма <b>#{order.id}</b>\n"
            f"💰 Жами: <b>{_fmt(order.total)} сўм</b>\n"
            f"💳 Тўлов: {pay_disp}\n\n"
            f"Етказиб бериш тахминан <b>30–45 дақиқа</b> ичида.\n"
            f"Статус ўзгаришини Telegram орқали биласиз 👇",
        )

    # 2. Admin group alert with actionable status buttons.
    admin_raw = os.getenv("ADMIN_CHAT_ID", "0")
    if not admin_raw.lstrip("-").isdigit() or int(admin_raw) == 0:
        return
    items_lines = "\n".join(
        f"  {it.get('emoji','')}{' ' if it.get('emoji') else ''}"
        f"{_h(it.get('name',''))} × {it.get('qty',0)} = "
        f"{_fmt(it.get('price',0) * it.get('qty',0))} сўм"
        for it in (order.items or [])
    )
    note_line = f"💬 {_h(order.note)}\n" if order.note else ""
    promo_line = (
        f"🎟 Промокод: <b>{_h(order.promo_code)}</b> (−{_fmt(order.discount)} сўм)\n"
        if order.discount and order.promo_code else ""
    )
    admin_txt = (
        f"🆕 <b>ЯНГИ БУЮРТМА #{order.id}</b>\n\n"
        f"👤 <b>{_h(order.name)}</b>\n"
        f"📞 {_h(order.phone)}\n"
        f"📍 {_h(order.address)}\n"
        f"{note_line}"
        f"💳 {pay_disp}\n\n"
        f"<b>Маҳсулотлар:</b>\n{items_lines}\n\n"
        f"{promo_line}"
        f"📦 Етказиш: {_fmt(order.delivery)} сўм\n"
        f"💰 <b>Жами: {_fmt(order.total)} сўм</b>"
    )
    _tg_send(int(admin_raw), admin_txt, reply_markup=_admin_kb(order.id))


@router.get("", response_model=List[schemas.OrderOut])
def get_orders(
    status: Optional[str] = Query(None),
    _: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    q = db.query(models.Order)
    if status:
        q = q.filter(models.Order.status == status)
    return q.order_by(models.Order.created_at.desc()).all()


@router.get("/my", response_model=List[schemas.OrderOut])
def get_my_orders(
    telegram_chat_id: str = Query(...),
    db: Session = Depends(get_db),
):
    """Public endpoint: a Telegram Mini App user's own order history."""
    if not telegram_chat_id:
        return []
    return (
        db.query(models.Order)
        .filter(models.Order.telegram_chat_id == telegram_chat_id)
        .order_by(models.Order.created_at.desc())
        .all()
    )


@router.get("/{order_id}", response_model=schemas.OrderOut)
def get_order(
    order_id: int,
    _: models.Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Buyurtma topilmadi")
    return order


@router.post("", response_model=schemas.OrderOut)
def create_order(
    data: schemas.OrderCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    # Re-validate the promo server-side so the discount and total can't be
    # tampered with from the client. An invalid/expired code is silently ignored
    # (no discount) rather than rejecting the whole order.
    discount = 0
    applied_code = ""
    promo = None
    if data.promo_code:
        promo = promos.get_by_code(db, data.promo_code)
        amount, reason = promos.evaluate(promo, data.subtotal)
        if not reason:
            discount = amount
            applied_code = promo.code

    total = max(0, data.subtotal - discount) + data.delivery

    order = models.Order(
        name=data.name,
        phone=data.phone,
        address=data.address,
        note=data.note,
        payment=data.payment,
        subtotal=data.subtotal,
        delivery=data.delivery,
        discount=discount,
        promo_code=applied_code,
        total=total,
        items=[item.model_dump() for item in data.items],
        status="new",
        telegram_chat_id=data.telegram_chat_id,
    )
    db.add(order)
    if promo is not None and applied_code:
        promo.used_count = (promo.used_count or 0) + 1
    db.commit()
    db.refresh(order)
    background_tasks.add_task(_notify_new_order, order)
    return order


@router.patch("/{order_id}/status", response_model=schemas.OrderOut)
def update_order_status(
    order_id: int,
    data: schemas.OrderStatusUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    if data.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Status noto'g'ri. Ruxsat etilgan: {VALID_STATUSES}")
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Buyurtma topilmadi")
    order.status = data.status
    db.commit()
    db.refresh(order)
    if order.telegram_chat_id:
        background_tasks.add_task(_tg_notify, order.telegram_chat_id, order.id, order.status)
    return order


@router.delete("/{order_id}")
def delete_order(
    order_id: int,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Buyurtma topilmadi")
    db.delete(order)
    db.commit()
    return {"ok": True}
