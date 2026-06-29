from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas
from auth import get_current_admin
from database import get_db

router = APIRouter(prefix="/api/orders", tags=["orders"])

VALID_STATUSES = {"new", "confirmed", "preparing", "delivering", "delivered", "cancelled"}


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
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.patch("/{order_id}/status", response_model=schemas.OrderOut)
def update_order_status(
    order_id: int,
    data: schemas.OrderStatusUpdate,
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
