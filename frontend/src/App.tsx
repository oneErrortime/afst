import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home, Login, Register, Books, Readers, Borrow, Settings, Groups, Categories, Library, Reader } from '@/pages';

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
      </Routes>
    </BrowserRouter>
  );
}
