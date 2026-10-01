import { type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { Login } from './features/auth/pages/Login';
import EmailVerified from './features/auth/pages/EmailVerified';
import EmailVerify from './features/auth/pages/EmailVerify';
import { FichasPage } from './features/dashboard/pages/Dashboard';
import { TemplatesHub } from './features/templates/pages/TemplatesHub';
import { TemplateBuilder } from './features/builder/pages/TemplateBuilder';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { useAuthStore } from './store/useAuthStore';
import { useThemeStore } from './store/useThemeStore';
import { useEffect } from 'react';

const queryClient = new QueryClient();

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const isAuth = useAuthStore(s => s.isAuthenticated);
  if (!isAuth) return <Navigate to="/login" replace />;
  return children;
};

// Login Route Wrapper (Redirect to dashboard if already logged in)
const PublicRoute = ({ children }: { children: ReactNode }) => {
  const isAuth = useAuthStore(s => s.isAuthenticated);
  if (isAuth) return <Navigate to="/fichas" replace />;
  return children;
};

// Hybrid Theme Engine Listener
function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useThemeStore(s => s.theme);

  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = (mode: 'light' | 'dark') => {
      root.classList.remove('light', 'dark');
      if (mode === 'light') {
        root.classList.add('light');
      }
    };

    if (theme === 'system') {
      const systemPrefersLight = window.matchMedia(
        '(prefers-color-scheme: light)',
      ).matches;
      applyTheme(systemPrefersLight ? 'light' : 'dark');

      const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
      const handleChange = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'light' : 'dark');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      applyTheme(theme);
    }
  }, [theme]);

  // Pass system/resolved theme to Sonner Toaster context
  const getSonnerTheme = () => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark';
    }
    return theme;
  };

  return (
    <>
      <Toaster position="top-right" theme={getSonnerTheme()} richColors />
      {children}
    </>
  );
}

function App() {
  // Attempt silent refresh on app startup to bootstrap auth state
  useEffect(() => {
    // call bootstrap from the zustand store
    useAuthStore.getState().bootstrap();
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />

            {/* Protected Layout wrapper */}
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/fichas" element={<FichasPage />} />
              <Route path="/templates" element={<TemplatesHub />} />
              <Route path="/templates/builder" element={<TemplateBuilder />} />
              <Route path="/templates/builder/:id" element={<TemplateBuilder />} />
              <Route path="/email-verified" element={<EmailVerified />} />
              <Route path="/email-verify" element={<EmailVerify />} />
              <Route path="/verify-email" element={<EmailVerify />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
