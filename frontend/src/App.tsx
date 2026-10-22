import { Layout } from './components/Layout';
import { SkillsPage } from './components/SkillsPage';
import { LearningPage } from './components/LearningPage';
import { MCPPage } from './components/MCPPage';
import { LoginPage } from './components/LoginPage';
import { useAuth } from './hooks/useAuth';
import { Routes, Route } from 'react-router-dom';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          Loading...
        </div>
      </Layout>
    );
  }
  
  if (!user) {
    return <LoginPage />;
  }
  
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <SkillsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/skills"
          element={
            <PrivateRoute>
              <SkillsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/learning"
          element={
            <PrivateRoute>
              <LearningPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/mcp"
          element={
            <PrivateRoute>
              <MCPPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </>
  );
}