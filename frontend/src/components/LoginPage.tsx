import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate, useSearchParams } from 'react-router-dom';

export function LoginPage() {
  const { user, login, handleCallback, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');
    
    if (errorParam) {
      setError(`Authentication failed: ${searchParams.get('error_description') || errorParam}`);
      return;
    }
    
    if (code && state) {
      setLoading(true);
      handleCallback(searchParams)
        .then(() => {
          window.history.replaceState({}, document.title, '/');
        })
        .catch(() => {
          setError('Authentication failed. Please try again.');
        })
        .finally(() => setLoading(false));
    }
  }, [searchParams, handleCallback]);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await login();
    } catch {
      setError('Failed to initiate login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">sentinel-hub-alan-vo</h1>
          <p className="text-[var(--color-text-muted)] mt-2">Sign in to continue</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-[var(--color-primary)] border-t-transparent"></div>
            <p className="mt-3 text-[var(--color-text-muted)]">Redirecting to Keycloak...</p>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            className="btn btn-primary w-full py-3 text-lg"
            disabled={authLoading}
          >
            Sign in with Keycloak
          </button>
        )}

        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          Demo mode: Configure Keycloak at <code className="px-1.5 py-0.5 bg-[var(--color-bg)] rounded">http://localhost:8080</code>
        </p>
      </div>
    </div>
  );
}

import { useState } from 'react';