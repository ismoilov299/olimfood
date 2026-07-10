from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from auth import get_current_admin
from database import get_db

router = APIRouter(prefix="/api/promos", tags=["promos"])


def _norm(code: str) -> str:
    return (code or "").strip().upper()


def _expired(promo: models.PromoCode) -> bool:
    if not promo.expires_at:
        return False
    exp = promo.expires_at
    now = datetime.now(exp.tzinfo) if exp.tzinfo else datetime.utcnow()
    return exp < now


def evaluate(promo: models.PromoCode | None, subtotal: float):
    """Validate a promo against a subtotal.

    Returns (discount_amount, reason); reason == "" means the code is valid.
    Shared by the public /validate endpoint and order creation so the customer
    UI and the server agree on the discount.
    """
    if not promo or not promo.active:
        return 0, "invalid"
    if _expired(promo):
        return 0, "expired"
    if promo.usage_limit and promo.used_count >= promo.usage_limit:
        return 0, "limit"
    if subtotal < (promo.min_order or 0):
        return 0, "min_order"
    if promo.discount_type == "percent":
        d = subtotal * (promo.discount_value or 0) / 100
        if promo.max_discount and promo.max_discount > 0:
            d = min(d, promo.max_discount)
    else:  # fixed
        d = promo.discount_value or 0
    d = min(d, subtotal)  # never discount more than the goods
    return round(d), ""


def get_by_code(db: Session, code: str) -> models.PromoCode | None:
    if not code:
        return None
    return db.query(models.PromoCode).filter(models.PromoCode.code == _norm(code)).first()


# ── Public ──────────────────────────────────────────
@router.get("/validate", response_model=schemas.PromoValidateOut)
def validate_promo(
    code: str = Query(...),
    subtotal: float = Query(0),
    db: Session = Depends(get_db),
):
    """Public: check a code and return the discount for a given subtotal."""
    promo = get_by_code(db, code)
    discount, reason = evaluate(promo, subtotal)
    if reason or not promo:
        return schemas.PromoValidateOut(valid=False, reason=reason or "invalid", code=_norm(code))
    return schemas.PromoValidateOut(
        valid=True,
        code=promo.code,
        discount_type=promo.discount_type,
        discount_value=promo.discount_value,
        discount=discount,
        min_order=promo.min_order or 0,
    )


# ── Admin CRUD ──────────────────────────────────────
@router.get("", response_model=List[schemas.PromoCodeOut])
def list_promos(
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    return db.query(models.PromoCode).order_by(models.PromoCode.id.desc()).all()


@router.post("", response_model=schemas.PromoCodeOut)
def create_promo(
    data: schemas.PromoCodeCreate,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    code = _norm(data.code)
    if not code:
        raise HTTPException(status_code=400, detail="Promokod bo'sh bo'lishi mumkin emas")
    if db.query(models.PromoCode).filter(models.PromoCode.code == code).first():
        raise HTTPException(status_code=400, detail="Bu promokod allaqachon mavjud")
    promo = models.PromoCode(**{**data.model_dump(), "code": code})
    db.add(promo)
    db.commit()
    db.refresh(promo)
    return promo


@router.put("/{promo_id}", response_model=schemas.PromoCodeOut)
def update_promo(
    promo_id: int,
    data: schemas.PromoCodeUpdate,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    promo = db.query(models.PromoCode).filter(models.PromoCode.id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promokod topilmadi")
    fields = data.model_dump(exclude_unset=True)
    if "code" in fields and fields["code"] is not None:
        new_code = _norm(fields["code"])
        clash = db.query(models.PromoCode).filter(
            models.PromoCode.code == new_code, models.PromoCode.id != promo_id
        ).first()
        if clash:
            raise HTTPException(status_code=400, detail="Bu promokod allaqachon mavjud")
        fields["code"] = new_code
    for field, value in fields.items():
        setattr(promo, field, value)
    db.commit()
    db.refresh(promo)
    return promo


@router.delete("/{promo_id}")
def delete_promo(
    promo_id: int,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    promo = db.query(models.PromoCode).filter(models.PromoCode.id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promokod topilmadi")
    db.delete(promo)
    db.commit()
    return {"ok": True}
