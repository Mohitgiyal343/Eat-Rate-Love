from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, Any, List
from ..db_sqlite import create_post, like_post, unlike_post, add_comment, get_post_with_meta, list_feed_posts
from .auth_routes import get_current_user


router = APIRouter()


class CreatePostIn(BaseModel):
    image_url: str
    caption: str = ""


class CommentIn(BaseModel):
    post_id: int
    text: str


class LikeIn(BaseModel):
    post_id: int


@router.post("/create")
def create(payload: CreatePostIn, current_user: Dict[str, Any] = Depends(get_current_user)):
    if not payload.image_url:
        raise HTTPException(status_code=422, detail="image_url required")
    post_id = create_post(current_user["id"], payload.image_url, payload.caption or "")
    post = get_post_with_meta(post_id)
    return {"post": post}


@router.post("/like")
def like(payload: LikeIn, current_user: Dict[str, Any] = Depends(get_current_user)):
    like_post(current_user["id"], payload.post_id)
    return {"ok": True}


@router.post("/unlike")
def unlike(payload: LikeIn, current_user: Dict[str, Any] = Depends(get_current_user)):
    unlike_post(current_user["id"], payload.post_id)
    return {"ok": True}


@router.post("/comment")
def comment(payload: CommentIn, current_user: Dict[str, Any] = Depends(get_current_user)):
    if not payload.text.strip():
        raise HTTPException(status_code=422, detail="text required")
    comment_id = add_comment(current_user["id"], payload.post_id, payload.text.strip())
    return {"id": comment_id}


@router.get("/feed")
def feed(limit: int = Query(25, ge=1, le=100), offset: int = Query(0, ge=0), current_user: Dict[str, Any] = Depends(get_current_user)):
    items = list_feed_posts(current_user["id"], limit=limit, offset=offset)
    return {"items": items, "limit": limit, "offset": offset}


@router.get("/{post_id}")
def get_post(post_id: int):
    post = get_post_with_meta(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"post": post}


