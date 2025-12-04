import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home, Login, Register, Books, Readers, Borrow, Settings, Groups, Categories, Library, Reader, Subscriptions, AdminBooks, Users, Dashboard } from '@/pages';
import { Layout } from '@/components/layout';
import { ToastContainer } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';

export default function App() {
  const { isAuthenticated, user, fetchUser } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && !user) {
      fetchUser();
    }
  }, [isAuthenticated, user, fetchUser]);

  return (
    <BrowserRouter basename="/afst">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
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
    </BrowserRouter>
  );
}
