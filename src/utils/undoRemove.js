import { toast } from '../components/common/Toast/toastStore';

// Removes one id-keyed item from a saved list and raises an "Undo" toast that
// restores the exact previous list (order included) if tapped. Used by every
// panel ledger so a stray delete — which every player sees instantly over the
// realtime link — is always one tap away from being put back.
export const removeWithUndo = ({ list, id, save, label, noun = 'Entry' }) => {
  const previous = list;
  save(list.filter((item) => item.id !== id));
  toast.action(
    `${noun} removed`,
    label ? `“${label}” is gone — tap to bring it back.` : undefined,
    { label: 'Undo', onClick: () => save(previous) }
  );
};
