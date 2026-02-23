"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { IconButton, Avatar, Menu, MenuItem, Button } from "@mui/material";
import { useState } from "react";

export function LoginButton() {
    const { data: session } = useSession();
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    if (!session) {
        return (
            <Button
                variant="outlined"
                size="small"
                onClick={() => signIn()}
                sx={{ color: "text.primary", borderColor: "text.secondary" }}
                data-testid="sign-in"
            >
                Sign In
            </Button>
        );
    }

    return (
        <>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                <Avatar
                    src={session.user?.image ?? undefined}
                    alt={session.user?.name ?? "User"}
                    sx={{ width: 32, height: 32 }}
                />
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={!!anchorEl}
                onClose={() => setAnchorEl(null)}
            >
                <MenuItem disabled>{session.user?.name}</MenuItem>
                <MenuItem onClick={() => signOut()}>Sign Out</MenuItem>
            </Menu>
        </>
    );
}
