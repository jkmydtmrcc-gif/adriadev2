import { create } from 'zustand'

export const useStore = create((set, get) => ({
  toastMessage: null,
  toastSuccess: (msg) => set({ toastMessage: { title: msg, variant: 'default' } }),
  toastError: (msg) => set({ toastMessage: { title: msg, variant: 'destructive' } }),
  clearToast: () => set({ toastMessage: null }),
  dashboard: null,
  setDashboard: (d) => set({ dashboard: d }),
  autopilotRunning: false,
  setAutopilotRunning: (v) => set({ autopilotRunning: v }),
  sseEvents: [],
  addSseEvent: (ev) => set((s) => ({ sseEvents: [ev, ...s.sseEvents].slice(0, 50) })),
  clearSseEvents: () => set({ sseEvents: [] }),
}))
