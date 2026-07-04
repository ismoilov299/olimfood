from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from auth import get_current_admin
from database import get_db
from localize import resolve
from cattree import creates_cycle

router = APIRouter(prefix="/api/categories", tags=["categories"])


def _enrich(db: Session, cat: models.Category, lang: str) -> schemas.CategoryOut:
    out = schemas.CategoryOut.model_validate(cat)
    out.name = resolve(cat, "name", lang)
    out.product_count = db.query(models.Product).filter(
        models.Product.cat_id == cat.id,
        models.Product.available == True,
    ).count()
    out.children_count = db.query(models.Category).filter(models.Category.parent_id == cat.id).count()
    return out


@router.get("", response_model=List[schemas.CategoryOut])
def get_categories(lang: str = Query("uz"), db: Session = Depends(get_db)):
    cats = db.query(models.Category).order_by(models.Category.order).all()
    return [_enrich(db, c, lang) for c in cats]


@router.post("", response_model=schemas.CategoryOut)
def create_category(
    data: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    if data.parent_id is not None:
        parent = db.query(models.Category).filter(models.Category.id == data.parent_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Ota kategoriya topilmadi")
    cat = models.Category(**data.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return _enrich(db, cat, "uz")


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

    fields = data.model_dump(exclude_unset=True)
    if "parent_id" in fields and fields["parent_id"] is not None:
        new_parent_id = fields["parent_id"]
        if new_parent_id == cat_id:
            raise HTTPException(status_code=400, detail="Kategoriya o'zining ota kategoriyasi bo'la olmaydi")
        parent = db.query(models.Category).filter(models.Category.id == new_parent_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Ota kategoriya topilmadi")
        if creates_cycle(db, cat_id, new_parent_id):
            raise HTTPException(status_code=400, detail="Bu kategoriyani o'z sub-kategoriyasiga ota qilib bo'lmaydi")

    for field, value in fields.items():
        setattr(cat, field, value)
    db.commit()
    db.refresh(cat)
    return _enrich(db, cat, "uz")


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
    has_children = db.query(models.Category).filter(models.Category.parent_id == cat_id).first()
    if has_children:
        raise HTTPException(
            status_code=400,
            detail="Bu kategoriyada sub-kategoriyalar mavjud. Avval ularni o'chiring.",
        )
    db.delete(cat)
    db.commit()
    return {"ok": True}
