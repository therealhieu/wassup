"use client";

import { useState, useRef, useEffect } from "react";
import { Box, ToggleButtonGroup, ToggleButton, Tooltip } from "@mui/material";
import { MultiSourceNewsWidgetConfig } from "../infrastructure/config.schemas";
import { HackerNewsWidget } from "@/features/hackernews/presentation/HackerNewsWidget";
import { LobstersWidget } from "@/features/lobsters/presentation/LobstersWidget";
import { DevtoWidget } from "@/features/devto/presentation/DevtoWidget";
import { useMultiSourceNews, type Source } from "./MultiSourceNewsContext";

export interface MultiSourceNewsWidgetProps {
    config: MultiSourceNewsWidgetConfig;
}

export const MultiSourceNewsWidget = ({
    config,
}: MultiSourceNewsWidgetProps) => {
    const ctx = useMultiSourceNews();
    const [localSource, setLocalSource] = useState<Source>("hackernews");
    // Use shared context when inside a TabsWidget, otherwise use local state
    const source = ctx?.source ?? localSource;
    const setSource = ctx?.setSource ?? setLocalSource;
    const contentRef = useRef<HTMLDivElement>(null);

    // Apply scroll-after-row: measure the Nth card's position and cap maxHeight.
    // Uses MutationObserver instead of setTimeout to deterministically wait for
    // child content to render (skeleton → actual cards).
    useEffect(() => {
        const el = contentRef.current;
        if (!el) return;

        // Always reset on source/config change — removes stale scroll constraints
        el.style.maxHeight = "none";
        el.style.overflowY = "visible";

        if (!config.scrollAfterRow) return;

        const scrollAfter = config.scrollAfterRow;

        function measure(): boolean {
            const card = el!.querySelector(".MuiCard-root");
            if (!card) return false;

            const items = card.querySelectorAll(":scope > div");
            if (items.length <= scrollAfter) return false;

            const target = items[scrollAfter];
            const cardTop = card.getBoundingClientRect().top;
            const targetTop = target.getBoundingClientRect().top;
            el!.style.maxHeight = `${targetTop - cardTop}px`;
            el!.style.overflowY = "auto";
            return true;
        }

        // Fast path: data is cached → content renders synchronously
        if (measure()) return;

        // Slow path: watch for DOM changes (data arrives, skeleton → real content)
        const observer = new MutationObserver(() => {
            if (measure()) observer.disconnect();
        });
        observer.observe(el, { childList: true, subtree: true });

        return () => observer.disconnect();
    }, [source, config.scrollAfterRow]);

    const activeWidget = (() => {
        switch (source) {
            case "hackernews":
                return <HackerNewsWidget config={config.hackernews} />;
            case "lobsters":
                return <LobstersWidget config={config.lobsters} />;
            case "devto":
                return config.devto ? <DevtoWidget config={config.devto} /> : <HackerNewsWidget config={config.hackernews} />;
        }
    })();

    return (
        <Box sx={{ position: "relative" }}>
            <Box ref={contentRef}>
                {activeWidget}
            </Box>
            <ToggleButtonGroup
                value={source}
                exclusive
                onChange={(_, val) => val && setSource(val)}
                sx={{
                    position: "absolute",
                    bottom: 12,
                    right: 12,
                    zIndex: 1,
                    backgroundColor: "background.paper",
                    backdropFilter: "blur(8px)",
                    borderRadius: "20px",
                    border: 1,
                    borderColor: "divider",
                    boxShadow: 1,
                    "& .MuiToggleButton-root": {
                        border: "none",
                        px: 1.5,
                        py: 0.6,
                        fontSize: "1.1rem",
                        lineHeight: 1,
                        "&.Mui-selected": {
                            backgroundColor: "action.selected",
                        },
                    },
                }}
            >
                <Tooltip title="Hacker News" arrow>
                    <ToggleButton value="hackernews">🔥</ToggleButton>
                </Tooltip>
                <Tooltip title="Lobste.rs" arrow>
                    <ToggleButton value="lobsters">🦞</ToggleButton>
                </Tooltip>
                {config.devto && (
                    <Tooltip title="DEV Community" arrow>
                        <ToggleButton value="devto" sx={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "-0.02em" }}>DEV</ToggleButton>
                    </Tooltip>
                )}
            </ToggleButtonGroup>
        </Box>
    );
};
