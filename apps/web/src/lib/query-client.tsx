import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function createAppQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				retry: 1,
				networkMode: "online",
				staleTime: 30_000,
			},
		},
	});
}

export function AppQueryClientProvider({
	children,
	queryClient,
}: {
	children: React.ReactNode;
	queryClient: QueryClient;
}) {
	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}
