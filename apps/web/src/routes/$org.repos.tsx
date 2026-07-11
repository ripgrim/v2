import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	CrumbSep,
	CrumbText,
	RepoCrumbs,
} from "#/components/analytics/repo-crumbs";
import { DashboardLayout } from "#/components/layouts/dashboard-layout";
import { RepoListRow } from "#/components/repo/repo-list-row";
import { automodRulesQueryOptions } from "#/lib/automod.query";
import { moderationQueueQueryOptions } from "#/lib/moderation.query";
import { repoContentQueryOptions } from "#/lib/repo-content.query";
import { MODERATOR } from "#/lib/site-config";

export const Route = createFileRoute("/$org/repos")({
	ssr: false,
	loader: ({ context, params }) => {
		void context.queryClient.prefetchQuery(repoContentQueryOptions(params.org));
		void context.queryClient.prefetchQuery(moderationQueueQueryOptions());
		void context.queryClient.prefetchQuery(automodRulesQueryOptions());
	},
	component: ReposPage,
});

function ReposPage() {
	const { org } = Route.useParams();
	const content = useQuery(repoContentQueryOptions(org));
	const queue = useQuery(moderationQueueQueryOptions());
	const rules = useQuery(automodRulesQueryOptions());

	const counts = {
		queue: queue.data?.length,
		automod: rules.data?.filter((rule) => rule.enabled).length,
	};

	const repos = content.data?.repos ?? [];

	return (
		<DashboardLayout moderator={MODERATOR} counts={counts}>
			<div className="overflow-stable h-full px-5 py-6 md:px-8 md:py-10">
				<div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
					<RepoCrumbs org={org}>
						<CrumbSep />
						<CrumbText>Repositories</CrumbText>
					</RepoCrumbs>

					<div className="flex items-baseline justify-between gap-3">
						<h1 className="font-semibold text-foreground text-xl tracking-tight">
							Repositories
						</h1>
						<span className="text-muted-foreground text-xs tabular-nums">
							{repos.length} connected
						</span>
					</div>

					{content.data ? (
						<div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface-1">
							{repos.map((repo) => (
								<RepoListRow key={repo.name} org={org} repo={repo} />
							))}
						</div>
					) : (
						<p className="py-16 text-center text-muted-foreground text-sm">
							Loading repositories…
						</p>
					)}
				</div>
			</div>
		</DashboardLayout>
	);
}
