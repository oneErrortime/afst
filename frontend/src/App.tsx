import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  Home, Login, Register, Books, Readers, Borrow, Settings, Groups, Categories,
  Library, Reader, Subscriptions, AdminBooks, Users, Dashboard, Setup, Collections,
  BookDetail, Profile, AutoDashboard, AutoResource,
} from '@/pages';
import { Layout } from '@/components/layout';
import { ToastContainer, ErrorBoundary, Loading } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { initializeApiSystem } from '@/api';
import { eventBus } from '@/lib/eventBus';

// ─── Route Guards ──────────────────────────────────────────────────────────────

/** Redirect to login if not authenticated */
function PrivateRoute() {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const location = useLocation();

  if (!isInitialized) return <Loading />;
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}

/** Redirect non-staff users away */
function StaffRoute() {
  const { isAuthenticated, isInitialized, user } = useAuthStore();
  const location = useLocation();

  if (!isInitialized) return <Loading />;
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  const isStaff = user?.role === 'admin' || user?.role === 'librarian';
  if (!isStaff) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

/** Redirect non-admins away */
function AdminRoute() {
  const { isAuthenticated, isInitialized, user } = useAuthStore();
  const location = useLocation();

  if (!isInitialized) return <Loading />;
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

/** Redirect authenticated users away from login/register */
function GuestRoute() {
  const { isAuthenticated, isInitialized } = useAuthStore();

  if (!isInitialized) return <Loading />;
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

// ─── Inner App (needs Router context) ─────────────────────────────────────────

function AppInner() {
  const { initialize, logout, isAuthenticated, isInitialized } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    initializeApiSystem();
    initialize();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const unsub = eventBus.on('api:unauthorized', () => {
      logout();
      navigate('/login', { replace: true });
    });
    return unsub;
  }, [logout, navigate]);

  if (!isInitialized) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/setup" element={<Setup />} />

        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<Layout />}>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/books" element={<Books />} />
          <Route path="/books/:id" element={<BookDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/subscriptions" element={<Subscriptions />} />

          {/* Authenticated */}
          <Route element={<PrivateRoute />}>
            <Route path="/library" element={<Library />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/books/:bookId/read" element={<Reader />} />
            <Route path="/profile/:id" element={<Profile />} />
          </Route>

          {/* Librarians + Admins */}
          <Route element={<StaffRoute />}>
            <Route path="/readers" element={<Readers />} />
            <Route path="/borrow" element={<Borrow />} />
            <Route path="/admin/books" element={<AdminBooks />} />
            <Route path="/admin/users" element={<Users />} />
            <Route path="/admin/dashboard" element={<Dashboard />} />
          </Route>

          {/* Admins only */}
          <Route element={<AdminRoute />}>
            <Route path="/auto" element={<AutoDashboard />} />
            <Route path="/auto/:resource" element={<AutoResource />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />} />
      </Routes>
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary showDetails>
      <BrowserRouter basename="/afst">
        <AppInner />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
