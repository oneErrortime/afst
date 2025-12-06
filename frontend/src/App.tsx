import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Home, Login, Register, Books, Readers, Borrow, Settings, Groups, Categories, Library, Reader, Subscriptions, AdminBooks, Users, Dashboard, Setup } from '@/pages';
import { Layout } from '@/components/layout';
import { ToastContainer } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { getSetupStatus } from '@/api/client';
import { Loader2 } from 'lucide-react';

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
  const { isAuthenticated, user, fetchUser } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && !user) {
      fetchUser();
    }
  }, [isAuthenticated, user, fetchUser]);

  return (
    <BrowserRouter basename="/afst">
      <SetupRedirect>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/setup" element={<Setup />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/books" element={<Books />} />
            <Route path="/readers" element={<Readers />} />
            <Route path="/borrow" element={<Borrow />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/library" element={<Library />} />
            <Route path="/reader/:bookId" element={<Reader />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/admin/books" element={<AdminBooks />} />
            <Route path="/admin/users" element={<Users />} />
            <Route path="/admin/dashboard" element={<Dashboard />} />
          </Route>
        </Routes>
        <ToastContainer />
      </SetupRedirect>
    </BrowserRouter>
  );
}
