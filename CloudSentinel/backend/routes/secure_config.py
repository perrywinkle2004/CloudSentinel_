"""
secure_config.py - Routes for generating secure configurations.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

from modules.secure_config_generator import generate_secure_config

router = APIRouter(prefix="/api/secure-config", tags=["secure-config"])


class GenerateRequest(BaseModel):
    config: dict
    findings: list


@router.post("/generate")
async def generate_config(req: GenerateRequest):
    """Generate a secure version of the provided configuration."""
    result = generate_secure_config(req.config, req.findings)
    return result
