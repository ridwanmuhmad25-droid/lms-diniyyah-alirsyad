import { useCallback, useState } from 'react';

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'US';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function useCollapsibleSidebar(storageKey: string) {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved === 'true') return true;
      if (saved === 'false') return false;
    } catch {
      // Ignore storage access restrictions
    }
    return true;
  });

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(storageKey, String(next));
      } catch {
        // Ignore storage access restrictions
      }
      return next;
    });
  }, [storageKey]);

  const expandSidebar = useCallback(() => {
    setIsSidebarOpen(true);
    try {
      window.localStorage.setItem(storageKey, 'true');
    } catch {
      // Ignore storage access restrictions
    }
  }, [storageKey]);

  const closeSidebarOnTablet = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth >= 768 && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, []);

  const openMobileDrawer = useCallback(() => {
    setIsMobileDrawerOpen(true);
  }, []);

  const closeMobileDrawer = useCallback(() => {
    setIsMobileDrawerOpen(false);
  }, []);

  return {
    isSidebarOpen,
    toggleSidebar,
    expandSidebar,
    closeSidebarOnTablet,
    isMobileDrawerOpen,
    openMobileDrawer,
    closeMobileDrawer,
  };
}
