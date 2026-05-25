import { useEffect, useRef, useState } from 'react';
import Button from '../common/Button/Button';
import { IconDownload, IconUpload, IconScroll } from '../common/icons';
import { toast } from '../common/Toast/toastStore';
import {
  buildBackup,
  filenameForBackup,
  restoreBackup,
} from './campaignBackup';
import {
  campaignToMarkdown,
  filenameForMarkdown,
} from './campaignMarkdown';
import styles from './CampaignMenu.module.scss';

const CampaignMenu = () => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleExport = async () => {
    if (busy) return;
    setBusy(true);
    setOpen(false);
    try {
      const backup = await buildBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filenameForBackup();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Backup ready', 'Your campaign was saved to disk.', 'backup-export');
    } catch (err) {
      toast.error('Backup failed', err.message || 'Could not assemble the backup.', 'backup-export');
    } finally {
      setBusy(false);
    }
  };

  const handleExportMarkdown = async () => {
    if (busy) return;
    setBusy(true);
    setOpen(false);
    try {
      const backup = await buildBackup();
      const md = campaignToMarkdown(backup);
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filenameForMarkdown();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(
        'Handout ready',
        'Your campaign was exported as Markdown.',
        'markdown-export'
      );
    } catch (err) {
      toast.error(
        'Export failed',
        err.message || 'Could not assemble the campaign Markdown.',
        'markdown-export'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleImport = () => {
    if (busy) return;
    setOpen(false);
    fileInputRef.current?.click();
  };

  const onFileChosen = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!window.confirm(
      'Restoring will overwrite every panel of the current campaign. Continue?'
    )) {
      return;
    }
    setBusy(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await restoreBackup(parsed);
      toast.success(
        'Campaign restored',
        'Reloading so every panel shows the imported data…',
        'backup-import'
      );
      // The simplest reliable way to refresh every channel + cache.
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      toast.error(
        'Restore failed',
        err.message || 'That file could not be read as a campaign backup.',
        'backup-import'
      );
      setBusy(false);
    }
  };

  return (
    <div className={styles.menu} ref={menuRef}>
      <Button
        kind="ghost"
        size="sm"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Campaign menu"
        onClick={() => setOpen((value) => !value)}
        disabled={busy}
      >
        <span className={styles.dots} aria-hidden="true">
          <span /><span /><span />
        </span>
      </Button>
      {open && (
        <ul className={styles.popover} role="menu">
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className={styles.option}
              onClick={handleExport}
            >
              <IconDownload />
              <span className={styles.optionBody}>
                <span className={styles.optionLabel}>Download backup</span>
                <span className={styles.optionHint}>Save the campaign as a JSON file</span>
              </span>
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className={styles.option}
              onClick={handleExportMarkdown}
            >
              <IconScroll />
              <span className={styles.optionBody}>
                <span className={styles.optionLabel}>Export as Markdown</span>
                <span className={styles.optionHint}>Save a readable handout (.md)</span>
              </span>
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className={styles.option}
              onClick={handleImport}
            >
              <IconUpload />
              <span className={styles.optionBody}>
                <span className={styles.optionLabel}>Restore from backup…</span>
                <span className={styles.optionHint}>Replace the current campaign data</span>
              </span>
            </button>
          </li>
        </ul>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className={styles.fileInput}
        onChange={onFileChosen}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
};

export default CampaignMenu;
