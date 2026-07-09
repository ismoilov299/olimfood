from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text,
    DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Category(Base):
    __tablename__ = "categories"

    id        = Column(Integer, primary_key=True, index=True)
    name_uz   = Column(String(150), nullable=False, default="")   # o'zbek kirill
    name_uzl  = Column(String(150), default="")                   # o'zbek lotin
    name_ru   = Column(String(150), default="")                   # rus
    emoji     = Column(String(10), default="🍽️")
    image_url = Column(String(500), default="")
    order     = Column(Integer, default=0)
    active    = Column(Boolean, default=True)
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    parent   = relationship("Category", remote_side=[id], back_populates="children")
    children = relationship("Category", back_populates="parent")
    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id              = Column(Integer, primary_key=True, index=True)
    name_uz         = Column(String(200), nullable=False, default="")
    name_uzl        = Column(String(200), default="")
    name_ru         = Column(String(200), default="")
    description_uz  = Column(Text, default="")
    description_uzl = Column(Text, default="")
    description_ru  = Column(Text, default="")
    weight_uz       = Column(String(50), default="")
    weight_uzl      = Column(String(50), default="")
    weight_ru       = Column(String(50), default="")
    price       = Column(Float, nullable=False)
    unit        = Column(String(10), default="dona")   # dona | kg
    emoji       = Column(String(10), default="🍽️")
    image_url   = Column(String(500), default="")
    cat_id      = Column(Integer, ForeignKey("categories.id"), nullable=False)
    discount    = Column(Integer, default=0)       # percent 0-80
    available   = Column(Boolean, default=True)
    popular     = Column(Boolean, default=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    category = relationship("Category", back_populates="products")


class Banner(Base):
    __tablename__ = "banners"

    id          = Column(Integer, primary_key=True, index=True)
    mode        = Column(String(20), default="design")  # design | image
    # Design mode fields
    title       = Column(String(200), default="")
    subtitle    = Column(String(300), default="")
    code        = Column(String(50), default="")
    cta_text    = Column(String(100), default="")
    emoji       = Column(String(10), default="🔥")
    discount    = Column(Integer, default=0)
    theme       = Column(String(20), default="red")
    grad_from   = Column(String(10), default="#E31E24")
    grad_to     = Column(String(10), default="#8B0000")
    # Image mode fields
    image_url   = Column(String(500), default="")
    image_title = Column(String(200), default="")
    image_sub   = Column(String(300), default="")
    # CTA action
    cta_action  = Column(String(20), default="")    # product | category | url | ""
    cta_target  = Column(String(500), default="")   # product_id | category_id | url

    active      = Column(Boolean, default=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())


class Order(Base):
    __tablename__ = "orders"

    id         = Column(Integer, primary_key=True, index=True)
    # Customer info
    name       = Column(String(200), nullable=False)
    phone      = Column(String(30), nullable=False)
    address    = Column(Text, nullable=False)
    note       = Column(Text, default="")
    payment    = Column(String(20), default="naqd")
    # Financials
    subtotal   = Column(Float, default=0)
    delivery   = Column(Float, default=15000)
    total      = Column(Float, default=0)
    # Items as JSON array
    items      = Column(JSON, default=list)
    # Promo
    promo_code = Column(String(50), default="")
    discount   = Column(Float, default=0)
    # Telegram integration
    telegram_chat_id = Column(String(50), default="")
    # Status
    status     = Column(String(30), default="new")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class PromoCode(Base):
    __tablename__ = "promo_codes"

    id             = Column(Integer, primary_key=True, index=True)
    code           = Column(String(50), unique=True, index=True, nullable=False)
    discount_type  = Column(String(10), default="percent")  # percent | fixed
    discount_value = Column(Float, default=0)               # percent (0-100) or so'm amount
    min_order      = Column(Float, default=0)               # minimum subtotal to qualify
    max_discount   = Column(Float, default=0)               # cap for percent codes (0 = no cap)
    usage_limit    = Column(Integer, default=0)             # total redemptions allowed (0 = unlimited)
    used_count     = Column(Integer, default=0)
    active         = Column(Boolean, default=True)
    expires_at     = Column(DateTime(timezone=True), nullable=True)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())


class Setting(Base):
    __tablename__ = "settings"
    key   = Column(String(100), primary_key=True)
    value = Column(Text, default="")


class Admin(Base):
    __tablename__ = "admins"

    id            = Column(Integer, primary_key=True, index=True)
    username      = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(200))
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
