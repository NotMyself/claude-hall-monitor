import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Don't trigger shortcuts when typing in inputs
      if (event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement) {
        return;
      }

      for (const shortcut of shortcuts) {
        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          !!event.ctrlKey === !!shortcut.ctrlKey &&
          !!event.altKey === !!shortcut.altKey &&
          !!event.shiftKey === !!shortcut.shiftKey
        ) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Navigation shortcuts hook
export function useNavigationShortcuts() {
  const navigate = useNavigate();

  useKeyboardShortcuts([
    { key: 'g', action: () => navigate('/overview') },  // g for go to overview
    { key: 'p', action: () => navigate('/plans') },     // p for plans
    { key: 's', action: () => navigate('/sessions') },  // s for sessions
    { key: ',', action: () => navigate('/settings') },  // , for settings (vim-like)
  ]);
}
