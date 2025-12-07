import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Home, Login, Register, Books, Readers, Borrow, Settings, Groups, Categories, Library, Reader, Subscriptions, AdminBooks, Users, Dashboard, Setup, Collections, BookDetail, Profile, AutoDashboard, AutoResource } from '@/pages';
import { Layout } from '@/components/layout';
import { ToastContainer, ErrorBoundary } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { getSetupStatus } from '@/api/client';
import { initializeApiSystem } from '@/api';
import { Loader2 } from 'lucide-react';
import { eventBus } from '@/lib/eventBus';

function SetupRedirect({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const { setup_needed } = await getSetupStatus();
        if (setup_needed && location.pathname !== '/setup') {
          navigate('/setup');
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to check setup status", error);
        setLoading(false); // Proceed even if check fails
      }
    };
    checkSetup();
  }, [navigate, location.pathname]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return <>{children}</>;
}


export default function App() {
  const { isAuthenticated, user, fetchUser, logout } = useAuthStore();

  useEffect(() => {
    initializeApiSystem();
    const unsubscribe = eventBus.on('api:unauthorized', () => {
      logout();
    });
    return () => unsubscribe();
  }, [logout]);

  useEffect(() => {
    if (isAuthenticated && !user) {
      fetchUser();
    }
  }, [isAuthenticated, user, fetchUser]);

  return (
    <ErrorBoundary showDetails>
      <BrowserRouter basename="/afst">
        <SetupRedirect>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/setup" element={<Setup />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/books" element={<Books />} />
            <Route path="/books/:id" element={<BookDetail />} />
            <Route path="/readers" element={<Readers />} />
            <Route path="/borrow" element={<Borrow />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/library" element={<Library />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/books/:bookId/read" element={<Reader />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/admin/books" element={<AdminBooks />} />
            <Route path="/admin/users" element={<Users />} />
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/auto" element={<AutoDashboard />} />
            <Route path="/auto/:resource" element={<AutoResource />} />
          </Route>
        </Routes>
          <ToastContainer />
        </SetupRedirect>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
