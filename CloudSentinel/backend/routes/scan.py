"""
scan.py - FastAPI routes for scanning cloud configurations.
"""

import json
import logging
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from modules.config_parser import parse_config
from modules.recommendation_engine import get_recommendations
from modules.risk_engine import calculate_score
from modules.rule_engine import run_rules
from database.mongodb import save_scan

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/scan", tags=["scan"])


# ---------------------------------------------------------------------------
# Simulation config templates
# ---------------------------------------------------------------------------
SIMULATION_CONFIGS = {
    ("aws", "s3", "public_bucket"): {
        "provider": "aws", "service": "s3",
        "bucket_name": "simulated-public-bucket",
        "acl": "public-read-write",
        "block_public_acls": False, "block_public_policy": False,
        "ignore_public_acls": False, "restrict_public_buckets": False,
        "versioning": False,
        "encryption": {"enabled": False},
        "logging": {"enabled": False},
        "policy": {
            "Version": "2012-10-17",
            "Statement": [{"Effect": "Allow", "Principal": "*", "Action": "s3:*", "Resource": "*"}]
        },
    },
    ("aws", "s3", "private_bucket"): {
        "provider": "aws", "service": "s3",
        "bucket_name": "simulated-private-bucket",
        "acl": "private",
        "block_public_acls": True, "block_public_policy": True,
        "ignore_public_acls": True, "restrict_public_buckets": True,
        "versioning": True,
        "encryption": {"enabled": True, "type": "AES256"},
        "logging": {"enabled": True, "target_bucket": "log-bucket"},
    },
    ("aws", "s3", "missing_encryption"): {
        "provider": "aws", "service": "s3",
        "bucket_name": "simulated-no-enc-bucket",
        "acl": "private",
        "block_public_acls": True, "block_public_policy": True,
        "ignore_public_acls": True, "restrict_public_buckets": True,
        "versioning": True,
        "encryption": {"enabled": False},
        "logging": {"enabled": True},
    },
    ("aws", "iam", "weak_policy"): {
        "provider": "aws", "service": "iam",
        "policy_name": "SimulatedWeakPolicy",
        "policy_document": {
            "Version": "2012-10-17",
            "Statement": [{"Effect": "Allow", "Action": "*", "Resource": "*"}]
        },
        "mfa_enabled": False,
        "password_policy": {
            "minimum_length": 6, "require_uppercase": False,
            "require_lowercase": False, "require_numbers": False,
            "require_symbols": False,
        },
        "root_account_mfa": False,
        "access_keys_rotated": False,
    },
    ("aws", "iam", "secure_configuration"): {
        "provider": "aws", "service": "iam",
        "policy_name": "SimulatedSecurePolicy",
        "policy_document": {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": ["s3:GetObject", "s3:PutObject"],
                "Resource": "arn:aws:s3:::my-bucket/*"
            }]
        },
        "mfa_enabled": True,
        "password_policy": {
            "minimum_length": 14, "require_uppercase": True,
            "require_lowercase": True, "require_numbers": True,
            "require_symbols": True, "max_password_age": 90,
            "password_reuse_prevention": 24,
        },
        "root_account_mfa": True,
        "access_keys_rotated": True,
    },
    ("azure", "storage", "public_bucket"): {
        "provider": "azure", "service": "storage",
        "account_name": "simulated-storage",
        "allow_blob_public_access": True,
        "https_only": False,
        "minimum_tls_version": "TLS1_0",
        "encryption": {"services": {"blob": {"enabled": False}}},
        "soft_delete": {"enabled": False},
    },
    ("azure", "storage", "secure_configuration"): {
        "provider": "azure", "service": "storage",
        "account_name": "simulated-secure-storage",
        "allow_blob_public_access": False,
        "https_only": True,
        "minimum_tls_version": "TLS1_2",
        "encryption": {"services": {"blob": {"enabled": True}}},
        "soft_delete": {"enabled": True},
    },
    ("gcp", "storage", "public_bucket"): {
        "provider": "gcp", "service": "storage",
        "bucket_name": "simulated-gcp-public",
        "iam_bindings": [{"role": "roles/storage.objectViewer", "members": ["allUsers"]}],
        "uniform_bucket_level_access": False,
        "logging": {"enabled": False},
    },
    ("gcp", "storage", "secure_configuration"): {
        "provider": "gcp", "service": "storage",
        "bucket_name": "simulated-gcp-secure",
        "iam_bindings": [{"role": "roles/storage.objectViewer",
                          "members": ["serviceAccount:svc@project.iam.gserviceaccount.com"]}],
        "uniform_bucket_level_access": True,
        "logging": {"enabled": True},
    },
}


