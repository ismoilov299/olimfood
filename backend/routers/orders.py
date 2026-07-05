import os
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas
from auth import get_current_admin
from database import get_db

router = APIRouter(prefix="/api/orders", tags=["orders"])

VALID_STATUSES = {"new", "confirmed", "preparing", "delivering", "delivered", "cancelled"}

_NOTIFY_MSGS = {
    "confirmed":  "✅ Buyurtmangiz #{id} tasdiqlandi! Tez orada tayyorlanadi 🍽️",
    "preparing":  "👨‍🍳 Buyurtmangiz #{id} tayyorlanmoqda! Kutib turing...",
    "delivering": "🚗 Buyurtmangiz #{id} yo'lda! Eshikni kuting 🏠",
    "delivered":  "🟢 Buyurtmangiz #{id} yetkazildi! Ishtahangiz yo'l bo'lsin! 🙏",
    "cancelled":  "❌ Buyurtmangiz #{id} bekor qilindi.",
}


def _tg_notify(chat_id: str, order_id: int, status: str) -> None:
    token = os.getenv("BOT_TOKEN", "")
    msg   = _NOTIFY_MSGS.get(status, "").replace("{id}", str(order_id))
    if not token or not chat_id or not msg:
        return
    try:
        httpx.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": chat_id, "text": msg},
            timeout=5.0,
        )
    except Exception:
        pass


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
def create_order(data: schemas.OrderCreate, db: Session = Depends(get_db)):
    order = models.Order(
        name=data.name,
        phone=data.phone,
        address=data.address,
        note=data.note,
        payment=data.payment,
        subtotal=data.subtotal,
        delivery=data.delivery,
        total=data.total,
        items=[item.model_dump() for item in data.items],
        status="new",
        telegram_chat_id=data.telegram_chat_id,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
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
