"""
SkillPath — Pydantic Schemas (Section 8 of architecture.txt)
All request/response models for the API.
"""

from pydantic import BaseModel, Field


# ── Graph ─────────────────────────────────────────────────────────────────

class GraphRequest(BaseModel):
    skill: str = Field(..., min_length=2, max_length=100)


class NodeSchema(BaseModel):
    id: str
    label: str
    description: str


class EdgeSchema(BaseModel):
    source: str
    target: str
    relation: str = "prerequisite"


class GraphResponse(BaseModel):
    session_id: str
    nodes: list[NodeSchema]
    edges: list[EdgeSchema]


# ── Quiz ──────────────────────────────────────────────────────────────────

class QuizStartRequest(BaseModel):
    session_id: str


class QuestionSchema(BaseModel):
    question: str
    options: dict[str, str]       # {"A": "...", "B": "...", "C": "...", "D": "..."}
    correct: str
    explanation: str
    concept_id: str
    concept_label: str
    progress: dict[str, int]      # {"assessed": 0, "total": 12}


class QuizStartResponse(BaseModel):
    question: QuestionSchema


class QuizAnswerRequest(BaseModel):
    session_id: str
    concept_id: str
    answer: str                   # "A", "B", "C", or "D"


class QuizAnswerResponse(BaseModel):
    correct: bool
    explanation: str
    next_question: QuestionSchema | None
    quiz_complete: bool = False
    known_count: int | None = None
    unknown_count: int | None = None


# ── Path ──────────────────────────────────────────────────────────────────

class PathRequest(BaseModel):
    session_id: str


class PathStepSchema(BaseModel):
    order: int
    concept_id: str
    concept_label: str
    reason: str
    resource_title: str
    resource_url: str
    resource_type: str            # "video" | "article" | "doc"
    estimated_minutes: int


class PathResponse(BaseModel):
    session_id: str
    total_concepts_in_graph: int
    concepts_already_known: int
    concepts_to_learn: int
    reduction_percentage: float
    steps: list[PathStepSchema]
