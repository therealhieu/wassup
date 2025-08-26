import { StateStorage } from './types';

export const createLocalStorage = (): StateStorage => {
  return {
    getItem: async (name: string): Promise<string | null> => {
      return localStorage.getItem(name);
    },
    setItem: async (name: string, value: string): Promise<void> => {
      localStorage.setItem(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
      localStorage.removeItem(name);
    },
  };
};