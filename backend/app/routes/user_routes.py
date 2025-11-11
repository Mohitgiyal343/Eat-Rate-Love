from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from ..db_sqlite import get_user_by_username, get_user_by_id, follow_user, unfollow_user, count_followers, count_following
from .auth_routes import get_current_user


router = APIRouter()


class FollowIn(BaseModel):
    username: str


@router.get("/profile/{username}")
def profile(username: str):
    user = get_user_by_username(username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user["id"],
        "username": user["username"],
        "bio": user.get("bio", ""),
        "avatar_url": user.get("avatar_url", ""),
        "followers": count_followers(user["id"]),
        "following": count_following(user["id"]),
    }


@router.post("/follow")
def follow(payload: FollowIn, current_user: Dict[str, Any] = Depends(get_current_user)):
    target = get_user_by_username(payload.username)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    follow_user(current_user["id"], target["id"])
    return {"ok": True}


@router.post("/unfollow")
def unfollow(payload: FollowIn, current_user: Dict[str, Any] = Depends(get_current_user)):
    target = get_user_by_username(payload.username)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    unfollow_user(current_user["id"], target["id"])
    return {"ok": True}


