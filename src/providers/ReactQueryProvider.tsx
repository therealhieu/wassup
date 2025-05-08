"use client";

import { QueryClient } from "@tanstack/react-query";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

// NEVER DO THIS:
// const queryClient = new QueryClient()
//
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
						// With SSR, we usually want to set some default staleTime
						// above 0 to avoid refetching immediately on the client
						staleTime: 60 * 1000,
					},
				},
			})
	);

	return (
		<QueryClientProvider client={queryClient}>
			{children}
		</QueryClientProvider>
	);
};
