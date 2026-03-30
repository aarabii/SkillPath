# SkillPath

SkillPath is an AI-powered, adaptive learning-path generator application. It acts as an interactive tutor capable of transforming a user's target skill into a complete prerequisite dependency tree (a knowledge graph), dynamically assessing baseline knowledge via quizzes, and generating a hyper-optimized curriculum.

## Frequently Asked Questions (FAQ)

### What was the problem statement?

Learners often struggle to figure out _what_ they need to learn to master a complex skill. Standard curriculums are rigid, forcing users to review concepts they already know, while ignoring their unique knowledge gaps. There is a need for a dynamic system that can map out the exact prerequisites for any skill and adapt to the learner's current knowledge level.

### What is our solution?

SkillPath solves this by generating a directed acyclic graph (DAG) of prerequisites for any target skill using AI. It evaluates the user's existing knowledge through a dynamic, adaptive quiz, and ultimately outputs a highly optimized, personalized learning curriculum that skips familiar material and focuses only on what the user actually needs to learn.

### Why did we build this?

To provide a customized, time-efficient learning experience. By leveraging LLMs (Large Language Models) and graph theory, we can break down complex subjects into digestible, interconnected nodes. This ensures learners spend their time acquiring new knowledge rather than rehashing known concepts.

### How did we build this?

We utilized a two-tier architecture:

- **Frontend:** Built with Next.js, React, TailwindCSS, and Framer Motion. It handles the UI, modern typography (Inter/JetBrains Mono + Playfair), animated hero elements, and visual map representation using React Flow.
- **Backend:** A Python FastAPI application that manages domain logic, integrates with Groq LLMs for generation, uses BeautifulSoup for real-time optimal Google Search scraping, implements NetworkX for handling DAG logic, and persists data via Supabase (PostgreSQL).

### How does a user interact with the app?

1. **Initiation:** The user lands on [frontend/app/page.tsx](frontend/app/page.tsx) and inputs a target skill.
2. **Analysis Render:** The user views the generated prerequisite graph at [frontend/app/graph/[id]/page.tsx](frontend/app/graph/[id]/page.tsx), visualized via [frontend/components/GraphView.tsx](frontend/components/GraphView.tsx).
3. **Assessment Phase:** The user takes an adaptive quiz at [frontend/app/quiz/[id]/page.tsx](frontend/app/quiz/[id]/page.tsx), interacting with questions presented in [frontend/components/QuizCard.tsx](frontend/components/QuizCard.tsx).
4. **Path Curriculum:** Finally, the user receives their optimized learning path at [frontend/app/path/[id]/page.tsx](frontend/app/path/[id]/page.tsx), detailed by [frontend/components/PathStep.tsx](frontend/components/PathStep.tsx).

## Project Structure

### Backend

The backend operates as a service tier, handling LLM access, DAG algorithms, and database persistence.

- [backend/main.py](backend/main.py): FastAPI server configuration and router bootstrapping.
- [backend/requirements.txt](backend/requirements.txt): Python dependencies.
- [backend/db/supabase.py](backend/db/supabase.py): Supabase client initialization.
- [backend/models/schemas.py](backend/models/schemas.py): Pydantic typings and Data Transfer Objects.
- [backend/routers](backend/routers): API route definitions.
- [backend/services/llm.py](backend/services/llm.py): Integration with Groq for generation tasks.
- [backend/services/graph_engine.py](backend/services/graph_engine.py): NetworkX algorithms for DAG validation.

### Frontend

The frontend controls interaction and UI state, making requests to the backend via [frontend/lib/api.ts](frontend/lib/api.ts).

- [frontend/app](frontend/app): Next.js App Router definitions.
- [frontend/components](frontend/components): React components including UI elements like [frontend/components/SkillInput.tsx](frontend/components/SkillInput.tsx).
- [frontend/package.json](frontend/package.json): Node dependencies.

## API Endpoints and Routers

All endpoints are mounted with the `/api` prefix in [backend/main.py](backend/main.py).

### Graph Router ([backend/routers/graph.py](backend/routers/graph.py))

- **`POST /api/graph`**: Seeds a new session by querying the LLM to generate a targeted knowledge graph.
- **`GET /api/graph/{session_id}`**: Retrieves the static relational graph nodes and edges for a session.

### Quiz Router ([backend/routers/quiz.py](backend/routers/quiz.py))

- **`POST /api/quiz/start`**: Flushes standard definitions and triggers the generation of the first assessment question for nodes with 0 indegree dependencies.
- **`POST /api/quiz/answer`**: Evaluates the submitted answer, updates the session's knowledge state, and iteratively maps the next question or determines completion.

### Path Router ([backend/routers/path.py](backend/routers/path.py))

- **`POST /api/path`**: Computes the final minimal curriculum path by traversing concept gaps.
- **`GET /api/path/{session_id}`**: Retrieves a cached path from the database, or computes it if not found.

### Health Endpoint ([backend/main.py](backend/main.py))

- **`GET /`**: Diagnostics/Health checker returning environment validation mapping status.

## Data Flow & Core Functionality

1. **Graph Generation:** User inputs a skill -> `POST /api/graph` generates a DAG via the Groq LLM -> validates via NetworkX -> saves to Supabase.
2. **Visualization:** The Next.js frontend fetches the DAG and plots it using `@xyflow/react` internally in [frontend/components/GraphView.tsx](frontend/components/GraphView.tsx).
3. **Assessment:** The user triggers `POST /api/quiz/start`. The backend quiz engine ([backend/services/quiz_engine.py](backend/services/quiz_engine.py)) finds independent concepts and uses the LLM to generate targeted questions.
4. **Adaptive Learning:** User answers (`POST /api/quiz/answer`) are validated. The backend updates the database (`quiz_state` and `quiz_results`), appending concept IDs to known/unknown arrays, until the knowledge graph is fully assessed.
5. **Path Construction:** The frontend requests the final curriculum via `POST /api/path` or `GET`. The backend path engine ([backend/services/path_engine.py](backend/services/path_engine.py)) trims known concepts, generates an optimal sequence, and automatically scrapes & caches the top 5 interactive resource hyperlinks using real-time Google search fallbacks.

## Local Development Setup

### Backend

1. Navigate to the `backend/` directory.
2. Install dependencies: `pip install -r requirements.txt` via [backend/requirements.txt](backend/requirements.txt).
3. Set environment variables (`GROQ_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, etc.).
4. Run the server: `uvicorn main:app --reload --host 0.0.0.0 --port 8000`.

### Frontend

1. Navigate to the `frontend/` directory.
2. Install dependencies: `npm install` via [frontend/package.json](frontend/package.json).
3. Set the environment variable `NEXT_PUBLIC_API_URL=http://localhost:8000` in `.env.local`.
4. Run the development server: `npm run dev`.

## Database Schema

The Supabase PostgreSQL database handles persistence:

- `sessions`: Core session tracking and target skills.
- `graphs`: Stores relational parameters like `nodes` and `edges` (JSONB).
- `quiz_state`: Maintains iterative arrays of assessed, known, and unknown concepts.
- `paths`: Stores final customized curriculum steps.
- `concept_resources`: Caches the Top 5 Google Search scraper results linking directly to study materials so concurrent calls save time.
- `quiz_results`: History table mapping user answers over time.
