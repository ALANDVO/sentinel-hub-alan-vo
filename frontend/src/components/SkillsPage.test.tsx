import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SkillsPage } from './SkillsPage';
import { useSkills } from '../hooks/useSkills';
import { Skill } from '../types';
// Mock useSkills
vi.mock('../hooks/useSkills', () => ({
  useSkills: vi.fn(),
}));

const mockSkills: Skill[] = [
  { id: 1, name: 'test-skill', level: 'personal', description: 'Test', namespace: null, content: null, version: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
];

const mockEffectiveSkills: Skill[] = [
  { id: 1, name: 'test-skill', level: 'personal', description: 'Test', namespace: null, content: null, version: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
];

const mockOverrides = [];

describe('SkillsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (useSkills as any).mockReturnValue({
      skills: mockSkills,
      effectiveSkills: mockEffectiveSkills,
      overrides: mockOverrides,
      loading: false,
      error: null,
      pagination: { page: 1, page_size: 20, total: 1 },
      fetchSkills: vi.fn(),
      fetchEffectiveSkills: vi.fn(),
      fetchOverrides: vi.fn(),
      createSkill: vi.fn(),
      updateSkill: vi.fn(),
      deleteSkill: vi.fn(),
      createOverride: vi.fn(),
      deleteOverride: vi.fn(),
    });
  });

  it('renders skills page with title', () => {
    render(
      <BrowserRouter>
        <SkillsPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Skills')).toBeInTheDocument();
  });

  it('renders skill in table', () => {
    render(
      <BrowserRouter>
        <SkillsPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('test-skill')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
  });

  it('shows empty state when no skills', () => {
    (useSkills as any).mockReturnValue({
      skills: [],
      effectiveSkills: [],
      overrides: [],
      loading: false,
      error: null,
      pagination: { page: 1, page_size: 20, total: 0 },
      fetchSkills: vi.fn(),
      fetchEffectiveSkills: vi.fn(),
      fetchOverrides: vi.fn(),
      createSkill: vi.fn(),
      updateSkill: vi.fn(),
      deleteSkill: vi.fn(),
      createOverride: vi.fn(),
      deleteOverride: vi.fn(),
    });

    render(
      <BrowserRouter>
        <SkillsPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('No skills found')).toBeInTheDocument();
  });
});