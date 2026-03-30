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

app.include_router(graph.router, prefix="/api")
app.include_router(quiz.router, prefix="/api")
app.include_router(path.router, prefix="/api")


@app.get("/")
async def health_check():
    return {"status": "ok", "service": "vidyamarg-api", "environment": ENVIRONMENT}


logger.info("Vidya Marg API initialised — environment=%s, log_level=%s", ENVIRONMENT, LOG_LEVEL)
