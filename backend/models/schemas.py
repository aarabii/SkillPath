from typing import Literal
from pydantic import BaseModel, Field


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


class QuizStartRequest(BaseModel):
    session_id: str


class QuestionSchema(BaseModel):
    question: str
    options: dict[str, str]
    correct: str
    explanation: str
    concept_id: str
    concept_label: str
    progress: dict[str, int]


class QuizStartResponse(BaseModel):
    question: QuestionSchema


class QuizAnswerRequest(BaseModel):
    session_id: str
    concept_id: str
    answer: str


class QuizAnswerResponse(BaseModel):
    correct: bool
    explanation: str
    next_question: QuestionSchema | None
    quiz_complete: bool = False
    known_count: int | None = None
    unknown_count: int | None = None


class PathRequest(BaseModel):
    session_id: str


class ResourceSchema(BaseModel):
    title: str
    url: str
    image: str | None = None
    description: str | None = None


class PathStepSchema(BaseModel):
    order: int
    concept_id: str
    concept_label: str
    reason: str
    status: Literal["mastered", "target"]
    resources: list[ResourceSchema]
    estimated_minutes: int


class PathResponse(BaseModel):
    session_id: str
    total_concepts_in_graph: int
    concepts_already_known: int
    concepts_to_learn: int
    reduction_percentage: float
    steps: list[PathStepSchema]
