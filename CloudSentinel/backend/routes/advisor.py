"""
advisor.py - Routes for the AI Security Advisor.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from modules.ai_advisor import ask_advisor, QUICK_QUESTIONS

router = APIRouter(prefix="/api/advisor", tags=["advisor"])


class AskRequest(BaseModel):
    question: str
    scan_context: Optional[dict] = None


@router.post("/ask")
async def ask(req: AskRequest):
    """Answer a security question using the local knowledge base."""
    result = ask_advisor(req.question, req.scan_context)
    return result


@router.get("/quick-questions")
async def quick_questions():
    """Return pre-built quick questions for the UI."""
    return {"questions": QUICK_QUESTIONS}
