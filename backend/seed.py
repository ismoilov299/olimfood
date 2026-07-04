"""Seed default data into the database on first run."""
from database import SessionLocal
import models
from auth import hash_password


def seed():
    db = SessionLocal()
    try:
        # ── Admin ────────────────────────────────────
        if not db.query(models.Admin).first():
            db.add(models.Admin(
                username="admin",
                hashed_password=hash_password("admin"),
            ))
            db.commit()
            print("[OK] Admin yaratildi: admin / admin123")

        # ── Banners ──────────────────────────────────
        if not db.query(models.Banner).first():
            banners = [
                models.Banner(
                    mode="design", title="30% CHEGIRMA",
                    subtitle="Birinchi buyurtmada", code="OLIMFOOD30",
                    cta_text="Hozir buyurtma bering →", emoji="🔥",
                    discount=30, theme="red",
                    grad_from="#E31E24", grad_to="#8B0000", active=True,
                ),
                models.Banner(
                    mode="design", title="TEZKOR YETKAZISH",
                    subtitle="30 daqiqada eshigingizga", code="",
                    cta_text="Batafsil →", emoji="🚀",
                    discount=0, theme="blue",
                    grad_from="#2563EB", grad_to="#0B2A6B", active=True,
                ),
                models.Banner(
                    mode="design", title="YANGI MAHSULOTLAR",
                    subtitle="Burger va sushi yangiliklari", code="NEW2024",
                    cta_text="Ko'rish →", emoji="⭐",
                    discount=15, theme="orange",
                    grad_from="#EA580C", grad_to="#7A2A00", active=True,
                ),
            ]
            for b in banners:
                db.add(b)
            db.commit()
            print("[OK] 3 ta banner qo'shildi")

    finally:
        db.close()
