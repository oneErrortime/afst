import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { ToastContainer } from '@/components/ui';

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} LibraryAPI. Система управления библиотекой.
          </p>
        </div>
      </footer>
      <ToastContainer />
    </div>
  );
}
