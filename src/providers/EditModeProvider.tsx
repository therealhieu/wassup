"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface EditModeContextValue {
    isEditMode: boolean;
    enterEditMode: () => void;
    exitEditMode: () => void;
}

const EditModeContext = createContext<EditModeContextValue>({
    isEditMode: false,
    enterEditMode: () => { },
    exitEditMode: () => { },
});

export function EditModeProvider({ children }: { children: ReactNode }) {
    const [isEditMode, setIsEditMode] = useState(false);
    return (
        <EditModeContext.Provider
            value={{
                isEditMode,
                enterEditMode: () => setIsEditMode(true),
                exitEditMode: () => setIsEditMode(false),
            }}
        >
            {children}
        </EditModeContext.Provider>
    );
}

export function useEditMode() {
    return useContext(EditModeContext);
}
