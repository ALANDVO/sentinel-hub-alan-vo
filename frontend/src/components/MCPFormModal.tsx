import { useState } from 'react';
import { MCPServer, MCPServerCreate, MCPServerUpdate } from '../types';

interface MCPFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  server?: MCPServer;
  categories: string[];
  onSubmit: (data: MCPServerCreate | MCPServerUpdate) => Promise<void>;
  loading: boolean;
}

const AUTH_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'oauth', label: 'OAuth' },
  { value: 'token', label: 'API Token' },
  { value: 'api_key', label: 'API Key' },
];

export function MCPFormModal({ isOpen, onClose, mode, server, categories, onSubmit, loading }: MCPFormModalProps) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    name: server?.name || '',
    description: server?.description || '',
    category: server?.category || '',
    repository_url: server?.repository_url || '',
    documentation_url: server?.documentation_url || '',
    auth_type: server?.auth_type || 'none',
    realtime: server?.realtime || false,
    tags: server?.tags?.join(', ') || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      realtime: formData.realtime,
    };
    await onSubmit(submitData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="mcp-modal-title">
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="mcp-modal-title" className="modal-title">{mode === 'create' ? 'Add MCP Server' : 'Edit MCP Server'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="name" className="label">Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                className="input"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g., filesystem, github, postgres"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="description" className="label">Description</label>
              <textarea
                id="description"
                name="description"
                className="input"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Describe what this MCP server does"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="category" className="label">Category</label>
              <select
                id="category"
                name="category"
                className="input"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Select category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="custom">Custom...</option>
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="repository_url" className="label">Repository URL</label>
              <input
                type="url"
                id="repository_url"
                name="repository_url"
                className="input"
                value={formData.repository_url}
                onChange={handleChange}
                placeholder="https://github.com/owner/repo"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="documentation_url" className="label">Documentation URL</label>
              <input
                type="url"
                id="documentation_url"
                name="documentation_url"
                className="input"
                value={formData.documentation_url}
                onChange={handleChange}
                placeholder="https://example.com/docs"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="auth_type" className="label">Auth Type</label>
              <select
                id="auth_type"
                name="auth_type"
                className="input"
                value={formData.auth_type}
                onChange={handleChange}
              >
                {AUTH_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label className="label flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="realtime"
                  checked={formData.realtime}
                  onChange={handleChange}
                  className="w-4 h-4 text-[var(--color-primary)]"
                />
                <span>Realtime (streaming)</span>
              </label>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="tags" className="label">Tags (comma-separated)</label>
              <input
                type="text"
                id="tags"
                name="tags"
                className="input"
                value={formData.tags}
                onChange={handleChange}
                placeholder="filesystem, local, development"
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !formData.name.trim()}>
              {loading ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}