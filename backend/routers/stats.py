from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
import models, schemas
from auth import get_current_admin
from database import get_db

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("", response_model=schemas.StatsOut)
def get_stats(
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    today = date.today()

    total_products    = db.query(models.Product).count()
    total_categories  = db.query(models.Category).count()
    total_orders      = db.query(models.Order).count()
    new_orders        = db.query(models.Order).filter(models.Order.status == "new").count()

    today_orders = db.query(models.Order).filter(
        func.date(models.Order.created_at) == today
    ).count()

    revenue_row = db.query(func.sum(models.Order.total)).filter(
        models.Order.status != "cancelled"
    ).scalar()
    total_revenue = float(revenue_row or 0)

    return schemas.StatsOut(
        total_products=total_products,
        total_categories=total_categories,
        today_orders=today_orders,
        total_orders=total_orders,
        total_revenue=total_revenue,
        new_orders=new_orders,
    )
