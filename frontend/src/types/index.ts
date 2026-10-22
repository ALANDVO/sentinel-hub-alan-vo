export interface Skill {
  id: number;
  name: string;
  level: 'enterprise' | 'personal' | 'project' | 'plugin';
  description: string | null;
  namespace: string | null;
  content: string | null;
  version: string | null;
  created_at: string;
  updated_at: string;
}

export interface SkillListResponse {
  items: Skill[];
  total: number;
  page: number;
  page_size: number;
}

export interface SkillCreate {
  name: string;
  level: 'enterprise' | 'personal' | 'project' | 'plugin';
  description?: string;
  namespace?: string;
  content?: string;
  version?: string;
}

export interface SkillUpdate {
  name?: string;
  level?: 'enterprise' | 'personal' | 'project' | 'plugin';
  description?: string;
  namespace?: string;
  content?: string;
  version?: string;
}

export type SkillVisibility = 'on' | 'name-only' | 'user-invocable-only' | 'off';

export interface SkillOverride {
  id: number;
  skill_name: string;
  visibility: SkillVisibility;
  created_at: string;
  updated_at: string;
}

export interface SkillOverrideCreate {
  skill_name: string;
  visibility: SkillVisibility;
}

export interface Lesson {
  id: number;
  title: string;
  description: string | null;
  order: number;
  content: string | null;
  level: string | null;
  questions: QuizQuestion[];
}

export interface LessonListResponse {
  items: Lesson[];
  total: number;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
}

export interface UserProgress {
  id: number;
  user_id: string;
  lesson_id: number;
  completed: boolean;
  score: number | null;
  completed_at: string | null;
}

export interface MCPServer {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  repository_url: string | null;
  documentation_url: string | null;
  auth_type: string | null;
  realtime: boolean;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface MCPServerListResponse {
  items: MCPServer[];
  total: number;
  page: number;
  page_size: number;
}

export interface MCPServerCreate {
  name: string;
  description?: string;
  category?: string;
  repository_url?: string;
  documentation_url?: string;
  auth_type?: string;
  realtime?: boolean;
  tags?: string[];
}

export interface MCPServerUpdate {
  name?: string;
  description?: string;
  category?: string;
  repository_url?: string;
  documentation_url?: string;
  auth_type?: string;
  realtime?: boolean;
  tags?: string[];
}

export interface User {
  id: string;
  email: string;
  roles: string[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}