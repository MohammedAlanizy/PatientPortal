import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  UserPlus,
  History,
  LogOut,
  Sun,
  Moon,
  Settings,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDarkMode } from '@/hooks/useDarkMode';
import { cn } from '@/lib/utils';
import DualLogo from '@/components/layout/DualLogo';
import UsernameDisplay from '@/components/layout/UsernameDisplay';

const Navigation = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const userRole = localStorage.getItem('role') || 'checking';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
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

  const NavItems = ({ mobile = false }) => (
    <>
      {availableNavItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          onClick={() => mobile && setIsMenuOpen(false)}
          className={({ isActive }) =>
            cn(
              'flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200',
              'hover:bg-accent hover:text-accent-foreground',
              'active:scale-95',
              isActive && 'bg-primary text-primary-foreground shadow-sm',
              mobile && 'w-full'
            )
          }
        >
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </NavLink>
      ))}
    </>
  );

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg"
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4 lg:gap-8">
            <DualLogo size="small" className="lg:size-default" />

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <NavItems />
            </div>
          </div>

          <div className="flex items-center space-x-2 lg:space-x-4">
            <UsernameDisplay 
              username={localStorage.getItem('username') || 'User'} 
              className="hidden sm:flex"
            />
            
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
              className="hover:bg-destructive hover:text-destructive-foreground transition-colors hidden sm:flex"
            >
              <LogOut className="h-5 w-5" />
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t"
            >
              <div className="flex flex-col space-y-2 py-4">
                <NavItems mobile />
                <div className="flex items-center justify-between pt-2 border-t">
                  <UsernameDisplay 
                    username={localStorage.getItem('username') || 'User'} 
                    className="sm:hidden"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleLogout}
                    className="hover:bg-destructive hover:text-destructive-foreground transition-colors sm:hidden"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navigation;