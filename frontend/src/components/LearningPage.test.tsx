import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LearningPage } from '../components/LearningPage';
import { useLearning } from '../hooks/useLearning';
import { Lesson } from '../types';

vi.mock('../hooks/useLearning', () => ({
  useLearning: vi.fn(),
}));

const mockLessons: Lesson[] = [
  {
    id: 1,
    title: 'Test Lesson',
    description: 'A test lesson',
    order: 1,
    content: 'Lesson content',
    level: 'beginner',
    questions: [
      { id: 1, question: 'Test question?', options: ['A', 'B'], correct_answer: 0, explanation: 'Test' },
    ],
  },
];

describe('LearningPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (useLearning as any).mockReturnValue({
      lessons: mockLessons,
      progress: [],
      loading: false,
      error: null,
      fetchLessons: vi.fn(),
      fetchProgress: vi.fn(),
      submitProgress: vi.fn(),
      isLessonCompleted: vi.fn().mockReturnValue(false),
      getLessonScore: vi.fn().mockReturnValue(null),
    });
  });

  it('renders learning page with title', () => {
    render(
      <BrowserRouter>
        <LearningPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Learning Path')).toBeInTheDocument();
  });

  it('renders lesson card', () => {
    render(
      <BrowserRouter>
        <LearningPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Test Lesson')).toBeInTheDocument();
    expect(screen.getByText('A test lesson')).toBeInTheDocument();
  });

  it('shows empty state when no lessons', () => {
    (useLearning as any).mockReturnValue({
      lessons: [],
      progress: [],
      loading: false,
      error: null,
      fetchLessons: vi.fn(),
      fetchProgress: vi.fn(),
      submitProgress: vi.fn(),
      isLessonCompleted: vi.fn().mockReturnValue(false),
      getLessonScore: vi.fn().mockReturnValue(null),
    });

    render(
      <BrowserRouter>
        <LearningPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('No lessons available')).toBeInTheDocument();
  });
});