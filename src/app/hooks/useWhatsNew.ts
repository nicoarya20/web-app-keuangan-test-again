import { useState, useEffect } from 'react';
import { APP_VERSION } from '../constants/changelog';

const STORAGE_KEY = 'finance-last-seen-version';

export function useWhatsNew() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const lastSeen = localStorage.getItem(STORAGE_KEY);
    if (lastSeen !== APP_VERSION) {
      setIsOpen(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, APP_VERSION);
    setIsOpen(false);
  };

  return { isOpen, dismiss };
}
