// A tiny pub/sub toast store. It is a plain module (not React context) so any
// code — including data hooks — can raise a notification without prop drilling.

const DURATION = 4500;

let toasts = [];
let counter = 0;
const listeners = new Set();

const emit = () => listeners.forEach((listener) => listener(toasts));

export const subscribeToasts = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getToasts = () => toasts;

export const dismissToast = (id) => {
  const target = toasts.find((toastItem) => toastItem.id === id);
  if (target) clearTimeout(target.timer);
  toasts = toasts.filter((toastItem) => toastItem.id !== id);
  emit();
};

// `id` deduplicates: raising the same id again refreshes the visible toast
// instead of stacking copies (e.g. repeated save failures while offline).
const push = ({ id, kind, title, message }) => {
  const existing = id && toasts.find((toastItem) => toastItem.id === id);
  if (existing) {
    clearTimeout(existing.timer);
    Object.assign(existing, { kind, title, message });
    existing.timer = setTimeout(() => dismissToast(existing.id), DURATION);
    toasts = [...toasts];
    emit();
    return;
  }
  const toastId = id || `toast-${(counter += 1)}`;
  const timer = setTimeout(() => dismissToast(toastId), DURATION);
  toasts = [...toasts, { id: toastId, kind, title, message, timer }];
  emit();
};

export const toast = {
  success: (title, message, id) => push({ kind: 'success', title, message, id }),
  error: (title, message, id) => push({ kind: 'error', title, message, id }),
  info: (title, message, id) => push({ kind: 'info', title, message, id }),
};
