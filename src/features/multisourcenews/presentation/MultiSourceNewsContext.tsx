"use client";

import { createContext, useContext, useState } from "react";

export type Source = "hackernews" | "lobsters" | "devto";

interface MultiSourceNewsContextValue {
    source: Source;
    setSource: (source: Source) => void;
}

const MultiSourceNewsContext = createContext<MultiSourceNewsContextValue | null>(null);

export const MultiSourceNewsProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [source, setSource] = useState<Source>("hackernews");
    return (
        <MultiSourceNewsContext.Provider value={{ source, setSource }}>
            {children}
        </MultiSourceNewsContext.Provider>
    );
};

// Returns null when used outside a MultiSourceNewsProvider (e.g. standalone preview).
// In that case, MultiSourceNewsWidget falls back to its own local state.
export const useMultiSourceNews = (): MultiSourceNewsContextValue | null => {
    return useContext(MultiSourceNewsContext);
};
