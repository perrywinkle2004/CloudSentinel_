"""
threat_intel.py - API route for the Cybersecurity Extension modules.
Calls the attack_simulator module and returns combined threat intelligence.
"""

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter
from pydantic import BaseModel

from modules.attack_simulator import (
    simulate_attacks,
    build_attack_path,
    predict_exposure,
    generate_security_timeline,
    simulate_attacker_view,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/threat-intel", tags=["threat-intel"])


class ThreatIntelRequest(BaseModel):
    provider: Optional[str] = "unknown"
    service: Optional[str] = "unknown"
    score: Optional[int] = 0
    risk_score: Optional[int] = 0
    rating: Optional[str] = "Unknown"
    findings: Optional[List[Dict[str, Any]]] = []
    config_summary: Optional[Dict[str, Any]] = {}
    counts: Optional[Dict[str, int]] = {}


@router.post("/analyze")
async def analyze_threat_intel(req: ThreatIntelRequest):
    """Run all 5 threat-intelligence modules on a scan result."""
    findings = req.findings or []
    config_summary = req.config_summary or {}

    # Ensure provider/service are in config_summary for downstream functions
    if "provider" not in config_summary:
        config_summary["provider"] = req.provider
    if "service" not in config_summary:
        config_summary["service"] = req.service

    logger.info(
        "Threat-intel analysis: provider=%s service=%s findings=%d",
        req.provider, req.service, len(findings),
    )

    return {
        "attack_simulation": simulate_attacks(findings),
        "attack_path": build_attack_path(findings),
        "exposure_prediction": predict_exposure(config_summary),
        "security_timeline": generate_security_timeline(findings),
        "attacker_view": simulate_attacker_view(config_summary, findings),
    }
