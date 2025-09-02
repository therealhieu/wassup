import { Session } from 'next-auth';
import { StateStorage } from 'zustand/middleware';
import { createLocalStorage } from './local-storage';

// No-op logger removed; local-only storage

export const STORAGE_NAME = 'app-store-storage';

// Local-only storage
export const createStorage = (session: Session | null | undefined): StateStorage => {
  void session; // keep signature stable, ignore at runtime
  return createLocalStorage();
};
