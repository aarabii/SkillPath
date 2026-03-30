import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

ENVIRONMENT = os.getenv("ENVIRONMENT", "prod")
LOG_LEVEL = os.getenv("LOG_LEVEL", "DEBUG" if ENVIRONMENT == "development" else "INFO")

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL.upper(), logging.INFO),
    format="[%(asctime)s] %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger("vidyamarg")

app = FastAPI(
    title="Vidya Marg API",
    description="Adaptive learning-path generator powered by LLM knowledge graphs",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import graph, quiz, path  # noqa: E402
from db.supabase import supabase  # noqa: E402

app.include_router(graph.router, prefix="/api")
app.include_router(quiz.router, prefix="/api")
app.include_router(path.router, prefix="/api")


@app.get("/")
async def root_ping():
    return {"status": "ok", "service": "vidyamarg-api", "environment": ENVIRONMENT}


@app.get("/health")
async def detailed_health_check():
    db_status = "ok"
    try:
        supabase.table("sessions").select("id").limit(1).execute()
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "api_info": {
            "name": app.title,
            "version": app.version,
            "description": app.description,
            "environment": ENVIRONMENT,
            "status": "online"
        },
        "services": {
            "graph_router": "Handles knowledge graph generation for skills",
            "quiz_router": "Manages adaptive quiz logic and state",
            "path_router": "Generates personalized learning paths based on quiz results"
        },
        "uses": [
            "Discover prerequisites for any target skill",
            "Test current knowledge via adaptive LLM questions",
            "Receive a customized learning path with curated resources"
        ],
        "database_info": {
            "provider": "Supabase PostgreSQL",
            "connection_status": db_status
        }
    }


logger.info("Vidya Marg API initialised — environment=%s, log_level=%s", ENVIRONMENT, LOG_LEVEL)
