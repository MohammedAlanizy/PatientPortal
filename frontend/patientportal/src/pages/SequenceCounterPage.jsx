import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sun, Moon, RotateCw, Volume2, User, Wifi, WifiOff } from 'lucide-react';
import { useDarkMode } from '@/hooks/useDarkMode';
import { counterApi } from '@/api';
import DualLogo from '@/components/layout/DualLogo';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useWebSocket } from '@/hooks/useWebSocket';

const SequenceCounterPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userNumber = location.state?.requestNumber;
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [counter, setCounter] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef(null);
  const isMounted = useRef(true);

  const { isConnected, addMessageListener } = useWebSocket(true);
  const startAudioContext = useCallback(async () => {
    if (audioContext) {
      // If context exists but is suspended, resume it
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      return;
    }
    
    // Create new context and resume if needed
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    setAudioContext(ctx);
    
    // Some browsers require resuming the new context
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  }, [audioContext]);

  useEffect(() => {
    const handleUserInteraction = async () => {
      await startAudioContext();
      window.removeEventListener('click', handleUserInteraction);
    };
  
    if (userNumber) {
      // If user number exists, start immediately (assumes valid user gesture)
      handleUserInteraction();
    } else {
      // Otherwise wait for click
      handleUserInteraction();
      // window.addEventListener('click', handleUserInteraction);
    }
  
    return () => {
      window.removeEventListener('click', handleUserInteraction);
    };
  }, [startAudioContext, userNumber]); // Add userNumber to dependencies

  // Function to play a "ding" sound
  const playDing = useCallback((time = 0) => {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(500, audioContext.currentTime + time);
    gainNode.gain.setValueAtTime(0, audioContext.currentTime + time);
    gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + time + 0.1);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + time + 0.5);

    oscillator.start(audioContext.currentTime + time);
    oscillator.stop(audioContext.currentTime + time + 0.5);
  }, [audioContext]);

  const speakNumber = useCallback((number) => {
    if (!number || !audioContext) return;

    setIsSpeaking(true);
    window.speechSynthesis.cancel();

    const startTime = audioContext.currentTime;

    // Function to create and schedule utterance
    const scheduleUtterance = (text, lang, delay) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = lang;
          utterance.volume = 1;
          // Use Microsoft voices if available
          const voices = window.speechSynthesis.getVoices();
          const preferredVoice = voices.find(voice => {
            if (lang === 'ar-SA') {
              return voice.name.includes('Microsoft Naayf');
            } else if (lang === 'en-US') {
              return voice.name.includes('Google US');
            } else {
              return voice.name.includes('Reed (English (US))');
            }
          });

          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }

          utterance.onend = resolve;
          window.speechSynthesis.speak(utterance);
        }, delay);
      });
    };

    // Sequential audio playback
    const playSequence = async () => {
      // Play initial ding
      await new Promise(resolve => setTimeout(resolve, 500));

      // Arabic announcement
      await scheduleUtterance(`رقم ${number}`, 'ar-SA', 0);

      // Play middle ding
      playDing(0.5);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // English announcement
      await scheduleUtterance(`Number ${number}`, 'en', 0);

      // Final ding and cleanup
      playDing(0.5);
      setIsSpeaking(false);
    };
    const callUser = async () => {
      // Play initial ding
      await new Promise(resolve => setTimeout(resolve, 500));

      // Arabic announcement
      await scheduleUtterance(`حان وقت رقمك ، يرجى التوجه الى الاستقبال`, 'ar-SA', 0);

      // Play middle ding
      playDing(0.5);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // English announcement
      await scheduleUtterance(`It's your turn, please go to reception`, 'en', 0);

      // Final ding and cleanup
      playDing(0.5);
      setIsSpeaking(false);

      navigate('/thank-you');
    };
    if (userNumber && userNumber == number)
    {
      startAudioContext();
      callUser();
    }else if (userNumber && number == 0) { // it reset it !
      navigate('/thank-you');
    }else if (!userNumber) {
      playSequence();
    }
  }, [audioContext, playDing]);

  const fetchCounter = async () => {
    if (!isMounted.current) return;

    try {
      setIsLoading(true);
      const response = await counterApi.getLastCounter();
      const newCounter = response.data.last_counter;

      if (newCounter !== counter) {
        setCounter(newCounter);
        speakNumber(newCounter);
      }

      setError(null);
    } catch (err) {
      if (err.response?.status === 404) {
        setCounter(0);
        setError(null);
        return;
      }
      setError('Failed to fetch counter');
      console.error('Error fetching counter:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'counter_update') {
        const newCounter = data.last_counter;
        if (newCounter !== counter) {
          setCounter(newCounter);
          speakNumber(newCounter);
        }
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }, [counter, speakNumber]);

  // Setup WebSocket listener and polling fallback
  useEffect(() => {
    const cleanup = addMessageListener(handleWebSocketMessage);

    // Start or stop polling based on WebSocket connection status
    if (!isConnected) {
      setIsPolling(true);
      fetchCounter(); // Initial fetch
      pollingIntervalRef.current = setInterval(fetchCounter, 5000);
    } else {
      setIsPolling(false);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    }

    return () => {
      cleanup();
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isConnected, addMessageListener, handleWebSocketMessage]);

  // Button variants for animation
  const buttonVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    tap: { scale: 0.9 },
    hover: { scale: 1.1 },
  };

  const numberVariants = {
    initial: { scale: 0.5, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { type: "spring", stiffness: 200, damping: 15 }
    },
    exit: { scale: 0.5, opacity: 0 }
  };
  
  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gradient-to-b from-background to-background/80 p-4 md:p-8 relative">
      {/* Dark Mode Toggle */}
      <motion.div
        className="fixed top-4 left-4 md:top-6 md:left-6 z-50"
        initial="initial"
        animate="animate"
        whileTap="tap"
        whileHover="hover"
        variants={buttonVariants}
      >
        <Button
          variant="outline"
          size="icon"
          className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-background/80 backdrop-blur-sm border-2 shadow-lg"
        >
          {isConnected ? (
            <Wifi className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
          ) : (
            <WifiOff className="h-5 w-5 md:h-6 md:w-6 text-yellow-500" />
          )}
        </Button>
      </motion.div>
      <motion.div
        className="fixed top-4 right-4 md:top-6 md:right-6 z-50"
        initial="initial"
        animate="animate"
        whileTap="tap"
        whileHover="hover"
        variants={buttonVariants}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={toggleDarkMode}
          className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-background/80 backdrop-blur-sm border-2 shadow-lg hover:shadow-xl transition-shadow duration-300 hover:border-primary"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isDarkMode ? 'dark' : 'light'}
              initial={{ opacity: 0, rotate: -30 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 30 }}
              className="absolute"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5 md:h-6 md:w-6 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 md:h-6 md:w-6 text-slate-700" />
              )}
            </motion.div>
          </AnimatePresence>
        </Button>
      </motion.div>

      <div className="w-full max-w-4xl mx-auto">
        {/* Logo Section */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="relative flex justify-center items-center">
            <DualLogo size="large" />
          </div>
        </motion.div>

        {/* Counter Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex flex-col items-center justify-center gap-8"
        >
          <Card className="w-full max-w-2xl bg-background/40 backdrop-blur-xl border-2 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-8 md:p-12">
              <motion.div 
                className="flex items-center justify-center gap-2 mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Volume2 
                  className={`h-8 w-8 transition-all duration-300 ${
                    isSpeaking 
                      ? 'text-primary animate-pulse scale-110' 
                      : 'text-muted-foreground'
                  }`} 
                />
              </motion.div>

              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center p-8"
                  >
                    <RotateCw className="h-12 w-12 animate-spin text-primary" />
                  </motion.div>
                ) : error ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xl text-destructive text-center font-medium"
                  >
                    {error}
                  </motion.div>
                ) : (
                  <motion.div
                    key={counter}
                    variants={numberVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="relative flex flex-col items-center gap-12"
                  >
                    {/* User's Number (if available) */}
                    {userNumber && (
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full"
                      >
                        <div className="relative">
                          <div className="relative flex items-center justify-between p-6 rounded-2xl border border-primary/20">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-full">
                                <User className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-primary">Your Number</p>
                                <p className="text-sm text-primary/80">رقمك</p>
                              </div>
                            </div>
                            <div className="relative">
                              <span className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                                {String(userNumber).padStart(3, '0')}
                              </span>
                              <div className="absolute -inset-4 bg-primary/5 blur-lg rounded-full -z-10" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Current Number */}
                    <div className="relative text-center">
                      <div className="text-sm text-muted-foreground mb-2">
                        <p>Current Number</p>
                        <p>الرقم الحالي</p>
                      </div>
                      <span className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-primary/80 to-primary bg-clip-text text-transparent">
                        {String(counter).padStart(3, '0')}
                      </span>
                      <div className="absolute -inset-4 bg-primary/5 blur-xl rounded-full -z-10" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default SequenceCounterPage;
