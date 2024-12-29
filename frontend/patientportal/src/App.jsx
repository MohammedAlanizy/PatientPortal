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
import CreateRequestPage from '@/pages/CreateRequestPage';
import { NotificationProvider } from '@/contexts/NotificationContext';
import FormPage from '@/pages/FormPage';

const AppLayout = ({ children, showNav }) => {
  const { isDarkMode } = useDarkMode();
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {showNav && <Navigation />}
      <main className="flex-1 pt-16 pl-4 pr-4 md:pl-16 md:pr-16"> 
        {children}
      </main>
    </div>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();
  const showNav = (location.pathname !== '/login' && location.pathname !== '/create-request');
  
  return (
    <AppLayout showNav={showNav}>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          <Routes location={location}>
            <Route path="/create-request" element={<CreateRequestPage />} />
            <Route path="/login" element={<SignInPage />} />
            <Route element={<ProtectedRoute allowedRoles={['inserter', 'verifier', 'admin']} />}>
              <Route path="/form" element={<FormPage />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={['verifier', 'admin']} />}>
              <Route path="/dashboard" element={<Dashboard userRole={localStorage.getItem("role")} />} />
              <Route path="/history" element={<HistoryView />} />
            </Route>
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