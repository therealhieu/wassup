"use client";

import { QueryClient } from "@tanstack/react-query";
import { get, set, del } from "idb-keyval";
import {
	PersistedClient,
	Persister,
	PersistQueryClientProvider,
} from "@tanstack/react-query-persist-client";
import { useState } from "react";

// NEVER DO THIS:
// const queryClient = new QueryClient()
//import { useState } from "react";

// Creating the queryClient at the file root level makes the cache shared
// between all requests and means _all_ data gets passed to _all_ users.
// Besides being bad for performance, this also leaks any sensitive data.

export const ReactQueryProvider = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	// Instead do this, which ensures each request has its own cache:
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						gcTime: 5 * 60 * 1000, // 5 minutes
					},
				},
			})
	);
	const persister = createIDBPersister();

	return (
		<PersistQueryClientProvider
			client={queryClient}
			persistOptions={{ persister }}
		>
			{children}
		</PersistQueryClientProvider>
	);
};

/**
 * Creates an Indexed DB persister
 * @see https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
 */
export function createIDBPersister(idbValidKey: IDBValidKey = "reactQuery") {
	return {
		persistClient: async (client: PersistedClient) => {
			await set(idbValidKey, client);
		},
		restoreClient: async () => {
			return await get<PersistedClient>(idbValidKey);
		},
		removeClient: async () => {
			await del(idbValidKey);
		},
	} satisfies Persister;
}
