"use client";

import { AppStoreContextProvider } from "./AppStoreContextProvider";
import { AppStoreInitialState } from "@/stores/app-store.schemas";

interface ClientAppStoreProviderProps {
  children: React.ReactNode;
  initialState: AppStoreInitialState;
}

export const ClientAppStoreProvider = ({ children, initialState }: ClientAppStoreProviderProps) => {
  return (
    <AppStoreContextProvider initialState={initialState}>
      {children}
    </AppStoreContextProvider>
  );
};
