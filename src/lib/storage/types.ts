export interface StateStorage {
  getItem: (name: string) => Promise<string | null>;
  setItem: (name: string, value: string) => Promise<void>;
  removeItem: (name: string) => Promise<void>;
}

export interface StorageEntry {
  data: string;
  version?: number;
  updatedAt?: string;
}