import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Lock, User, Sun, Moon, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDarkMode } from '../hooks/useDarkMode';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DualLogo from '@/components/layout/DualLogo';
import Footer from '@/components/layout/Footer';
const roleRedirectMap = {
  admin: '/dashboard',
  verifier: '/dashboard',
  inserter: '/form'
};

const SignInPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { login, isLoading, error } = useAuth();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await login(credentials);
      const targetPath = location.state?.from || roleRedirectMap[response.role] || '/dashboard';
      navigate(targetPath, { replace: true });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 relative flex flex-col items-center justify-between p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          className="absolute top-4 right-4"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isDarkMode ? 'dark' : 'light'}
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </motion.div>
          </AnimatePresence>
        </Button>

        <div className="flex w-full max-w-md flex-1 flex-col justify-center">
          <motion.div className="mb-6 text-center">
            <div className="relative flex justify-center items-center p-6">
              <DualLogo size="large" />
            </div>
          </motion.div>

          <Card className="w-full p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-center mb-6">Sign In</h2>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      className="pl-10"
                      value={credentials.username}
                      onChange={(e) =>
                        setCredentials({ ...credentials, username: e.target.value })
                      }
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      className="pl-10"
                      value={credentials.password}
                      onChange={(e) =>
                        setCredentials({ ...credentials, password: e.target.value })
                      }
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </motion.div>
          </Card>
        </div>

        <Footer/>
      </div>
    </div>
  );
};

export default SignInPage;