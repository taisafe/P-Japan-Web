import { create } from 'zustand';

export type DrawerView = 'LOGS' | 'CRON_JOBS' | 'SETTINGS' | null;

interface GlobalDrawerState {
    isOpen: boolean;
    view: DrawerView;
    data: any | null;
    actions: {
        open: (view: DrawerView, data?: any) => void;
        close: () => void;
        toggle: () => void;
    };
}

export const useGlobalDrawer = create<GlobalDrawerState>((set, get) => ({
    isOpen: false,
    view: null,
    data: null,
    actions: {
        open: (view, data = null) => set({ isOpen: true, view, data }),
        close: () => set({ isOpen: false, view: null, data: null }),
        toggle: () => set((state) => ({ isOpen: !state.isOpen })),
    },
}));

export const useDrawerActions = () => useGlobalDrawer((state) => state.actions);
export const useDrawerisOpen = () => useGlobalDrawer((state) => state.isOpen);
export const useDrawerView = () => useGlobalDrawer((state) => state.view);
export const useDrawerData = () => useGlobalDrawer((state) => state.data);
