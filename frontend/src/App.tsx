import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home, Login, Register, Books, Readers, Borrow, Settings, Groups, Categories, Library, Reader, Subscriptions, AdminBooks } from '@/pages';

export default function App() {
  return (
    <BrowserRouter basename="/afst">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
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
      </Routes>
    </BrowserRouter>
  );
}
