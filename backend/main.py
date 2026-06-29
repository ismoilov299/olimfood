import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from database import engine, Base
import models
from routers import auth, categories, products, banners, orders, upload, stats, settings
from seed import seed

# Create tables
Base.metadata.create_all(bind=engine)

# Migrate existing tables (add new columns if they don't exist)
def _migrate():
    stmts = [
        "ALTER TABLE banners ADD COLUMN cta_action VARCHAR(20) DEFAULT ''",
        "ALTER TABLE banners ADD COLUMN cta_target VARCHAR(500) DEFAULT ''",
        "ALTER TABLE categories ADD COLUMN image_url VARCHAR(500) DEFAULT ''",
    ]
    with engine.connect() as conn:
        for sql in stmts:
            try:
                conn.execute(text(sql))
                conn.commit()
            except Exception:
                pass

_migrate()

# Seed default data
seed()

app = FastAPI(
    title="OlimFood API",
    version="1.0.0",
    description="OlimFood food delivery REST API",
)

# CORS — allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files (uploaded images)
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Routers
app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(banners.router)
app.include_router(orders.router)
app.include_router(upload.router)
app.include_router(stats.router)
app.include_router(settings.router)


@app.get("/")
def root():
    return {"status": "ok", "app": "OlimFood API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}
