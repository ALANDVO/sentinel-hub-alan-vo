import { useEffect, useState } from 'react';
import { useSkills } from '../hooks/useSkills';
import { Skill, SkillCreate, SkillUpdate } from '../types';
import { SkillFormModal } from './SkillFormModal';
import { OverrideFormModal } from './OverrideFormModal';

type SkillLevel = 'enterprise' | 'personal' | 'project' | 'plugin';

const LEVELS: { value: SkillLevel; label: string }[] = [
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'personal', label: 'Personal' },
  { value: 'project', label: 'Project' },
  { value: 'plugin', label: 'Plugin' },
];

const VISIBILITY_LABELS: Record<string, string> = {
  'on': 'On',
  'name-only': 'Name Only',
  'user-invocable-only': 'User Invocable Only',
  'off': 'Off',
};

export function SkillsPage() {
  const {
    skills,
    effectiveSkills,
    overrides,
    loading,
    error,
    pagination,
    fetchSkills,
    fetchEffectiveSkills,
    fetchOverrides,
    createSkill,
    updateSkill,
    deleteSkill,
    createOverride,
    deleteOverride,
  } = useSkills();

  const [activeTab, setActiveTab] = useState<'all' | 'effective'>('all');
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<'enterprise' | 'personal' | 'project' | 'plugin' | ''>('');
  const [showSkillModal, setShowSkillModal] = useState<{ mode: 'create' | 'edit'; skill?: Skill } | null>(null);
  const [showOverrideModal, setShowOverrideModal] = useState<{ mode: 'create' | 'edit'; skillName?: string } | null>(null);

  useEffect(() => {
    fetchSkills({ page: pagination.page, page_size: pagination.page_size, search: search || undefined, level: levelFilter || undefined });
    fetchEffectiveSkills();
    fetchOverrides();
  }, [pagination.page, search, levelFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSkills({ page: 1, page_size: pagination.page_size, search: search || undefined, level: levelFilter || undefined });
  };

  const handlePageChange = (page: number) => {
    fetchSkills({ page, page_size: pagination.page_size, search: search || undefined, level: levelFilter || undefined });
  };

  const getLevelBadge = (level: 'enterprise' | 'personal' | 'project' | 'plugin') => {
    const badges: Record<string, string> = {
      enterprise: 'badge-enterprise',
      personal: 'badge-personal',
      project: 'badge-project',
      plugin: 'badge-plugin',
    };
    return badges[level] || '';
  };

  const getVisibilityBadge = (visibility: string) => {
    const badges: Record<string, string> = {
      on: 'badge-on',
      'name-only': 'badge-name-only',
      'user-invocable-only': 'badge-user-invocable-only',
      off: 'badge-off',
    };
    return badges[visibility] || '';
  };

  const displaySkills = activeTab === 'effective' ? effectiveSkills : skills;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Skills</h1>
          <p className="text-[var(--color-text-muted)] mt-1">
            Manage skills across enterprise, personal, project, and plugin levels with precedence resolution.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowSkillModal({ mode: 'create' })}>
          + Add Skill
        </button>
      </div>

      {error && <div className="card" style={{ borderColor: 'var(--color-error)', background: '#fef2f2' }}>{error}</div>}

      <div className="tabs" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'all'}
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Skills ({skills.length})
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'effective'}
          className={`tab ${activeTab === 'effective' ? 'active' : ''}`}
          onClick={() => setActiveTab('effective')}
        >
          Effective Skills ({effectiveSkills.length})
        </button>
      </div>

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="search"
          className="input"
          placeholder="Search skills..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search skills"
        />
        <select
          className="input"
          style={{ width: 'auto', minWidth: '160px' }}
          onChange={(e) => setLevelFilter(e.target.value as 'enterprise' | 'personal' | 'project' | 'plugin' | '')}
        >
          <option value="">All Levels</option>
          {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      {displaySkills.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h3>No skills found</h3>
          <p>{activeTab === 'effective' ? 'No effective skills after precedence resolution.' : 'Create your first skill to get started.'}</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Level</th>
                  <th>Namespace</th>
                  <th>Description</th>
                  <th style={{ width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displaySkills.map(skill => (
                  <tr key={skill.id}>
                    <td className="font-medium">{skill.name}</td>
                    <td><span className={`badge ${getLevelBadge(skill.level)}`}>{skill.level}</span></td>
                    <td>{skill.namespace || <span className="text-[var(--color-text-muted)]">—</span>}</td>
                    <td className="text-[var(--color-text-muted)] max-w-xs truncate">{skill.description || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {activeTab === 'all' && (
                          <>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => setShowSkillModal({ mode: 'edit', skill })}
                              aria-label={`Edit ${skill.name}`}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-ghost btn-sm btn-danger"
                              onClick={() => {
                                if (confirm(`Delete skill "${skill.name}"?`)) deleteSkill(skill.id);
                              }}
                              aria-label={`Delete ${skill.name}`}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {activeTab === 'all' && pagination.total > pagination.page_size && (
            <div className="pagination" role="navigation" aria-label="Pagination">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                aria-label="Previous page"
              >
                Previous
              </button>
              <span className="px-3 text-sm text-[var(--color-text-muted)]">
                Page {pagination.page} of {Math.ceil(pagination.total / pagination.page_size)}
              </span>
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.page_size)}
                aria-label="Next page"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Skill Overrides Section */}
      <section className="mt-12">
        <h2 className="text-lg font-semibold mb-4">Skill Overrides (Visibility Control)</h2>
        <p className="text-[var(--color-text-muted)] mb-4">
          Control skill visibility in the effective skills list. Overrides are keyed by skill name with visibility states:
          <code className="px-1.5 py-0.5 bg-[var(--color-bg)] rounded text-sm">on</code>,
          <code className="px-1.5 py-0.5 bg-[var(--color-bg)] rounded text-sm">name-only</code>,
          <code className="px-1.5 py-0.5 bg-[var(--color-bg)] rounded text-sm">user-invocable-only</code>,
          <code className="px-1.5 py-0.5 bg-[var(--color-bg)] rounded text-sm">off</code>.
          Plugin skills are managed via /plugin and are unaffected.
        </p>
        <button className="btn btn-secondary mb-4" onClick={() => setShowOverrideModal({ mode: 'create' })}>
          + Add Override
        </button>

        {overrides.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔧</div>
            <h3>No overrides configured</h3>
            <p>All skills are visible by default. Add an override to control visibility.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Skill Name</th>
                  <th>Visibility</th>
                  <th style={{ width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {overrides.map(override => (
                  <tr key={override.id}>
                    <td className="font-medium">{override.skill_name}</td>
                    <td><span className={`badge ${getVisibilityBadge(override.visibility)}`}>{VISIBILITY_LABELS[override.visibility] || override.visibility}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setShowOverrideModal({ mode: 'edit', skillName: override.skill_name })}
                          aria-label={`Edit override for ${override.skill_name}`}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-ghost btn-sm btn-danger"
                          onClick={() => {
                            if (confirm(`Delete override for "${override.skill_name}"?`)) deleteOverride(override.skill_name);
                          }}
                          aria-label={`Delete override for ${override.skill_name}`}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <SkillFormModal
        isOpen={!!showSkillModal}
        onClose={() => setShowSkillModal(null)}
        mode={showSkillModal?.mode ?? 'create'}
        skill={showSkillModal?.skill}
        onSubmit={async (data) => {
          if (showSkillModal?.mode === 'edit' && showSkillModal.skill) {
            await updateSkill(showSkillModal.skill.id, data as SkillUpdate);
          } else {
            await createSkill(data as SkillCreate);
          }
          setShowSkillModal(null);
        }}
        loading={loading}
      />

      <OverrideFormModal
        isOpen={!!showOverrideModal}
        onClose={() => setShowOverrideModal(null)}
        mode={showOverrideModal?.mode ?? 'create'}
        skillName={showOverrideModal?.skillName}
        existingOverrides={overrides}
        onSubmit={async (data) => {
          await createOverride(data);
          setShowOverrideModal(null);
        }}
        loading={loading}
      />
    </div>
  );
}