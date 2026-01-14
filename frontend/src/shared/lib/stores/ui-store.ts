/**
 * UI state store using Zustand.
 *
 * Manages global UI state like sidebar collapsed state.
 * State persists during session but resets on page refresh.
 */

import { create } from 'zustand';

interface UIState {
  sidebarCollapsed: boolean;
}

interface UIActions {
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

type UIStore = UIState & UIActions;

/**
 * UI store for global UI state.
 */
export const useUIStore = create<UIStore>((set, get) => ({
  // State
  sidebarCollapsed: false,

  // Actions
  setSidebarCollapsed: (collapsed: boolean) => {
    set({ sidebarCollapsed: collapsed });
  },

  toggleSidebar: () => {
    set({ sidebarCollapsed: !get().sidebarCollapsed });
  },
}));
