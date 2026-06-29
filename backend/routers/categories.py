from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from auth import get_current_admin
from database import get_db

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("", response_model=List[schemas.CategoryOut])
def get_categories(db: Session = Depends(get_db)):
    cats = db.query(models.Category).order_by(models.Category.order).all()
    result = []
    for c in cats:
        count = db.query(models.Product).filter(
            models.Product.cat_id == c.id,
            models.Product.available == True,
        ).count()
        out = schemas.CategoryOut.model_validate(c)
        out.product_count = count
        result.append(out)
    return result


@router.post("", response_model=schemas.CategoryOut)
def create_category(
    data: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    cat = models.Category(**data.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    out = schemas.CategoryOut.model_validate(cat)
    out.product_count = 0
    return out


@router.put("/{cat_id}", response_model=schemas.CategoryOut)
def update_category(
    cat_id: int,
    data: schemas.CategoryUpdate,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    cat = db.query(models.Category).filter(models.Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Kategoriya topilmadi")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(cat, field, value)
    db.commit()
    db.refresh(cat)
    count = db.query(models.Product).filter(models.Product.cat_id == cat.id).count()
    out = schemas.CategoryOut.model_validate(cat)
    out.product_count = count
    return out


@router.delete("/{cat_id}")
def delete_category(
    cat_id: int,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    cat = db.query(models.Category).filter(models.Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Kategoriya topilmadi")
    has_products = db.query(models.Product).filter(models.Product.cat_id == cat_id).first()
    if has_products:
        raise HTTPException(
            status_code=400,
            detail="Bu kategoriyada mahsulotlar mavjud. Avval mahsulotlarni o'chiring.",
        )
    db.delete(cat)
    db.commit()
    return {"ok": True}
