"""
main.py - CloudSentinel FastAPI backend entry point.
"""

import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.mongodb import init_db
from routes.scan import router as scan_router
from routes.history import router as history_router
from routes.issues import router as issues_router
from routes.fix_suggestions import router as fix_suggestions_router
from routes.secure_config import router as secure_config_router
from routes.advisor import router as advisor_router
from routes.auth import router as auth_router
from routes.threat_intel import router as threat_intel_router

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="CloudSentinel API",
    description="Cloud Security Posture & Misconfiguration Scanner",
    version="1.0.0",
)

# Allow the React dev server (port 5173 / 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def startup_event():
    mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    await init_db(mongo_url=mongo_url, db_name="cloudsentinel")
    logger.info("CloudSentinel API started")


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(scan_router)
app.include_router(history_router)
app.include_router(issues_router)
app.include_router(fix_suggestions_router)
app.include_router(secure_config_router)
app.include_router(advisor_router)
app.include_router(auth_router)
app.include_router(threat_intel_router)


@app.get("/")
def root():
    return {"service": "CloudSentinel API", "status": "running", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}
