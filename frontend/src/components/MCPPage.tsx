import { useEffect, useState } from 'react';
import { useMCP } from '../hooks/useMCP';
import { MCPServer, MCPServerCreate } from '../types';
import { MCPFormModal } from './MCPFormModal';

export function MCPPage() {
  const {
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
  } = useMCP();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState<{ mode: 'create' | 'edit'; server?: MCPServer } | null>(null);

  useEffect(() => {
    fetchServers({ page: pagination.page, page_size: pagination.page_size, search: search || undefined, category: categoryFilter || undefined });
    fetchCategories();
  }, [pagination.page, search, categoryFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchServers({ page: 1, page_size: pagination.page_size, search: search || undefined, category: categoryFilter || undefined });
  };

  const handlePageChange = (page: number) => {
    fetchServers({ page, page_size: pagination.page_size, search: search || undefined, category: categoryFilter || undefined });
  };

  const authTypeLabels: Record<string, string> = {
    none: 'None',
    oauth: 'OAuth',
    token: 'API Token',
    api_key: 'API Key',
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">MCP Server Catalog</h1>
          <p className="text-[var(--color-text-muted)] mt-1">
            Browse and manage Model Context Protocol servers for Claude Code.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal({ mode: 'create' })}>
          + Add Server
        </button>
      </div>

      {error && <div className="card mb-6" style={{ borderColor: 'var(--color-error)', background: '#fef2f2' }}>{error}</div>}

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="search"
          className="input"
          placeholder="Search servers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search MCP servers"
        />
        <select
          className="input"
          style={{ width: 'auto', minWidth: '180px' }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      {servers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔌</div>
          <h3>No MCP servers found</h3>
          <p>Add your first MCP server to get started.</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Auth Type</th>
                  <th>Realtime</th>
                  <th>Repository</th>
                  <th style={{ width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {servers.map(server => (
                  <tr key={server.id}>
                    <td className="font-medium">{server.name}</td>
                    <td>{server.category || <span className="text-[var(--color-text-muted)]">—</span>}</td>
                    <td>
                      {server.auth_type ? (
                        <span className="badge" style={{ background: '#e0e7ff', color: '#3730a3' }}>
                          {authTypeLabels[server.auth_type] || server.auth_type}
                        </span>
                      ) : (
                        <span className="text-[var(--color-text-muted)]">—</span>
                      )}
                    </td>
                    <td>{server.realtime ? '✓' : '✗'}</td>
                    <td>
                      {server.repository_url ? (
                        <a href={server.repository_url} target="_blank" rel="noopener noreferrer" className="text-sm">
                          View
                        </a>
                      ) : (
                        <span className="text-[var(--color-text-muted)]">—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setShowModal({ mode: 'edit', server })}
                          aria-label={`Edit ${server.name}`}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-ghost btn-sm btn-danger"
                          onClick={() => {
                            if (confirm(`Delete "${server.name}"?`)) deleteServer(server.id);
                          }}
                          aria-label={`Delete ${server.name}`}
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

          {pagination.total > pagination.page_size && (
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

      <MCPFormModal
        isOpen={!!showModal}
        onClose={() => setShowModal(null)}
        mode={showModal?.mode ?? 'create'}
        server={showModal?.server}
        categories={categories}
        onSubmit={async (data) => {
          if (showModal?.mode === 'edit' && showModal.server) {
            await updateServer(showModal.server.id, data as MCPServerCreate);
          } else {
            await createServer(data as MCPServerCreate);
          }
          setShowModal(null);
        }}
        loading={loading}
      />
    </div>
  );
}