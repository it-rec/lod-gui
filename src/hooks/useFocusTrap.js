import { useEffect, useRef } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const focusableWithin = (node) =>
  Array.from(node.querySelectorAll(FOCUSABLE)).filter(
    // The selector already drops disabled / tabindex=-1 controls; here we skip
    // anything explicitly hidden. (We avoid offsetParent/getClientRects so the
    // trap behaves identically under jsdom, where layout is not computed.)
    (el) =>
      !el.hasAttribute('hidden') && el.getAttribute('aria-hidden') !== 'true'
  );

// Keeps keyboard focus inside an open overlay and restores it to whatever was
// focused before the overlay opened once it closes — the two things a modal
// `role="dialog"` is expected to do but neither the browser nor `aria-modal`
// provides on its own.
//
// Returns a ref to spread onto the dialog container. Pass `active` (the open
// flag) so the trap engages only while the dialog is mounted.
//
//   const trapRef = useFocusTrap(open);
//   return open ? <div ref={trapRef} role="dialog">…</div> : null;
//
// When `autoFocus` is true (the default) the first focusable element is
// focused on open, unless focus already sits inside the dialog — so overlays
// that focus their own input (e.g. a search box) are left untouched.
export const useFocusTrap = (active, { autoFocus = true } = {}) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!active) return undefined;
    const node = ref.current;
    if (!node) return undefined;

    const previouslyFocused = document.activeElement;

    if (autoFocus && !node.contains(document.activeElement)) {
      const first = focusableWithin(node)[0];
      (first || node).focus?.();
    }

    const onKeyDown = (event) => {
      if (event.key !== 'Tab') return;
      const focusables = focusableWithin(node);
      if (focusables.length === 0) {
        event.preventDefault();
        node.focus?.();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement;
      if (event.shiftKey && (current === first || !node.contains(current))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    node.addEventListener('keydown', onKeyDown);
    return () => {
      node.removeEventListener('keydown', onKeyDown);
      // Restore focus to the opener — but don't yank it away if focus has since
      // moved to a real element outside the dialog. On unmount the dialog node
      // is already detached and the browser has dropped focus to <body>, which
      // we treat as "focus was lost, put it back".
      const current = document.activeElement;
      const focusEscaped =
        current && current !== document.body && !node.contains(current);
      if (
        previouslyFocused &&
        typeof previouslyFocused.focus === 'function' &&
        !focusEscaped
      ) {
        previouslyFocused.focus();
      }
    };
  }, [active, autoFocus]);

  return ref;
};
