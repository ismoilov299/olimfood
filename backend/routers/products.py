from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas
from auth import get_current_admin
from database import get_db
from localize import resolve, LANGS
from cattree import descendant_ids

router = APIRouter(prefix="/api/products", tags=["products"])


def _enrich(product: models.Product, lang: str) -> schemas.ProductOut:
    out = schemas.ProductOut.model_validate(product)
    out.name            = resolve(product, "name", lang)
    out.description     = resolve(product, "description", lang)
    out.characteristics = resolve(product, "characteristics", lang)
    out.weight          = resolve(product, "weight", lang)
    if product.category:
        out.category_name  = resolve(product.category, "name", lang)
        out.category_emoji = product.category.emoji
    return out


@router.get("", response_model=List[schemas.ProductOut])
def get_products(
    cat_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    available: Optional[bool] = Query(None),
    popular: Optional[bool] = Query(None),
    lang: str = Query("uz"),
    db: Session = Depends(get_db),
):
    q = db.query(models.Product)
    if cat_id:
        # Ota kategoriya tanlansa, uning barcha sub-kategoriyalaridagi mahsulotlar ham kiradi
        ids = descendant_ids(db, cat_id)
        q = q.filter(models.Product.cat_id.in_(ids))
    if search:
        like = f"%{search}%"
        q = q.filter(or_(*[
            getattr(models.Product, f"name_{l}").ilike(like) for l in LANGS
        ]))
    if available is not None:
        q = q.filter(models.Product.available == available)
    if popular is not None:
        q = q.filter(models.Product.popular == popular)
    products = q.order_by(models.Product.id).all()
    return [_enrich(p, lang) for p in products]


@router.get("/{product_id}", response_model=schemas.ProductOut)
def get_product(product_id: int, lang: str = Query("uz"), db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
    return _enrich(product, lang)


@router.post("", response_model=schemas.ProductOut)
def create_product(
    data: schemas.ProductCreate,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    cat = db.query(models.Category).filter(models.Category.id == data.cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Kategoriya topilmadi")
    product = models.Product(**data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return _enrich(product, "uz")


@router.put("/{product_id}", response_model=schemas.ProductOut)
def update_product(
    product_id: int,
    data: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return _enrich(product, "uz")


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
    db.delete(product)
    db.commit()
    return {"ok": True}
