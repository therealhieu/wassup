"use client";

import { useSession } from "next-auth/react";
import { AppStoreContextProvider } from "./AppStoreContextProvider";
import { AppStoreInitialState } from "@/stores/app-store.schemas";

interface ClientAppStoreProviderProps {
  children: React.ReactNode;
  initialState: AppStoreInitialState;
}

export const ClientAppStoreProvider = ({ children, initialState }: ClientAppStoreProviderProps) => {
  const { data: session } = useSession();
  
  return (
    <AppStoreContextProvider initialState={initialState} session={session}>
      {children}
    </AppStoreContextProvider>
  );
};