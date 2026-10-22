import { useState } from 'react';
import { SkillOverride, SkillVisibility } from '../types';

interface OverrideFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  skillName?: string;
  existingOverrides: SkillOverride[];
  onSubmit: (data: { skill_name: string; visibility: SkillVisibility }) => Promise<void>;
  loading: boolean;
}

const VISIBILITY_OPTIONS: { value: SkillVisibility; label: string; description: string }[] = [
  { value: 'on', label: 'On', description: 'Name and description shown in / menu' },
  { value: 'name-only', label: 'Name Only', description: 'Only name shown in / menu' },
  { value: 'user-invocable-only', label: 'User Invocable Only', description: 'Hidden from listing but invocable' },
  { value: 'off', label: 'Off', description: 'Completely hidden' },
];

export function OverrideFormModal({ isOpen, onClose, mode, skillName, existingOverrides, onSubmit, loading }: OverrideFormModalProps) {
  if (!isOpen) return null;

  const availableSkills = existingOverrides.map(o => o.skill_name);
  const [formData, setFormData] = useState({
    skill_name: skillName || '',
    visibility: 'on' as SkillVisibility,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="override-modal-title">
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="override-modal-title" className="modal-title">{mode === 'create' ? 'Create Override' : 'Edit Override'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">\u2715</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="skill_name" className="label">Skill Name *</label>
              {mode === 'edit' ? (
                <input
                  type="text"
                  id="skill_name"
                  name="skill_name"
                  className="input"
                  value={formData.skill_name}
                  readOnly
                  disabled
                />
              ) : (
                <select
                  id="skill_name"
                  name="skill_name"
                  className="input"
                  value={formData.skill_name}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a skill</option>
                  {availableSkills.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              )}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="visibility" className="label">Visibility *</label>
              <select
                id="visibility"
                name="visibility"
                className="input"
                value={formData.visibility}
                onChange={handleChange}
                required
              >
                {VISIBILITY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                {VISIBILITY_OPTIONS.find(opt => opt.value === formData.visibility)?.description}
              </p>
            </div>
            <div className="p-3 bg-[var(--color-bg)] rounded-md text-sm">
              <strong>Note:</strong> Overrides control visibility only, not precedence.
              Precedence order is: Enterprise \u003E Personal \u003E Project \u003E Plugin (namespace-qualified).
              Plugin skills are managed via <code className="px-1.5 py-0.5 bg-white rounded">/plugin</code> and are unaffected by overrides.
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !formData.skill_name.trim()}>
              {loading ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}