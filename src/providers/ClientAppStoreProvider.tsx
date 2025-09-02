"use client";

import { useSession } from "next-auth/react";
import { AppStoreContextProvider } from "./AppStoreContextProvider";
import { AppStoreInitialState } from "@/stores/app-store.schemas";

interface ClientAppStoreProviderProps {
  children: React.ReactNode;
  initialState: AppStoreInitialState;
}

export const ClientAppStoreProvider = ({ children, initialState }: ClientAppStoreProviderProps) => {
  const { data: session, status } = useSession();
  
  // Pass session as null explicitly when loading, to distinguish from undefined
  // This helps AppStoreContextProvider know when session is still loading vs no session
  const sessionToPass = status === "loading" ? undefined : session;
  
  return (
    <AppStoreContextProvider initialState={initialState} session={sessionToPass}>
      {children}
    </AppStoreContextProvider>
  );
};