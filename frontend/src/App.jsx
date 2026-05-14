import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import useAuthStore from './store/useAuthStore';
import { setAuthStore } from './lib/api';
import Navbar from './components/Navbar';
import CommandPalette from './components/CommandPalette';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ImportPage from './pages/ImportPage';
import SettingsPage from './pages/SettingsPage';
import AddBookmarkPage from './pages/AddBookmarkPage';
import Sidebar from './components/Sidebar';
import { ThemeProvider } from './components/ThemeProvider';
import { useSearch } from './hooks/useSearch';

// Wire the auth store into the API interceptor so 401s clear Zustand state
setAuthStore(useAuthStore);
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token);

  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function AppLayout() {
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('recentSearches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const { search, results, isSearching } = useSearch();

  const handleSelectSearchResult = (query) => {
    if (!query || !query.trim()) return;
    const q = query.trim();
    setRecentSearches((prev) => {
      const updated = [q, ...prev.filter((item) => item !== q)].slice(0, 3);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCmdOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="h-screen bg-bg flex flex-col overflow-hidden">
      <Navbar 
        onCommandPaletteOpen={() => setIsCmdOpen(true)} 
        onMenuToggle={() => setIsSidebarOpen(prev => !prev)}
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden relative">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/add" element={<AddBookmarkPage />} />
            <Route path="/import" element={<ImportPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <CommandPalette
        isOpen={isCmdOpen}
        onClose={() => setIsCmdOpen(false)}
        onSearch={search}
        onSelectResult={handleSelectSearchResult}
        results={results}
        recentSearches={recentSearches}
      />
    </div>
  );
}

function PublicRoute({ children }) {
  const token = useAuthStore((s) => s.token);

  if (token) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Check if already hydrated
    if (useAuthStore.persist.hasHydrated()) {
      useAuthStore.getState().initAuth();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsHydrated(true);
      return;
    }

    // Listen for hydration to finish
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      useAuthStore.getState().initAuth();
      setIsHydrated(true);
    });

    // Fallback: force render after 2 seconds if hydration never signals
    const timeout = setTimeout(() => {
      setIsHydrated(true);
    }, 2000);

    return () => {
      unsub();
      clearTimeout(timeout);
    };
  }, []);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="bookmarkvault-theme">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/*" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
        </Routes>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              fontSize: '14px',
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
    </ThemeProvider>
  );
}
