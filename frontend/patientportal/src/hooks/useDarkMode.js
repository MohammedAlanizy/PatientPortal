import { useState, useEffect } from 'react';

export const useDarkMode = () => {
  // Initialize state with a function to avoid running the logic twice
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check if we're in the browser environment
    if (typeof window === 'undefined') return true;
    
    // Check local storage first
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      // Apply the saved mode immediately
      document.documentElement.classList.toggle('dark', savedMode === 'true');
      return savedMode === 'true';
    }
    
    // If no saved preference, check system preference
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', systemPrefersDark);
    return systemPrefersDark;
  });

  // Effect to handle system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (localStorage.getItem('darkMode') === null) {
        setIsDarkMode(e.matches);
      }
    };

    // Add listener for system theme changes
    if (mediaQuery?.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Effect to sync dark mode changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  return { isDarkMode, toggleDarkMode };
};