"""
SkillPath — FastAPI Application Entry Point
Handles CORS, logging configuration, and router registration.
"""

import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------
load_dotenv()

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
LOG_LEVEL = os.getenv("LOG_LEVEL", "DEBUG" if ENVIRONMENT == "development" else "INFO")

# ---------------------------------------------------------------------------
# Logging — Section 12 of architecture.txt
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL.upper(), logging.INFO),
    format="[%(asctime)s] %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger("skillpath")

# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="SkillPath API",
    description="Adaptive learning-path generator powered by LLM knowledge graphs",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS — allow all origins in dev for frontend dev server
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Router Registration
# ---------------------------------------------------------------------------
from routers import graph, quiz, path  # noqa: E402

app.include_router(graph.router, prefix="/api")
app.include_router(quiz.router, prefix="/api")
app.include_router(path.router, prefix="/api")

# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------

@app.get("/")
async def health_check():
    return {"status": "ok", "service": "skillpath-api", "environment": ENVIRONMENT}


logger.info("SkillPath API initialised — environment=%s, log_level=%s", ENVIRONMENT, LOG_LEVEL)
