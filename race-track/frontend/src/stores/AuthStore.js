import { create } from "zustand";

const useAuthStore = create((set) => ({
  authRights: null,

  setAuthRights: (right) => set({ authRights: right }),
}));

export default useAuthStore;
