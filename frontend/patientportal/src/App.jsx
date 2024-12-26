import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDarkMode } from './hooks/useDarkMode';
import Navigation from './components/layout/Navigation';
import SignInPage from './pages/SignInPage';
import Dashboard from './components/dashboard/Dashboard';
import RequestForm from './components/dashboard/RequestForm';
import HistoryView from './components/dashboard/HistoryView';
import ManageUsers from './components/admin/ManageUsers';
import { ProtectedRoute } from './components/layout/outlet';
import { AnimatePresence, motion } from 'framer-motion';
import { NotificationProvider } from '@/contexts/NotificationContext';
const AppLayout = ({ children, showNav }) => {
  const { isDarkMode } = useDarkMode();
  
  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="bg-background text-foreground min-h-screen">
        {showNav && <Navigation />}
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </div>
  );
};



const AnimatedRoutes = () => {
  const location = useLocation();
  const showNav = location.pathname !== '/login';

  return (
    <AppLayout showNav={showNav}>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
      <Routes location={location}>
        <Route path="/login" element={<SignInPage />} />
        
        {/* Protected Routes for Inserting Role */}
        <Route element={<ProtectedRoute allowedRoles={['inserter', 'verifier', 'admin']} />}>
          <Route path="/form" element={<RequestForm />} />
        </Route>
        {/* Protected Routes for Verifier Role */}
        <Route element={<ProtectedRoute allowedRoles={['verifier', 'admin']} />}>
          <Route path="/dashboard" element={<Dashboard userRole={localStorage.getItem("role")} />} />
          <Route path="/history" element={<HistoryView />} />
        </Route>

        {/* Protected Routes for Admin Role */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/manage" element={<ManageUsers />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
        </motion.div>
      </AnimatePresence>
    </AppLayout>
  );
};

const App = () => {
  return (
    <NotificationProvider>
    <BrowserRouter>
        <AnimatedRoutes />
    </BrowserRouter>
    </NotificationProvider>
  );
};

export default App;