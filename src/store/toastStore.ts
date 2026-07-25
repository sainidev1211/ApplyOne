import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: ToastMessage[];
  addToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (type, message, title, duration = 4000) => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, type, title, message, duration }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export const toast = {
  success: (message: string, title?: string, duration?: number) =>
    useToastStore.getState().addToast('success', message, title, duration),
  error: (message: string, title?: string, duration?: number) =>
    useToastStore.getState().addToast('error', message, title, duration),
  warning: (message: string, title?: string, duration?: number) =>
    useToastStore.getState().addToast('warning', message, title, duration),
  info: (message: string, title?: string, duration?: number) =>
    useToastStore.getState().addToast('info', message, title, duration),
};
