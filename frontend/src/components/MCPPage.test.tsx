import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MCPPage } from '../components/MCPPage';
import { useMCP } from '../hooks/useMCP';
import { MCPServer } from '../types';

vi.mock('../hooks/useMCP', () => ({
  useMCP: vi.fn(),
}));

const mockServers: MCPServer[] = [
  {
    id: 1,
    name: 'test-server',
    description: 'Test MCP server',
    category: 'filesystem',
    repository_url: 'https://github.com/test/server',
    documentation_url: null,
    auth_type: 'none',
    realtime: false,
    tags: ['test'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

describe('MCPPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (useMCP as any).mockReturnValue({
      servers: mockServers,
      categories: ['filesystem'],
      loading: false,
      error: null,
      pagination: { page: 1, page_size: 20, total: 1 },
      fetchServers: vi.fn(),
      fetchCategories: vi.fn(),
      createServer: vi.fn(),
      updateServer: vi.fn(),
      deleteServer: vi.fn(),
    });
  });

  it('renders MCP page with title', () => {
    render(
      <BrowserRouter>
        <MCPPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('MCP Server Catalog')).toBeInTheDocument();
  });

  it('renders server in table', () => {
    render(
      <BrowserRouter>
        <MCPPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('test-server')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'filesystem' })).toBeInTheDocument();
  });

  it('shows empty state when no servers', () => {
    (useMCP as any).mockReturnValue({
      servers: [],
      categories: [],
      loading: false,
      error: null,
      pagination: { page: 1, page_size: 20, total: 0 },
      fetchServers: vi.fn(),
      fetchCategories: vi.fn(),
      createServer: vi.fn(),
      updateServer: vi.fn(),
      deleteServer: vi.fn(),
    });

    render(
      <BrowserRouter>
        <MCPPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('No MCP servers found')).toBeInTheDocument();
  });
});