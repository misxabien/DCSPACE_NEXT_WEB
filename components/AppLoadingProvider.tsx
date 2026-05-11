"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BrandedLoading } from "@/components/BrandedLoading";

type PendingNavigation = {
  complete: boolean;
  fromPath: string;
  key: number;
  targetPath?: string;
};

type AppLoadingContextValue = {
  navigateWithLoading: (href: string) => void;
  backWithLoading: () => void;
};

const AppLoadingContext = createContext<AppLoadingContextValue | null>(null);

export function useAppLoading() {
  const context = useContext(AppLoadingContext);

  if (!context) {
    throw new Error("useAppLoading must be used inside AppLoadingProvider");
  }

  return context;
}

export function AppLoadingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);

  const currentPath = useMemo(() => {
    const queryString = searchParams.toString();
    return `${pathname}${queryString ? `?${queryString}` : ""}`;
  }, [pathname, searchParams]);

  const navigateWithLoading = useCallback((href: string) => {
    if (typeof window === "undefined") {
      return;
    }

    const targetUrl = new URL(href, window.location.href);

    if (targetUrl.origin !== window.location.origin) {
      window.location.href = targetUrl.href;
      return;
    }

    const targetPath = `${targetUrl.pathname}${targetUrl.search}`;
    const currentBrowserPath = `${window.location.pathname}${window.location.search}`;

    if (targetPath === currentBrowserPath) {
      return;
    }

    setPendingNavigation({
      complete: false,
      fromPath: currentPath,
      key: Date.now(),
      targetPath,
    });
    router.push(targetPath);
  }, [currentPath, router]);

  const backWithLoading = useCallback(() => {
    setPendingNavigation({
      complete: false,
      fromPath: currentPath,
      key: Date.now(),
    });
    router.back();
  }, [currentPath, router]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest<HTMLAnchorElement>("a[href]");

      if (!anchor || anchor.dataset.noLoading === "true" || anchor.hasAttribute("download")) {
        return;
      }

      const anchorTarget = anchor.getAttribute("target");

      if (anchorTarget && anchorTarget !== "_self") {
        return;
      }

      const targetUrl = new URL(anchor.href, window.location.href);

      if (targetUrl.origin !== window.location.origin) {
        return;
      }

      const targetPath = `${targetUrl.pathname}${targetUrl.search}`;
      const currentBrowserPath = `${window.location.pathname}${window.location.search}`;

      if (targetPath === currentBrowserPath) {
        return;
      }

      event.preventDefault();
      navigateWithLoading(targetPath);
    };

    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [navigateWithLoading]);

  useEffect(() => {
    if (!pendingNavigation) {
      return;
    }

    const reachedTarget = pendingNavigation.targetPath
      ? currentPath === pendingNavigation.targetPath
      : currentPath !== pendingNavigation.fromPath;

    if (!reachedTarget || pendingNavigation.complete) {
      return;
    }

    setPendingNavigation((current) => (current ? { ...current, complete: true } : current));
  }, [currentPath, pendingNavigation]);

  const handleLoaderComplete = useCallback(() => {
    setPendingNavigation(null);
  }, []);

  const contextValue = useMemo(
    () => ({
      navigateWithLoading,
      backWithLoading,
    }),
    [backWithLoading, navigateWithLoading],
  );

  return (
    <AppLoadingContext.Provider value={contextValue}>
      {children}
      {pendingNavigation && (
        <div className="app-loading-overlay" aria-hidden="false">
          <BrandedLoading
            key={pendingNavigation.key}
            complete={pendingNavigation.complete}
            label="Loading..."
            onComplete={handleLoaderComplete}
          />
        </div>
      )}
    </AppLoadingContext.Provider>
  );
}
