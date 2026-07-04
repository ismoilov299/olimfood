from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime


# ── Auth ────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── Category ─────────────────────────────────────
class CategoryBase(BaseModel):
    name_uz: str                 # o'zbek kirill — majburiy
    name_uzl: str = ""           # o'zbek lotin
    name_ru: str = ""            # rus
    emoji: str = "🍽️"
    image_url: str = ""
    order: int = 0
    active: bool = True
    parent_id: Optional[int] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name_uz: Optional[str] = None
    name_uzl: Optional[str] = None
    name_ru: Optional[str] = None
    emoji: Optional[str] = None
    image_url: Optional[str] = None
    order: Optional[int] = None
    active: Optional[bool] = None
    parent_id: Optional[int] = None

class CategoryOut(CategoryBase):
    id: int
    created_at: datetime
    product_count: int = 0
    children_count: int = 0
    name: str = ""                # so'ralgan tilda (fallback bilan) hal qilingan nom

    class Config:
        from_attributes = True


# ── Product ──────────────────────────────────────
class ProductBase(BaseModel):
    name_uz: str
    name_uzl: str = ""
    name_ru: str = ""
    description_uz: str = ""
    description_uzl: str = ""
    description_ru: str = ""
    weight_uz: str = ""
    weight_uzl: str = ""
    weight_ru: str = ""
    price: float
    emoji: str = "🍽️"
    image_url: str = ""
    cat_id: int
    discount: int = Field(default=0, ge=0, le=80)
    available: bool = True
    popular: bool = False

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name_uz: Optional[str] = None
    name_uzl: Optional[str] = None
    name_ru: Optional[str] = None
    description_uz: Optional[str] = None
    description_uzl: Optional[str] = None
    description_ru: Optional[str] = None
    weight_uz: Optional[str] = None
    weight_uzl: Optional[str] = None
    weight_ru: Optional[str] = None
    price: Optional[float] = None
    emoji: Optional[str] = None
    image_url: Optional[str] = None
    cat_id: Optional[int] = None
    discount: Optional[int] = None
    available: Optional[bool] = None
    popular: Optional[bool] = None

class ProductOut(ProductBase):
    id: int
    created_at: datetime
    category_name: Optional[str] = None
    category_emoji: Optional[str] = None
    name: str = ""                 # so'ralgan tilda hal qilingan nom
    description: str = ""
    weight: str = ""

    class Config:
        from_attributes = True


# ── Banner ───────────────────────────────────────
class BannerBase(BaseModel):
    mode: str = "design"
    title: str = ""
    subtitle: str = ""
    code: str = ""
    cta_text: str = ""
    cta_action: str = ""    # product | category | url | ""
    cta_target: str = ""    # product_id | category_id | url
    emoji: str = "🔥"
    discount: int = 0
    theme: str = "red"
    grad_from: str = "#E31E24"
    grad_to: str = "#8B0000"
    image_url: str = ""
    image_title: str = ""
    image_sub: str = ""
    active: bool = True

class BannerCreate(BannerBase):
    pass

class BannerUpdate(BaseModel):
    mode: Optional[str] = None
    title: Optional[str] = None
    subtitle: Optional[str] = None
    code: Optional[str] = None
    cta_text: Optional[str] = None
    cta_action: Optional[str] = None
    cta_target: Optional[str] = None
    emoji: Optional[str] = None
    discount: Optional[int] = None
    theme: Optional[str] = None
    grad_from: Optional[str] = None
    grad_to: Optional[str] = None
    image_url: Optional[str] = None
    image_title: Optional[str] = None
    image_sub: Optional[str] = None
    active: Optional[bool] = None

class BannerOut(BannerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Order ────────────────────────────────────────
class OrderItem(BaseModel):
    product_id: int
    name: str
    price: float
    qty: int
    emoji: str = ""

class OrderCreate(BaseModel):
    name: str
    phone: str
    address: str
    note: str = ""
    payment: str = "naqd"
    subtotal: float
    delivery: float = 15000
    total: float
    items: List[OrderItem]
    telegram_chat_id: str = ""

class OrderStatusUpdate(BaseModel):
    status: str

class OrderOut(BaseModel):
    id: int
    name: str
    phone: str
    address: str
    note: str
    payment: str
    subtotal: float
    delivery: float
    total: float
    items: List[Any]
    status: str
    telegram_chat_id: str = ""
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Stats ────────────────────────────────────────
class StatsOut(BaseModel):
    total_products: int
    total_categories: int
    today_orders: int
    total_orders: int
    total_revenue: float
    new_orders: int


# ── Upload ───────────────────────────────────────
class UploadOut(BaseModel):
    url: str
    filename: str
