import { create } from "zustand";

interface PwaStore {
  /** The captured beforeinstallprompt event — null until Chrome fires it */
  deferredPrompt: any;
  /** Whether the app is already installed (display-mode: standalone) */
  isInstalled: boolean;
  /** Whether the install banner (floating) is visible */
  showBanner: boolean;

  setDeferredPrompt: (e: any) => void;
  clearDeferredPrompt: () => void;
  setInstalled: (v: boolean) => void;
  setShowBanner: (v: boolean) => void;
}

export const usePwaStore = create<PwaStore>((set) => ({
  deferredPrompt: null,
  isInstalled: false,
  showBanner: false,

  setDeferredPrompt: (e) => set({ deferredPrompt: e, showBanner: true }),
  clearDeferredPrompt: () => set({ deferredPrompt: null, showBanner: false }),
  setInstalled: (v) => set({ isInstalled: v }),
  setShowBanner: (v) => set({ showBanner: v }),
}));
