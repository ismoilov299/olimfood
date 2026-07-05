import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from routers import auth, categories, products, banners, orders, upload, stats, settings
from seed import seed

# The database schema is managed by Alembic — run `alembic upgrade head`
# (the deploy pipeline and local setup do this). See docs/CICD.md.
# Seed idempotent default data (safe to run on every startup).
seed()

app = FastAPI(
    title="OlimFood API",
    version="1.0.0",
    description="OlimFood food delivery REST API",
)

# CORS — allow all origins (dev mode + tunnel support)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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
