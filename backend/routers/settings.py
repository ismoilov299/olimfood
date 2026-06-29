from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import models
from auth import get_current_admin
from database import get_db

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("/{key}")
def get_setting(key: str, db: Session = Depends(get_db)):
    s = db.query(models.Setting).filter(models.Setting.key == key).first()
    return {"key": key, "value": s.value if s else ""}


@router.put("/{key}")
def set_setting(
    key: str,
    body: dict,
    db: Session = Depends(get_db),
    _: models.Admin = Depends(get_current_admin),
):
    value = body.get("value", "")
    s = db.query(models.Setting).filter(models.Setting.key == key).first()
    if s:
        s.value = value
    else:
        db.add(models.Setting(key=key, value=value))
    db.commit()
    return {"key": key, "value": value}
