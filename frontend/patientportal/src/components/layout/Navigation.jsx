import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  UserPlus,
  History,
  LogOut,
  Sun,
  Moon,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDarkMode } from '@/hooks/useDarkMode';
import { cn } from '@/lib/utils';

const Navigation = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  // You would typically get this from your auth context/state
  const userRole = localStorage.getItem('role') || 'checking';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const navItems = {
    inserter: [
      {
        to: '/form',
        icon: UserPlus,
        label: 'New Request',
      },
    ],
    verifier: [
      {
        to: '/dashboard',
        icon: LayoutDashboard,
        label: 'Dashboard',
      },
      {
        to: '/form',
        icon: UserPlus,
        label: 'New Request',
      },
      {
        to: '/history',
        icon: History,
        label: 'History',
      },
    ],
    admin: [
      {
        to: '/dashboard',
        icon: LayoutDashboard,
        label: 'Dashboard',
      },
      {
        to: '/form',
        icon: UserPlus,
        label: 'New Request',
      },
      {
        to: '/history',
        icon: History,
        label: 'History',
      },
      {
        to: '/manage',
        icon: Settings,
        label: 'Manage Users',
      },
    ],
  };

  const availableNavItems = navItems[userRole] || [];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg"
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <img
                src="/logo.png"
                alt="Ministry of Health"
                className="h-10 w-auto"
              />
            </motion.div>

            <div className="flex items-center space-x-1">
              {availableNavItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200',
                      'hover:bg-accent hover:text-accent-foreground',
                      'active:scale-95',
                      isActive && 'bg-primary text-primary-foreground shadow-sm'
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="hover:bg-accent"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isDarkMode ? 'dark' : 'light'}
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  {isDarkMode ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </motion.div>
              </AnimatePresence>
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleLogout}
              className="hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navigation;