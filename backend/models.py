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
    name      = Column(String(100), nullable=False)
    emoji     = Column(String(10), default="🍽️")
    image_url = Column(String(500), default="")
    order     = Column(Integer, default=0)
    active    = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(200), nullable=False)
    description = Column(Text, default="")
    weight      = Column(String(50), default="")
    price       = Column(Float, nullable=False)
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
    # Status
    status     = Column(String(30), default="new")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


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
