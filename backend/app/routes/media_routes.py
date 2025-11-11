from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pathlib import Path
import uuid
from typing import Dict, Any
from .auth_routes import get_current_user


router = APIRouter()

MEDIA_ROOT = Path(__file__).resolve().parents[2] / "media"
MEDIA_ROOT.mkdir(parents=True, exist_ok=True)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


@router.post("/upload")
async def upload_image(file: UploadFile = File(...), user: Dict[str, Any] = Depends(get_current_user)):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported media type")
    ext = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
    }[file.content_type]
    filename = f"{uuid.uuid4().hex}{ext}"
    target_path = MEDIA_ROOT / filename
    data = await file.read()
    target_path.write_bytes(data)
    return {"url": f"/media/{filename}"}


