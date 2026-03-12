"""
history.py - Routes for retrieving scan history.
"""

from fastapi import APIRouter, HTTPException
from database.mongodb import get_scan_history, get_scan_by_id

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("/")
async def list_history(limit: int = 50):
    """Return list of recent scans."""
    scans = await get_scan_history(limit=limit)
    return {"scans": scans, "count": len(scans)}


@router.get("/latest")
async def get_latest_scan():
    """Return the most recent scan result with its stored risk score."""
    scans = await get_scan_history(limit=1)
    if not scans:
        return {"scan": None, "message": "No scans found."}
    return {"scan": scans[0]}


@router.get("/{scan_id}")
async def get_scan(scan_id: str):
    """Return a specific scan by ID."""
    scan = await get_scan_by_id(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found.")
    return scan
