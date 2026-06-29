from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from auth import get_current_admin
from database import get_db

router = APIRouter(prefix="/api/banners", tags=["banners"])


@router.get("", response_model=List[schemas.BannerOut])
def get_banners(db: Session = Depends(get_db)):
    return db.query(models.Banner).order_by(models.Banner.id).all()


@router.post("", response_model=schemas.BannerOut)
def create_banner(
    data: schemas.BannerCreate,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    banner = models.Banner(**data.model_dump())
    db.add(banner)
    db.commit()
    db.refresh(banner)
    return banner


@router.put("/{banner_id}", response_model=schemas.BannerOut)
def update_banner(
    banner_id: int,
    data: schemas.BannerUpdate,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    banner = db.query(models.Banner).filter(models.Banner.id == banner_id).first()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner topilmadi")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(banner, field, value)
    db.commit()
    db.refresh(banner)
    return banner


@router.delete("/{banner_id}")
def delete_banner(
    banner_id: int,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    banner = db.query(models.Banner).filter(models.Banner.id == banner_id).first()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner topilmadi")
    db.delete(banner)
    db.commit()
    return {"ok": True}
