import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps {
  message: ToastMessage;
  onClose: (id: string) => void;
}

function Toast({ message, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const duration = message.duration || 3000;
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(message.id), 300); // Match animation duration
    }, duration);

    return () => clearTimeout(timer);
  }, [message, onClose]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
    error: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
    warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800',
    info: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
  };

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg
        ${bgColors[message.type]}
        ${isExiting ? 'animate-slide-out' : 'animate-slide-in'}
        min-w-lg max-w-md
      `}
    >
      <div className="shrink-0 mt-0.5">
        {icons[message.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">
          {message.title}
        </p>
        {message.message && (
          <p className="text-sm text-muted-foreground mt-1">
            {message.message}
          </p>
        )}
      </div>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onClose(message.id), 300);
        }}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  messages: ToastMessage[];
  onClose: (id: string) => void;
}

export function ToastContainer({ messages, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {messages.map((message) => (
        <Toast key={message.id} message={message} onClose={onClose} />
      ))}
    </div>
  );
}

// Custom hook for managing toasts
export function useToast() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const showToast = (
    type: ToastType,
    title: string,
    message?: string,
    duration?: number
  ) => {
    const id = `${Date.now()}-${Math.random()}`;
    const newMessage: ToastMessage = {
      id,
      type,
      title,
      message,
      duration,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const closeToast = (id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  return {
    messages,
    showToast,
    closeToast,
    success: (title: string, message?: string, duration?: number) =>
      showToast('success', title, message, duration),
    error: (title: string, message?: string, duration?: number) =>
      showToast('error', title, message, duration),
    warning: (title: string, message?: string, duration?: number) =>
      showToast('warning', title, message, duration),
    info: (title: string, message?: string, duration?: number) =>
      showToast('info', title, message, duration),
  };
}
