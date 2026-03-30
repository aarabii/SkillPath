const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface GraphRequest {
  skill: string;
}

export interface NodeSchema {
  id: string;
  label: string;
  description: string;
}

export interface EdgeSchema {
  source: string;
  target: string;
  relation: string;
}

export interface GraphResponse {
  session_id: string;
  nodes: NodeSchema[];
  edges: EdgeSchema[];
}

export interface QuizStartRequest {
  session_id: string;
}

export interface QuestionSchema {
  question: string;
  options: Record<string, string>;
  correct: string;
  explanation: string;
  concept_id: string;
  concept_label: string;
  progress: { assessed: number; total: number };
}

export interface QuizStartResponse {
  question: QuestionSchema;
}

export interface QuizAnswerRequest {
  session_id: string;
  concept_id: string;
  answer: string;
}

export interface QuizAnswerResponse {
  correct: boolean;
  explanation: string;
  next_question?: QuestionSchema;
  quiz_complete: boolean;
  known_count?: number;
  unknown_count?: number;
}

export interface PathRequest {
  session_id: string;
}

export interface ResourceSchema {
  title: string;
  url: string;
  href?: string;
  image?: string;
  description?: string;
}

export interface PathStepSchema {
  order: number;
  concept_id: string;
  concept_label: string;
  reason: string;
  status: 'mastered' | 'target';
  resources: ResourceSchema[];
  estimated_minutes: number;
}

export interface PathResponse {
  session_id: string;
  total_concepts_in_graph: number;
  concepts_already_known: number;
  concepts_to_learn: number;
  reduction_percentage: number;
  steps: PathStepSchema[];
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 1) {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const detail = typeof errorData.detail === 'string'
        ? errorData.detail
        : errorData.detail?.detail || res.statusText || `HTTP ${res.status}`;
      throw new Error(detail);
    }

    return await res.json();
  } catch (error) {
    if (retries > 0) {
      console.warn(`Retrying request to ${url}...`);
      await new Promise(res => setTimeout(res, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

export const api = {
  generateGraph: async (data: GraphRequest): Promise<GraphResponse> => {
    return fetchWithRetry(`${API_URL}/api/graph`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getGraph: async (sessionId: string): Promise<GraphResponse> => {
    return fetchWithRetry(`${API_URL}/api/graph/${sessionId}`, {
      method: 'GET',
    });
  },

  startQuiz: async (data: QuizStartRequest): Promise<QuizStartResponse> => {
    return fetchWithRetry(`${API_URL}/api/quiz/start`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  submitAnswer: async (data: QuizAnswerRequest): Promise<QuizAnswerResponse> => {
    return fetchWithRetry(`${API_URL}/api/quiz/answer`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getPath: async (sessionId: string): Promise<PathResponse> => {
    return fetchWithRetry(`${API_URL}/api/path/${sessionId}`, {
      method: 'GET',
    });
  },
};