def _do_scan(config: dict) -> dict:
    """Core scan logic: rules → risk → recommendations."""
    # Normalize provider and service to lowercase for consistent rule matching
    if "service" in config:
        config["service"] = str(config["service"]).lower().strip()
    if "provider" in config:
        config["provider"] = str(config["provider"]).lower().strip()

    findings = run_rules(config)
    score_data = calculate_score(findings)
    enriched = get_recommendations(findings)
    return {
        "provider": config.get("provider", "unknown"),
        "service": config.get("service", "unknown"),
        "config_summary": {k: v for k, v in config.items()
                           if k not in ("policy", "policy_document", "iam_bindings")},
        "score": score_data["score"],
        "risk_score": score_data["score"],
        "rating": score_data["rating"],
        "rating_color": score_data["color"],
        "counts": score_data["counts"],
        "total_issues": score_data["total_issues"],
        "findings": enriched,
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

from database.mongodb import get_scan_history

@router.get("/latest")
async def get_latest_scan_route():
    """Return the most recent scan result with its stored risk score."""
    scans = await get_scan_history(limit=1)
    if not scans:
        return {"scan": None, "message": "No scans found."}
    return {"scan": scans[0]}

@router.post("/upload")
async def scan_upload(
    file: Optional[UploadFile] = File(default=None),
    text: Optional[str] = Form(default=None),
):
    """Scan a user-uploaded config file or pasted text."""
    if file:
        content = (await file.read()).decode("utf-8", errors="replace")
        filename = file.filename or ""
    elif text:
        content = text
        filename = "paste.txt"
    else:
        raise HTTPException(status_code=400, detail="No file or text provided.")

    try:
        from modules.config_parser import parse_config
        config = parse_config(content, filename)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    result = _do_scan(config)
    await save_scan(result)
    return result


class SimulateRequest(BaseModel):
    provider: str
    service: str
    scenario: str


@router.post("/simulate")
async def scan_simulate(req: SimulateRequest):
    """Scan a pre-built simulated configuration."""
    key = (req.provider.lower(), req.service.lower(), req.scenario.lower())
    config = SIMULATION_CONFIGS.get(key)
    if config is None:
        raise HTTPException(
            status_code=404,
            detail=f"No simulation found for {req.provider}/{req.service}/{req.scenario}."
        )
    result = _do_scan(config)
    result["simulated"] = True
    result["scenario"] = req.scenario
    await save_scan(result)
    return result


@router.get("/options")
def scan_options():
    """Return available simulation options for the UI dropdowns."""
    return {
        "providers": {
            "aws": {
                "services": {
                    "s3": {
                        "label": "S3 (Simple Storage Service)",
                        "scenarios": [
                            {"value": "public_bucket", "label": "Public S3 Bucket"},
                            {"value": "private_bucket", "label": "Private Bucket"},
                            {"value": "missing_encryption", "label": "Missing Encryption"},
                            {"value": "secure_configuration", "label": "Secure Configuration"},
                        ]
                    },
                    "iam": {
                        "label": "IAM (Identity & Access Management)",
                        "scenarios": [
                            {"value": "weak_policy", "label": "Weak IAM Policy"},
                            {"value": "secure_configuration", "label": "Secure Configuration"},
                        ]
                    },
                }
            },
            "azure": {
                "services": {
                    "storage": {
                        "label": "Azure Blob Storage",
                        "scenarios": [
                            {"value": "public_bucket", "label": "Public Blob Container"},
                            {"value": "secure_configuration", "label": "Secure Configuration"},
                        ]
                    }
                }
            },
            "gcp": {
                "services": {
                    "storage": {
                        "label": "GCP Cloud Storage",
                        "scenarios": [
                            {"value": "public_bucket", "label": "Public GCS Bucket"},
                            {"value": "secure_configuration", "label": "Secure Configuration"},
                        ]
                    }
                }
            },
        }
    }
