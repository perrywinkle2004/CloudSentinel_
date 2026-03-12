"""
auth.py - Routes for User Authentication via native hashing.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import hashlib
import os

from database.mongodb import get_user_by_email, save_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


class SignupRequest(BaseModel):
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


def hash_password(password: str, salt: bytes = None) -> (bytes, bytes):
    """Hash password securely using standard library pbkdf2."""
    if salt is None:
        salt = os.urandom(16)
    pw_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return pw_hash, salt


def verify_password(password: str, pw_hash: bytes, salt: bytes) -> bool:
    """Verify password matches hash."""
    return pw_hash == hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)


@router.post("/register")
async def register(req: SignupRequest):
    """Register a new user account."""
    if not req.username or not req.email or not req.password:
        raise HTTPException(status_code=400, detail="Missing required fields")

    existing_user = await get_user_by_email(req.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    pw_hash, salt = hash_password(req.password)
    user_data = {
        "username": req.username,
        "email": req.email,
        "password_hash": pw_hash.hex(),
        "password_salt": salt.hex(),
    }
    
    await save_user(user_data)
    return {"message": "User registered successfully"}


@router.post("/login")
async def login(req: LoginRequest):
    """Authenticate a user."""
    user = await get_user_by_email(req.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    salt = bytes.fromhex(user["password_salt"])
    pw_hash = bytes.fromhex(user["password_hash"])

    if not verify_password(req.password, pw_hash, salt):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "message": "Login successful",
        "user": {
            "username": user.get("username"),
            "email": user.get("email"),
        }
    }
