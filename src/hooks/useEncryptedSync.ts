"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { AppState } from "@/infrastructure/config.schemas";
import { AppStateSchema } from "@/infrastructure/config.schemas";
import { encryptConfig, decryptConfig } from "@/lib/client-crypto";
import { saveToStorage } from "@/providers/AppConfigProvider";
import { baseLogger } from "@/lib/logger";

const PASSPHRASE_CACHE_KEY = "wassup-pk";
const logger = baseLogger.getSubLogger({ name: "useEncryptedSync" });

interface EncryptedSyncState {
	passphrase: string | null;
	showPassphraseDialog: boolean;
	isNewEncryptionUser: boolean;
	passphraseError: string | undefined;
}

interface UseEncryptedSyncResult extends EncryptedSyncState {
	/** Attempt to hydrate from server data. Returns void; sets dialog state. */
	hydrateFromServer: (
		userId: string | null,
		dispatch: (action: { type: "SET_STATE"; payload: AppState }) => void,
		isHydrated: React.MutableRefObject<boolean>,
	) => Promise<void>;
	/** Handle passphrase submitted from dialog */
	handlePassphraseSubmit: (
		enteredPassphrase: string,
		userId: string | null,
		dispatch: (action: { type: "SET_STATE"; payload: AppState }) => void,
		isHydrated: React.MutableRefObject<boolean>,
	) => Promise<void>;
	/** Encrypt and sync state to server */
	syncEncryptedState: (appState: AppState) => Promise<void>;
	/** Clear passphrase cache (e.g. on sign-out) */
	clearPassphrase: () => void;
}

export function useEncryptedSync(): UseEncryptedSyncResult {
	const [passphrase, setPassphrase] = useState<string | null>(null);
	const [showPassphraseDialog, setShowPassphraseDialog] = useState(false);
	const [isNewEncryptionUser, setIsNewEncryptionUser] = useState(false);
	const [passphraseError, setPassphraseError] = useState<
		string | undefined
	>();
	const serverDataRef = useRef<{
		encryptedData: string;
		salt: string;
	} | null>(null);

	const clearPassphrase = useCallback(() => {
		setPassphrase(null);
		sessionStorage.removeItem(PASSPHRASE_CACHE_KEY);
		serverDataRef.current = null;
	}, []);

	const tryDecrypt = useCallback(
		async (
			encryptedData: string,
			salt: string,
			pp: string,
			userId: string | null,
			dispatch: (action: {
				type: "SET_STATE";
				payload: AppState;
			}) => void,
			isHydrated: React.MutableRefObject<boolean>,
		): Promise<boolean> => {
			try {
				const plaintext = await decryptConfig(
					encryptedData,
					salt,
					pp,
				);
				const serverState = AppStateSchema.parse(
					JSON.parse(plaintext),
				);
				dispatch({ type: "SET_STATE", payload: serverState });
				saveToStorage(userId, serverState);
				setPassphrase(pp);
				sessionStorage.setItem(PASSPHRASE_CACHE_KEY, pp);
				serverDataRef.current = { encryptedData, salt };
				isHydrated.current = true;
				return true;
			} catch {
				return false;
			}
		},
		[],
	);

	const hydrateFromServer = useCallback(
		async (
			userId: string | null,
			dispatch: (action: {
				type: "SET_STATE";
				payload: AppState;
			}) => void,
			isHydrated: React.MutableRefObject<boolean>,
		) => {
			try {
				const res = await fetch("/api/config");
				const { encryptedData, salt } = await res.json();

				if (encryptedData && salt) {
					serverDataRef.current = { encryptedData, salt };

					// Try cached passphrase from sessionStorage (avoids re-prompting within tab)
					const cached =
						sessionStorage.getItem(PASSPHRASE_CACHE_KEY);
					if (cached) {
						const ok = await tryDecrypt(
							encryptedData,
							salt,
							cached,
							userId,
							dispatch,
							isHydrated,
						);
						if (ok) return;
						sessionStorage.removeItem(PASSPHRASE_CACHE_KEY);
					}

					// No cached passphrase or it failed — prompt user
					setIsNewEncryptionUser(false);
					setShowPassphraseDialog(true);
				} else {
					// No server data — new user, needs to set passphrase
					setIsNewEncryptionUser(true);
					setShowPassphraseDialog(true);
					isHydrated.current = true;
				}
			} catch {
				isHydrated.current = true;
			}
		},
		[tryDecrypt],
	);

	const handlePassphraseSubmit = useCallback(
		async (
			enteredPassphrase: string,
			userId: string | null,
			dispatch: (action: {
				type: "SET_STATE";
				payload: AppState;
			}) => void,
			isHydrated: React.MutableRefObject<boolean>,
		) => {
			if (isNewEncryptionUser) {
				setPassphrase(enteredPassphrase);
				sessionStorage.setItem(
					PASSPHRASE_CACHE_KEY,
					enteredPassphrase,
				);
				setShowPassphraseDialog(false);
				isHydrated.current = true;
				return;
			}

			const { encryptedData, salt } = serverDataRef.current!;
			try {
				const plaintext = await decryptConfig(
					encryptedData,
					salt,
					enteredPassphrase,
				);
				const serverState = AppStateSchema.parse(
					JSON.parse(plaintext),
				);
				dispatch({ type: "SET_STATE", payload: serverState });
				saveToStorage(userId, serverState);
				setPassphrase(enteredPassphrase);
				sessionStorage.setItem(
					PASSPHRASE_CACHE_KEY,
					enteredPassphrase,
				);
				setShowPassphraseDialog(false);
				setPassphraseError(undefined);
				isHydrated.current = true;
			} catch (err) {
				if (err instanceof DOMException) {
					setPassphraseError(
						"Incorrect passphrase. Please try again.",
					);
				} else {
					setPassphraseError(
						"Failed to decrypt data. It may be corrupted.",
					);
					logger.error("Decryption error (non-auth)", err);
				}
			}
		},
		[isNewEncryptionUser],
	);

	const syncEncryptedState = useCallback(
		async (appState: AppState) => {
			if (!passphrase) return;

			try {
				const plaintext = JSON.stringify(appState);
				const existingSalt = serverDataRef.current?.salt;
				const result = await encryptConfig(
					plaintext,
					passphrase,
					existingSalt,
				);

				serverDataRef.current = {
					encryptedData: result.encrypted,
					salt: result.salt,
				};

				await fetch("/api/config", {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						encryptedData: result.encrypted,
						salt: result.salt,
					}),
				});
			} catch (err) {
				logger.error(
					"Failed to sync encrypted state to server",
					err,
				);
			}
		},
		[passphrase],
	);

	return {
		passphrase,
		showPassphraseDialog,
		isNewEncryptionUser,
		passphraseError,
		hydrateFromServer,
		handlePassphraseSubmit,
		syncEncryptedState,
		clearPassphrase,
	};
}
