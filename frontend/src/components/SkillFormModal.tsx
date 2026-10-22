import { Skill } from '../types';

export type SkillLevel = 'enterprise' | 'personal' | 'project' | 'plugin';

const LEVELS: { value: SkillLevel; label: string }[] = [
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'personal', label: 'Personal' },
  { value: 'project', label: 'Project' },
  { value: 'plugin', label: 'Plugin' },
];

interface SkillFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  skill?: Skill;
  onSubmit: (data: Omit<Skill, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  loading: boolean;
}

export function SkillFormModal({ isOpen, onClose, mode, skill, onSubmit, loading }: SkillFormModalProps) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    name: skill?.name || '',
    level: skill?.level || 'personal',
    description: skill?.description || '',
    namespace: skill?.namespace || '',
    content: skill?.content || '',
    version: skill?.version || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="skill-modal-title">
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="skill-modal-title" className="modal-title">{mode === 'create' ? 'Create Skill' : 'Edit Skill'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">\u2715</button>
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
                disabled={mode === 'edit'}
                placeholder="e.g., deploy, test, lint"
              />
              {mode === 'edit' && <p className="text-xs text-[var(--color-text-muted)] mt-1">Name cannot be changed after creation.</p>}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="level" className="label">Level *</label>
              <select
                id="level"
                name="level"
                className="input"
                value={formData.level}
                onChange={handleChange}
                required
              >
                {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="namespace" className="label">Namespace (for plugin skills)</label>
              <input
                type="text"
                id="namespace"
                name="namespace"
                className="input"
                value={formData.namespace}
                onChange={handleChange}
                placeholder="plugin-name"
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
                placeholder="Brief description of the skill"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="content" className="label">Content</label>
              <textarea
                id="content"
                name="content"
                className="input"
                value={formData.content}
                onChange={handleChange}
                rows={5}
                placeholder="Skill definition content (markdown, JSON, etc.)"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="version" className="label">Version</label>
              <input
                type="text"
                id="version"
                name="version"
                className="input"
                value={formData.version}
                onChange={handleChange}
                placeholder="e.g., 1.0.0"
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

import { useState } from 'react';