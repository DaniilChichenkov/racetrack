import { create } from "zustand";

const useUiStore = create((set) => ({
  fullScreen: false,
  toggleUi: () =>
    set((state) => ({
      fullScreen: !state.fullScreen,
    })),
}));

export default useUiStore;
