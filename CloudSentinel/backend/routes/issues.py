"""
issues.py - Routes for retrieving detected security issues.
"""

from fastapi import APIRouter, HTTPException
from database.mongodb import get_scan_history

router = APIRouter(prefix="/api/issues", tags=["issues"])


@router.get("/")
async def list_issues():
    """Return issues from the most recent scan."""
    scans = await get_scan_history(limit=1)
    if not scans:
        return {"issues": [], "scan": None, "message": "No scans found. Run a scan first."}

    latest = scans[0]
    findings = latest.get("findings", [])

    # Group by severity
    grouped = {"CRITICAL": [], "HIGH": [], "MEDIUM": [], "LOW": []}
    for f in findings:
        sev = f.get("severity", "LOW")
        grouped.setdefault(sev, []).append({
            "id": f.get("id"),
            "title": f.get("title"),
            "severity": sev,
            "description": f.get("description"),
            "category": f.get("category"),
            "provider": f.get("provider"),
            "service": f.get("service"),
            "resource": _extract_resource(latest, f),
        })

    return {
        "issues": findings,
        "grouped": grouped,
        "counts": latest.get("counts", {}),
        "score": latest.get("score"),
        "provider": latest.get("provider"),
        "service": latest.get("service"),
        "total": len(findings),
    }


@router.get("/{scan_index}")
async def get_issues_by_index(scan_index: int):
    """Return issues from a specific scan by history index (0 = most recent)."""
    scans = await get_scan_history(limit=scan_index + 1)
    if scan_index >= len(scans):
        raise HTTPException(status_code=404, detail="Scan not found at that index.")

    scan = scans[scan_index]
    findings = scan.get("findings", [])

    return {
        "issues": findings,
        "counts": scan.get("counts", {}),
        "score": scan.get("score"),
        "provider": scan.get("provider"),
        "service": scan.get("service"),
        "total": len(findings),
    }


def _extract_resource(scan: dict, finding: dict) -> str:
    """Try to extract the affected resource name from the scan config."""
    cfg = scan.get("config_summary", {})
    service = finding.get("service", "")

    if service == "s3":
        return cfg.get("bucket_name", "S3 Bucket")
    elif service == "iam":
        return cfg.get("policy_name", "IAM Policy")
    elif service == "storage":
        provider = finding.get("provider", "")
        if provider == "azure":
            return cfg.get("account_name", "Azure Storage Account")
        elif provider == "gcp":
            return cfg.get("bucket_name", "GCP Bucket")
    return "Cloud Resource"
