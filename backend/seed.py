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

        # ── Categories ───────────────────────────────
        if not db.query(models.Category).first():
            cats = [
                ("Kolbasa",      "🌭", 1),
                ("Fastfood",     "🍟", 2),
                ("Burger",       "🍔", 3),
                ("Pizza",        "🍕", 4),
                ("Sushi",        "🍱", 5),
                ("Salatlar",     "🥗", 6),
                ("Ichimliklar",  "🥤", 7),
                ("Shirinliklar", "🍰", 8),
            ]
            cat_objs = []
            for name, emoji, order in cats:
                cat = models.Category(name=name, emoji=emoji, order=order, active=True)
                db.add(cat)
                cat_objs.append(cat)
            db.commit()
            db.refresh(cat_objs[0])  # refresh to get IDs
            # Re-fetch to get real IDs
            cat_objs = db.query(models.Category).order_by(models.Category.order).all()
            cat_map  = {c.name: c.id for c in cat_objs}

            # ── Products ─────────────────────────────
            products = [
                # Kolbasa
                ("Doktor kolbasa",       "Klassik mol go'shti kolbasa",     "500 g",   35000, "🌭", "Kolbasa",      0,  False, False),
                ("Servelat kolbasa",     "Natural qo'shimchasiz kolbasa",   "300 g",   42000, "🥩", "Kolbasa",      10, True,  False),
                ("Mol go'shti kolbasa",  "100% sof mol go'shti",            "400 g",   38000, "🌭", "Kolbasa",      0,  False, False),
                ("Tovuq kolbasa",        "Dieta uchun tovuq go'shti",       "500 g",   28000, "🍗", "Kolbasa",      0,  False, False),
                # Fastfood
                ("Hot Dog klassik",      "Mazali klassik hot dog",          "250 g",   25000, "🌭", "Fastfood",     0,  False, False),
                ("Kartoshka fri (L)",    "Crispy kartoshka, katta",         "200 g",   18000, "🍟", "Fastfood",     0,  True,  False),
                ("Tovuq nuggets",        "10 dona crispy nuggets",          "10 dona", 32000, "🍗", "Fastfood",     15, True,  False),
                ("Corn Dog",             "Makkajo'xori qobiqli sosiska",    "2 dona",  22000, "🌽", "Fastfood",     0,  False, False),
                # Burger
                ("OlimBurger Classic",   "Klassik mol go'shti burger",      "320 g",   45000, "🍔", "Burger",       0,  True,  False),
                ("Cheese Burger",        "Ikki qatlam pishloq bilan",       "350 g",   52000, "🍔", "Burger",       0,  True,  False),
                ("BBQ Burger",           "Maxsus BBQ sous bilan",           "380 g",   58000, "🍔", "Burger",       0,  False, False),
                ("Double Burger",        "Ikki qatlam go'sht",              "450 g",   67000, "🍔", "Burger",       5,  False, False),
                # Pizza
                ("Margarita",            "Klassik italyan pizza",           "30 sm",   65000, "🍕", "Pizza",        0,  False, False),
                ("Pepperoni",            "Pepperoni kolbasa bilan",         "30 sm",   79000, "🍕", "Pizza",        0,  True,  False),
                ("BBQ Chicken",          "Tovuq va BBQ sous",               "30 sm",   72000, "🍕", "Pizza",        10, False, False),
                ("4 Pishloq",            "To'rt xil pishloq",               "30 sm",   82000, "🍕", "Pizza",        0,  True,  False),
                # Sushi
                ("Philadelphia Roll",    "Qo'ng'ir pishloq va losos",       "8 dona",  89000, "🍱", "Sushi",        0,  True,  False),
                ("California Roll",      "Krab, avokado, bodring",          "8 dona",  75000, "🍣", "Sushi",        0,  False, False),
                ("Dragon Roll",          "Maxsus dragon roll",              "8 dona",  85000, "🍱", "Sushi",        0,  False, False),
                ("Shrimp Tempura",       "Qisqichbaqa tempura roll",        "6 dona",  69000, "🦐", "Sushi",        5,  False, False),
                # Salatlar
                ("Cezar salat",          "Tovuq, pomidor, Cezar sous",      "280 g",   45000, "🥗", "Salatlar",     0,  True,  False),
                ("Grek salat",           "Feta pishloq, zaytun, sabzavot",  "300 g",   38000, "🥙", "Salatlar",     0,  False, False),
                ("Olivye",               "Klassik Olivye salati",           "250 g",   25000, "🥣", "Salatlar",     0,  False, False),
                ("Vinegret",             "Lavlagi va sabzavotlar",          "260 g",   22000, "🥗", "Salatlar",     0,  False, False),
                # Ichimliklar
                ("Coca-Cola",            "Klassik muzli Coca-Cola",         "1 L",     15000, "🥤", "Ichimliklar",  0,  True,  False),
                ("Pepsi",                "Sovuq Pepsi Cola",                "0.5 L",   12000, "🥤", "Ichimliklar",  0,  False, False),
                ("Lipton Ice Tea",       "Muzli choy, limon ta'mi",         "0.5 L",   14000, "🧃", "Ichimliklar",  0,  False, False),
                ("Mineral suv",          "Toza tog' mineral suvi",          "1 L",      8000, "💧", "Ichimliklar",  0,  False, False),
                # Shirinliklar
                ("Shokolad tort",        "Muloyim qo'l ishida pishirilgan", "300 g",   55000, "🎂", "Shirinliklar", 0,  True,  False),
                ("Tiramisu",             "Klassik italyan tiramisu",        "200 g",   48000, "🍰", "Shirinliklar", 0,  False, False),
                ("Cheesecake",           "Kremli krem pishloqli kek",       "180 g",   42000, "🍮", "Shirinliklar", 0,  False, False),
                ("Donut glazuri",        "Rang-barang glazur bilan",        "1 dona",  18000, "🍩", "Shirinliklar", 20, False, False),
            ]
            for name, desc, weight, price, emoji, cat_name, disc, popular, _ in products:
                db.add(models.Product(
                    name=name, description=desc, weight=weight,
                    price=price, emoji=emoji,
                    cat_id=cat_map[cat_name],
                    discount=disc, popular=popular,
                    available=True,
                ))
            db.commit()
            print(f"[OK] {len(products)} ta mahsulot qo'shildi")

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
