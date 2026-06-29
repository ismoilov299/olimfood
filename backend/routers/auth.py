from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models, schemas
from auth import verify_password, create_access_token, hash_password, get_current_admin
from database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=schemas.Token)
def login(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    admin = db.query(models.Admin).filter(models.Admin.username == data.username).first()
    if not admin or not verify_password(data.password, admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Login yoki parol noto'g'ri",
        )
    token = create_access_token({"sub": admin.username})
    return {"access_token": token, "token_type": "bearer"}


@router.post("/change-password")
def change_password(
    data: dict,
    db: Session = Depends(get_db),
    admin: models.Admin = Depends(get_current_admin),
):
    old_pass = data.get("old_password", "")
    new_pass = data.get("new_password", "")
    if not verify_password(old_pass, admin.hashed_password):
        raise HTTPException(status_code=400, detail="Joriy parol noto'g'ri")
    if len(new_pass) < 6:
        raise HTTPException(status_code=400, detail="Yangi parol kamida 6 ta belgi bo'lishi kerak")
    admin.hashed_password = hash_password(new_pass)
    db.commit()
    return {"ok": True, "detail": "Parol muvaffaqiyatli o'zgartirildi"}


@router.get("/me")
def me(admin: models.Admin = Depends(get_current_admin)):
    return {"id": admin.id, "username": admin.username}
