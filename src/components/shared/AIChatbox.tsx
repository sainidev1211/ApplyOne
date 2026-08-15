import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getStoredSession } from '@/services/authClient';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

// Custom vector Robot logo component
function RobotIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Head Box */}
      <rect x="5" y="8" width="14" height="12" rx="3" />
      {/* Eyes */}
      <circle cx="9" cy="13" r="1.2" fill="currentColor" />
      <circle cx="15" cy="13" r="1.2" fill="currentColor" />
      {/* Mouth */}
      <path d="M9 17h6" />
      {/* Antenna */}
      <path d="M12 5V2" />
      <circle cx="12" cy="2" r="1" fill="currentColor" />
      {/* Ears */}
      <path d="M5 13H3m18 0h-2" />
    </svg>
  );
}

export function AIChatbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Hi! I am the ApplyOne AI Assistant. Ask me anything about optimizing your resume, ATS matching scores, or managing your automated application dispatch campaign!',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom of the chat panel on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsTyping(true);

    try {
      // Map messages to Groq format: { role: 'user' | 'assistant', content: '...' }
      const profile = getStoredSession()?.user;
      const profileContext = profile
        ? `Current user context: name=${profile.fullName}; account type=${profile.accountType}; professional bio=${profile.bio || 'not provided'}; LinkedIn=${profile.linkedinUrl || 'not provided'}; GitHub=${profile.githubUrl || 'not provided'}. Use this only to personalize career-related answers; never reveal private account data unnecessarily.`
        : '';
      const groqMessages = [
        ...(profileContext ? [{ role: 'system', content: profileContext }] : []),
        ...newMessages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
        })),
      ];

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/chat/public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: groqMessages }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      // The backend uses a global ResponseInterceptor that wraps responses in { success: true, data: { ... } }
      const actualContent = data.data?.content || data.content;

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: actualContent || 'I encountered an issue processing your request.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: 'Sorry, I am having trouble connecting to my AI core right now. Please try again later.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 text-left">
      
      {/* Floating Trigger Badge Button with Robot Icon */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="h-14 w-14 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-600 flex items-center justify-center text-white shadow-2xl cursor-pointer relative focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-bg-dark"
        aria-label="Toggle AI Assistant"
      >
        {isOpen ? (
          <span className="text-xl font-bold">✕</span>
        ) : (
          <div className="relative">
            <RobotIcon className="h-6.5 w-6.5 text-white" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
            </span>
          </div>
        )}
      </motion.button>

      {/* Floating Chat Container Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="absolute bottom-18 right-0 w-[340px] sm:w-[380px] h-[480px] flex"
          >
            <Card className="flex flex-col h-full w-full border border-border-light dark:border-border-dark bg-white dark:bg-card-dark shadow-2xl rounded-2xl overflow-hidden">
              
              {/* Chat Window Header with Robot Icon */}
              <div className="p-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center text-white">
                    <RobotIcon className="h-4.5 w-4.5" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-sm">ApplyOne AI Core</h3>
                    <span className="text-[10px] text-blue-100 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                      Online
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white text-sm font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {/* Chat Messages Feed with Avatars */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 dark:bg-bg-dark/40">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender === 'ai' && (
                      <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-border-light dark:border-border-dark flex items-center justify-center flex-shrink-0 text-primary dark:text-blue-400">
                        <RobotIcon className="h-4.5 w-4.5" />
                      </div>
                    )}
                    <div
                      className={`max-w-[78%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-sm ${
                        msg.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white dark:bg-slate-800 text-text-primary-light dark:text-text-primary-dark border border-border-light dark:border-border-dark/60 rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator with Avatar */}
                {isTyping && (
                  <div className="flex items-end gap-2 justify-start">
                    <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-border-light dark:border-border-dark flex items-center justify-center flex-shrink-0 text-primary dark:text-blue-400">
                      <RobotIcon className="h-4.5 w-4.5" />
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-border-light dark:border-border-dark/60 rounded-2xl rounded-bl-none p-3.5 text-xs flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input form Panel */}
              <form
                onSubmit={handleSend}
                className="p-3 border-t border-border-light dark:border-border-dark bg-white dark:bg-card-dark flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 min-w-0 h-9 px-3.5 border border-border-light dark:border-border-dark/80 bg-slate-50 dark:bg-bg-dark/40 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-blue-500 text-text-primary-light dark:text-text-primary-dark"
                />
                <Button
                  type="submit"
                  variant="primary"
                  className="h-9 px-3.5 rounded-xl text-xs font-semibold shrink-0"
                  disabled={!inputValue.trim()}
                >
                  Send
                </Button>
              </form>

            </Card>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
