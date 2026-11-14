import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import { Toaster } from 'react-hot-toast';

const App = () => {
  const location = useLocation();
  const hideNavbar = location.pathname === '/login' || location.pathname.startsWith('/track');

  return (
    <div className="min-h-screen text-[#292522]">
      {!hideNavbar && <Navbar />}
      <Outlet />
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: {
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            color: '#292522',
            border: '1px solid rgba(165, 167, 155, 0.35)',
            boxShadow: '0 12px 32px rgba(41, 37, 34, 0.1)',
            borderRadius: '16px',
            fontSize: '14px',
            fontWeight: '500',
            padding: '12px 18px',
          },
          success: {
            iconTheme: {
              primary: '#2E7D32',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#690907',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
    </div>
  );
};

export default App;
