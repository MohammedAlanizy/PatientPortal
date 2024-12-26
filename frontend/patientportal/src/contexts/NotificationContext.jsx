// src/contexts/NotificationContext.jsx
import React, { createContext, useContext, useReducer } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

const NotificationContext = createContext(null);

const NOTIFICATION_TYPES = {
  success: {
    icon: CheckCircle,
    className: 'bg-emerald-50 border-l-4 border-l-emerald-500 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-l-emerald-500',
    iconClass: 'text-emerald-500'
  },
  error: {
    icon: AlertCircle,
    className: 'bg-rose-50 border-l-4 border-l-rose-500 text-rose-800 dark:bg-rose-950/30 dark:text-rose-300 dark:border-l-rose-500',
    iconClass: 'text-rose-500'
  },
  info: {
    icon: Info,
    className: 'bg-sky-50 border-l-4 border-l-sky-500 text-sky-800 dark:bg-sky-950/30 dark:text-sky-300 dark:border-l-sky-500',
    iconClass: 'text-sky-500'
  }
};

const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return [...state, { id: Date.now(), ...action.payload }];
    case 'REMOVE_NOTIFICATION':
      return state.filter(notification => notification.id !== action.payload);
    default:
      return state;
  }
};

// Progress bar component
const ProgressBar = ({ duration }) => (
  <motion.div
    initial={{ width: 0 }}
    animate={{ width: "100%" }}
    transition={{ duration: duration / 1000 }}
    className="absolute bottom-0 left-0 h-1 bg-black/10 dark:bg-white/10"
  />
);

export const NotificationProvider = ({ children }) => {
  const [notifications, dispatch] = useReducer(notificationReducer, []);

  const showNotification = (message, type = 'info') => {
    const id = Date.now();
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: { id, message, type }
    });

    setTimeout(() => {
      dispatch({
        type: 'REMOVE_NOTIFICATION',
        payload: id
      });
    }, 5000);
  };

  const removeNotification = (id) => {
    dispatch({
      type: 'REMOVE_NOTIFICATION',
      payload: id
    });
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="fixed bottom-0 right-0 z-50 p-4 space-y-2 max-w-[420px] w-full sm:max-w-[440px] sm:p-6">
        <AnimatePresence>
          {notifications.map(notification => {
            const NotificationIcon = NOTIFICATION_TYPES[notification.type].icon;
            
            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, y: 50 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 40
                }}
                className={`relative overflow-hidden rounded-lg shadow-lg ${NOTIFICATION_TYPES[notification.type].className} backdrop-blur-sm`}
              >
                <div className="p-4 pr-12">
                  <div className="flex gap-3 items-start">
                    <NotificationIcon className={`h-5 w-5 ${NOTIFICATION_TYPES[notification.type].iconClass} shrink-0 mt-0.5`} />
                    <div className="flex-1 mr-2">
                      <p className="text-sm font-medium">{notification.message}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="absolute right-2 top-2 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <ProgressBar duration={5000} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};