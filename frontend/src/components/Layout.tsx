import { ReactNode, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  children?: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, loading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/skills', label: 'Skills' },
    { path: '/learning', label: 'Learning' },
    { path: '/mcp', label: 'MCP Catalog' },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return children ? <>{children}</> : <Outlet />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] sticky top-0 z-50">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="font-bold text-xl text-[var(--color-primary)]">
                sentinel-hub-alan-vo
              </Link>
              <nav className="hidden md:flex items-center gap-1" role="navigation" aria-label="Main navigation">
                {navItems.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-[var(--color-primary)] bg-[var(--color-primary-light)]'
                          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)]'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-[var(--color-text-muted)] hidden sm:block">
                {user.email}
              </span>
              <span
                className="px-2 py-1 text-xs font-medium rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]"
              >
                {user.roles.includes('admin') ? 'Admin' : 'User'}
              </span>
              <button
                onClick={logout}
                className="btn btn-ghost text-sm"
                aria-label="Log out"
              >
                Log out
              </button>
              <button
                className="md:hidden btn btn-ghost"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? '\u2715' : '\u2630'}
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-[var(--color-border)]">
              <nav className="flex flex-col gap-2" role="navigation" aria-label="Mobile navigation">
                {navItems.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-md text-sm font-medium ${
                        isActive
                          ? 'text-[var(--color-primary)] bg-[var(--color-primary-light)]'
                          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)]'
                      }`
                    }
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>
          )}
        </div>
      </header>
      <main className="flex-1 container py-8" role="main">
        {children ?? <Outlet />}
      </main>
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] py-8">
        <div className="container">
          <p className="text-center text-sm text-[var(--color-text-muted)]">
            sentinel-hub-alan-vo \u2014 AI & Machine Learning | Alan Vo \u003calanvo@gmail.com\u003e
          </p>
        </div>
      </footer>
    </div>
  );
}