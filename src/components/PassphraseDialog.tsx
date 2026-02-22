"use client";

import { useState, useEffect, type FormEvent } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    TextField,
    Button,
    Alert,
    Box,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

interface PassphraseDialogProps {
    open: boolean;
    isNewUser: boolean;
    error?: string;
    onSubmit: (passphrase: string) => void;
}

const MIN_PASSPHRASE_LENGTH = 8;

export function PassphraseDialog({
    open,
    isNewUser,
    error,
    onSubmit,
}: PassphraseDialogProps) {
    const [passphrase, setPassphrase] = useState("");
    const [confirmPassphrase, setConfirmPassphrase] = useState("");
    const [localError, setLocalError] = useState<string | undefined>();

    const displayError = error || localError;

    // Reset form state when dialog opens
    useEffect(() => {
        if (open) {
            setPassphrase("");
            setConfirmPassphrase("");
            setLocalError(undefined);
        }
    }, [open]);

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setLocalError(undefined);

        if (passphrase.length < MIN_PASSPHRASE_LENGTH) {
            setLocalError(
                `Passphrase must be at least ${MIN_PASSPHRASE_LENGTH} characters.`,
            );
            return;
        }

        if (isNewUser && passphrase !== confirmPassphrase) {
            setLocalError("Passphrases do not match.");
            return;
        }

        onSubmit(passphrase);
    }

    return (
        <Dialog
            open={open}
            disableEscapeKeyDown
            onClose={(_e, reason) => {
                // Prevent closing via backdrop click
                if (reason === "backdropClick") return;
            }}
            maxWidth="xs"
            fullWidth
            PaperProps={{ component: "form", onSubmit: handleSubmit }}
        >
            <DialogTitle
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                }}
            >
                <LockOutlinedIcon fontSize="small" />
                {isNewUser ? "Set Encryption Passphrase" : "Unlock Dashboard"}
            </DialogTitle>

            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    {isNewUser ? (
                        <>
                            Your dashboard data is encrypted end-to-end. Choose
                            a passphrase to protect it.
                            <br />
                            <strong>
                                If you forget this passphrase, your data cannot
                                be recovered.
                            </strong>
                        </>
                    ) : (
                        "Enter your passphrase to decrypt your dashboard data."
                    )}
                </DialogContentText>

                {displayError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {displayError}
                    </Alert>
                )}

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <TextField
                        autoFocus
                        required
                        fullWidth
                        label="Passphrase"
                        type="password"
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                        slotProps={{
                            htmlInput: {
                                minLength: MIN_PASSPHRASE_LENGTH,
                                autoComplete: isNewUser
                                    ? "new-password"
                                    : "current-password",
                            },
                        }}
                    />

                    {isNewUser && (
                        <TextField
                            required
                            fullWidth
                            label="Confirm Passphrase"
                            type="password"
                            value={confirmPassphrase}
                            onChange={(e) =>
                                setConfirmPassphrase(e.target.value)
                            }
                            slotProps={{
                                htmlInput: {
                                    minLength: MIN_PASSPHRASE_LENGTH,
                                    autoComplete: "new-password",
                                },
                            }}
                        />
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button type="submit" variant="contained">
                    {isNewUser ? "Set Passphrase" : "Unlock"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
