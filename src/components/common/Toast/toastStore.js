// A tiny pub/sub toast store. It is a plain module (not React context) so any
// code — including data hooks — can raise a notification without prop drilling.

const DURATION = 4500;
// Actionable toasts (e.g. "Removed — Undo") linger longer so there is time to
// reach for the button before they fade.
const ACTION_DURATION = 8000;

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
// `action` is an optional `{ label, onClick }` rendered as an inline button —
// clicking it runs `onClick` and dismisses the toast.
const push = ({ id, kind, title, message, action, duration }) => {
  const life = duration || (action ? ACTION_DURATION : DURATION);
  const existing = id && toasts.find((toastItem) => toastItem.id === id);
  if (existing) {
    clearTimeout(existing.timer);
    Object.assign(existing, { kind, title, message, action });
    existing.timer = setTimeout(() => dismissToast(existing.id), life);
    toasts = [...toasts];
    emit();
    return;
  }
  const toastId = id || `toast-${(counter += 1)}`;
  const timer = setTimeout(() => dismissToast(toastId), life);
  toasts = [...toasts, { id: toastId, kind, title, message, action, timer }];
  emit();
};

export const toast = {
  success: (title, message, id) => push({ kind: 'success', title, message, id }),
  error: (title, message, id) => push({ kind: 'error', title, message, id }),
  info: (title, message, id) => push({ kind: 'info', title, message, id }),
  // An actionable notice with an inline button. Pass `{ label, onClick }`.
  action: (title, message, action, opts = {}) =>
    push({
      kind: opts.kind || 'info',
      title,
      message,
      action,
      id: opts.id,
      duration: opts.duration,
    }),
};
