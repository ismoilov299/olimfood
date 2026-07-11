from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas
from auth import get_current_admin
from database import get_db
from localize import resolve

router = APIRouter(prefix="/api/certificates", tags=["certificates"])


def _enrich(cert: models.Certificate, lang: str) -> schemas.CertificateOut:
    out = schemas.CertificateOut.model_validate(cert)
    out.name = resolve(cert, "name", lang)
    out.category_ids = [c.id for c in cert.categories]
    return out


def _apply_categories(db: Session, cert: models.Certificate, category_ids: List[int]) -> None:
    cert.categories = (
        db.query(models.Category).filter(models.Category.id.in_(category_ids)).all()
        if category_ids else []
    )


@router.get("", response_model=List[schemas.CertificateOut])
def get_certificates(
    active: Optional[bool] = Query(None),
    lang: str = Query("uz"),
    db: Session = Depends(get_db),
):
    q = db.query(models.Certificate)
    if active is not None:
        q = q.filter(models.Certificate.active == active)
    certs = q.order_by(models.Certificate.id).all()
    return [_enrich(c, lang) for c in certs]


@router.post("", response_model=schemas.CertificateOut)
def create_certificate(
    data: schemas.CertificateCreate,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    cert = models.Certificate(**data.model_dump(exclude={"category_ids"}))
    _apply_categories(db, cert, data.category_ids)
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return _enrich(cert, "uz")


@router.put("/{cert_id}", response_model=schemas.CertificateOut)
def update_certificate(
    cert_id: int,
    data: schemas.CertificateUpdate,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    cert = db.query(models.Certificate).filter(models.Certificate.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Sertifikat topilmadi")
    fields = data.model_dump(exclude_unset=True, exclude={"category_ids"})
    for field, value in fields.items():
        setattr(cert, field, value)
    if data.category_ids is not None:
        _apply_categories(db, cert, data.category_ids)
    db.commit()
    db.refresh(cert)
    return _enrich(cert, "uz")


@router.delete("/{cert_id}")
def delete_certificate(
    cert_id: int,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    cert = db.query(models.Certificate).filter(models.Certificate.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Sertifikat topilmadi")
    db.delete(cert)
    db.commit()
    return {"ok": True}
