import os, uuid, aiofiles
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
import models, schemas
from auth import get_current_admin

router = APIRouter(prefix="/api/upload", tags=["upload"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"}
MAX_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("", response_model=schemas.UploadOut)
async def upload_image(
    file: UploadFile = File(...),
    _: models.Admin = Depends(get_current_admin),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Fayl turi qo'llab-quvvatlanmaydi. JPG, PNG, GIF, WebP, SVG yuklang.")

    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="Fayl hajmi 10 MB dan oshmasligi kerak.")

    ext = os.path.splitext(file.filename or "img.jpg")[1] or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    async with aiofiles.open(filepath, "wb") as f:
        await f.write(contents)

    return {"url": f"/uploads/{filename}", "filename": filename}
