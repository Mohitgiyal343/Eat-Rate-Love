from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from ..db_sqlite import create_user, get_user_by_username, get_user_by_id
from ..auth import hash_password, verify_password, create_access_token, decode_access_token


router = APIRouter()


class SignupIn(BaseModel):
    username: str
    email: EmailStr
    password: str


class LoginIn(BaseModel):
    username: str
    password: str


def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.split(" ", 1)[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = int(payload.get("sub", "0"))
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.post("/signup")
def signup(payload: SignupIn):
    existing = get_user_by_username(payload.username)
    if existing:
        raise HTTPException(status_code=409, detail="Username already taken")
    user_id = create_user(
        username=payload.username,
        email=str(payload.email),
        password_hash=hash_password(payload.password),
    )
    token = create_access_token(user_id, payload.username)
    return {"token": token, "user": {"id": user_id, "username": payload.username, "email": str(payload.email)}}


@router.post("/login")
def login(payload: LoginIn):
    user = get_user_by_username(payload.username)
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(user["id"], user["username"])
    return {"token": token, "user": {"id": user["id"], "username": user["username"], "email": user["email"]}}


@router.get("/me")
def me(current_user: Dict[str, Any] = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "email": current_user["email"],
        "bio": current_user.get("bio", ""),
        "avatar_url": current_user.get("avatar_url", ""),
    }


