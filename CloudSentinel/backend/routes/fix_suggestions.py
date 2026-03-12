"""
fix_suggestions.py - Routes for retrieving remediation suggestions.
"""

from fastapi import APIRouter, HTTPException
from database.mongodb import get_scan_history

router = APIRouter(prefix="/api/fix-suggestions", tags=["fix-suggestions"])


@router.get("/")
async def list_fix_suggestions():
    """Return fix suggestions from the most recent scan."""
    scans = await get_scan_history(limit=1)
    if not scans:
        return {"suggestions": [], "message": "No scans found. Run a scan first."}

    latest = scans[0]
    findings = latest.get("findings", [])

    suggestions = []
    for f in findings:
        rec = f.get("recommendation", {})
        suggestions.append({
            "id": f.get("id"),
            "title": f.get("title"),
            "severity": f.get("severity"),
            "description": f.get("description"),
            "category": f.get("category"),
            "fix_title": rec.get("title", "Review and remediate"),
            "steps": rec.get("steps", []),
            "config_example": rec.get("config_example", ""),
            "cli_example": rec.get("cli_example", ""),
            "reference": rec.get("reference", ""),
        })

    return {
        "suggestions": suggestions,
        "total": len(suggestions),
        "score": latest.get("score"),
        "provider": latest.get("provider"),
        "service": latest.get("service"),
    }


@router.get("/{scan_index}")
async def get_fix_suggestions_by_index(scan_index: int):
    """Return fix suggestions from a specific scan by history index."""
    scans = await get_scan_history(limit=scan_index + 1)
    if scan_index >= len(scans):
        raise HTTPException(status_code=404, detail="Scan not found at that index.")

    scan = scans[scan_index]
    findings = scan.get("findings", [])

    suggestions = []
    for f in findings:
        rec = f.get("recommendation", {})
        suggestions.append({
            "id": f.get("id"),
            "title": f.get("title"),
            "severity": f.get("severity"),
            "fix_title": rec.get("title", "Review and remediate"),
            "steps": rec.get("steps", []),
            "config_example": rec.get("config_example", ""),
            "cli_example": rec.get("cli_example", ""),
            "reference": rec.get("reference", ""),
        })

    return {
        "suggestions": suggestions,
        "total": len(suggestions),
        "score": scan.get("score"),
    }
