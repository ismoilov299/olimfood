from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from auth import get_current_admin
from database import get_db

router = APIRouter(prefix="/api/feedback", tags=["feedback"])


@router.get("", response_model=List[schemas.FeedbackAdminOut])
def list_feedback(
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    rows = db.query(models.Feedback).order_by(models.Feedback.created_at.desc()).all()
    out = []
    for f in rows:
        item = schemas.FeedbackAdminOut.model_validate(f)
        item.customer_name = f.order.name if f.order else ""
        out.append(item)
    return out


@router.get("/{order_id}", response_model=schemas.FeedbackContextOut)
def get_feedback_context(order_id: int, db: Session = Depends(get_db)):
    """Public: lets the feedback form page (opened from a Telegram link) show
    either the rating form or a 'thanks, already submitted' state."""
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Buyurtma topilmadi")
    return schemas.FeedbackContextOut(order_id=order.id, status=order.status, feedback=order.feedback)


@router.post("/{order_id}", response_model=schemas.FeedbackOut)
def submit_feedback(order_id: int, data: schemas.FeedbackCreate, db: Session = Depends(get_db)):
    """Public: the customer submits this from the feedback link sent once
    their order is marked delivered. One feedback per order."""
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Buyurtma topilmadi")
    if order.status != "delivered":
        raise HTTPException(status_code=400, detail="Buyurtma hali yetkazilmagan")
    if order.feedback:
        raise HTTPException(status_code=409, detail="Fikr allaqachon yuborilgan")

    feedback = models.Feedback(order_id=order.id, **data.model_dump())
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback
