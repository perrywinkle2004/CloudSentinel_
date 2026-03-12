"""
mongodb.py - MongoDB connection using Motor (async).
Falls back to in-memory storage if MongoDB is unavailable.
"""

import logging
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)

# In-memory fallback store
_memory_store: list = []
_user_store: list = []
_use_memory = False

try:
    import motor.motor_asyncio
    _client = None
    _db = None
except ImportError:
    _use_memory = True
    logger.warning("Motor not installed, using in-memory store.")


async def init_db(mongo_url: str = "mongodb://localhost:27017", db_name: str = "cloudsentinel"):
    """Initialize the MongoDB connection."""
    global _client, _db, _use_memory
    if _use_memory:
        return
    try:
        import motor.motor_asyncio
        _client = motor.motor_asyncio.AsyncIOMotorClient(
            mongo_url, serverSelectionTimeoutMS=3000
        )
        # Test connection
        await _client.server_info()
        _db = _client[db_name]
        logger.info("Connected to MongoDB at %s", mongo_url)
    except Exception as exc:
        logger.warning("MongoDB unavailable (%s). Using in-memory store.", exc)
        _use_memory = True


async def save_scan(scan_data: dict) -> str:
    """Save a scan result. Returns the inserted ID as string."""
    scan_data["created_at"] = datetime.utcnow().isoformat()

    if _use_memory:
        scan_data["_id"] = str(len(_memory_store) + 1)
        _memory_store.append(scan_data.copy())
        return scan_data["_id"]

    result = await _db.scans.insert_one(scan_data)
    return str(result.inserted_id)


async def get_scan_history(limit: int = 50) -> list:
    """Retrieve recent scans, newest first."""
    if _use_memory:
        return list(reversed(_memory_store[-limit:]))

    cursor = _db.scans.find({}, {"_id": 0}).sort("created_at", -1).limit(limit)
    return await cursor.to_list(length=limit)


async def get_scan_by_id(scan_id: str) -> Optional[dict]:
    """Retrieve a specific scan by ID."""
    if _use_memory:
        for s in _memory_store:
            if s.get("_id") == scan_id:
                return s
        return None

    from bson import ObjectId
    doc = await _db.scans.find_one({"_id": ObjectId(scan_id)}, {"_id": 0})
    return doc


async def get_user_by_email(email: str) -> Optional[dict]:
    """Retrieve a user by their email address."""
    if _use_memory:
        for u in _user_store:
            if u.get("email") == email:
                return u
        return None
    
    doc = await _db.users.find_one({"email": email}, {"_id": 0})
    return doc


async def save_user(user_data: dict) -> None:
    """Save a new user."""
    user_data["created_at"] = datetime.utcnow().isoformat()
    
    if _use_memory:
        user_data["_id"] = str(len(_user_store) + 1)
        _user_store.append(user_data.copy())
        return

    await _db.users.insert_one(user_data)
