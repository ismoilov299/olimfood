from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas
from auth import get_current_admin
from database import get_db

router = APIRouter(prefix="/api/products", tags=["products"])


def _enrich(product: models.Product) -> schemas.ProductOut:
    out = schemas.ProductOut.model_validate(product)
    if product.category:
        out.category_name  = product.category.name
        out.category_emoji = product.category.emoji
    return out


@router.get("", response_model=List[schemas.ProductOut])
def get_products(
    cat_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    available: Optional[bool] = Query(None),
    popular: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(models.Product)
    if cat_id:
        q = q.filter(models.Product.cat_id == cat_id)
    if search:
        q = q.filter(models.Product.name.ilike(f"%{search}%"))
    if available is not None:
        q = q.filter(models.Product.available == available)
    if popular is not None:
        q = q.filter(models.Product.popular == popular)
    products = q.order_by(models.Product.id).all()
    return [_enrich(p) for p in products]


@router.get("/{product_id}", response_model=schemas.ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
    return _enrich(product)


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
    return _enrich(product)


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
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return _enrich(product)


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
