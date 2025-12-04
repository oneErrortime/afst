import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { Home, Login, Register, Books, Readers, Borrow } from '@/pages';

export default function App() {
  return (
    <BrowserRouter basename="/afst">
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/books" element={<Books />} />
          <Route path="/readers" element={<Readers />} />
          <Route path="/borrow" element={<Borrow />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
