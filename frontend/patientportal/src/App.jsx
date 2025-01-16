import React, { Suspense, lazy } from 'react';

import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDarkMode } from './hooks/useDarkMode';
import { ProtectedRoute } from './components/layout/outlet';
import { AnimatePresence, motion } from 'framer-motion';
import { NotificationProvider } from '@/contexts/NotificationContext';

import { Loader2 } from 'lucide-react';

// Lazy load components
const Navigation = lazy(() => import('./components/layout/Navigation'));
const SignInPage = lazy(() => import('./pages/SignInPage'));
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const RequestForm = lazy(() => import('./components/dashboard/RequestForm'));
const HistoryView = lazy(() => import('./components/dashboard/HistoryView'));
const ManageUsers = lazy(() => import('./components/admin/ManageUsers'));
const CreateRequestPage = lazy(() => import('@/pages/CreateRequestPage'));
const FormPage = lazy(() => import('@/pages/FormPage'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const AppLayout = ({ children, showNav }) => {
  const { isDarkMode } = useDarkMode();
  
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {showNav && (
        <Suspense fallback={<LoadingFallback />}>
          <Navigation />
        </Suspense>
      )}
      <main className="flex-1 pt-16 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto w-full"> 
        {children}
      </main>
    </div>
  );
};

// Memoized page transition variants
const pageTransitionVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.2 }
};

const AnimatedRoutes = () => {
  const location = useLocation();
  const showNav = !['/login', '/create-request'].includes(location.pathname);
  
  return (
    <AppLayout showNav={showNav}>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          {...pageTransitionVariants}
          className="h-full w-full"
        >
          <Suspense fallback={<LoadingFallback />}>
            <Routes location={location}>
              <Route path="/create-request" element={<CreateRequestPage />} />
              <Route path="/login" element={<SignInPage />} />
              
              {/* Protected Routes */}
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
          </Suspense>
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