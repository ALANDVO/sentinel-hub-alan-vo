import { useState, useCallback } from 'react';
import { api } from '../api/client';
import { MCPServer, MCPServerListResponse, MCPServerCreate, MCPServerUpdate } from '../types';

export function useMCP() {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, page_size: 20, total: 0 });

  const fetchServers = useCallback(async (params?: { category?: string; search?: string; page?: number; page_size?: number }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listMCPServers(params) as MCPServerListResponse;
      setServers(data.items);
      setPagination(prev => ({ ...prev, page: data.page, page_size: data.page_size, total: data.total }));
    } catch (err) {
      setError('Failed to fetch MCP servers');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await api.getMCPSategories() as string[];
      setCategories(data);
    } catch (err) {
      setError('Failed to fetch categories');
      throw err;
    }
  }, []);

  const createServer = useCallback(async (data: MCPServerCreate) => {
    setLoading(true);
    try {
      const server = await api.createMCPServer(data) as MCPServer;
      setServers(prev => [server, ...prev]);
      return server;
    } catch (err) {
      setError('Failed to create MCP server');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateServer = useCallback(async (id: number, data: MCPServerUpdate) => {
    setLoading(true);
    try {
      const server = await api.updateMCPServer(id, data) as MCPServer;
      setServers(prev => prev.map(s => s.id === id ? server : s));
      return server;
    } catch (err) {
      setError('Failed to update MCP server');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteServer = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await api.deleteMCPServer(id);
      setServers(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      setError('Failed to delete MCP server');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    servers,
    categories,
    loading,
    error,
    pagination,
    fetchServers,
    fetchCategories,
    createServer,
    updateServer,
    deleteServer,
  };
}