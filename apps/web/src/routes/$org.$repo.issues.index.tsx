import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
	CrumbSep,
	CrumbText,
	RepoCrumbs,
} from "#/components/analytics/repo-crumbs";
import { DashboardLayout } from "#/components/layouts/dashboard-layout";
import { ListFilterTabs } from "#/components/repo/list-filter-tabs";
import { RepoTabs } from "#/components/repo/repo-tabs";
import { ThreadListRow } from "#/components/repo/thread-list-row";
import { automodRulesQueryOptions } from "#/lib/automod.query";
import { moderationQueueQueryOptions } from "#/lib/moderation.query";
import { repoContentQueryOptions } from "#/lib/repo-content.query";
import { MODERATOR } from "#/lib/site-config";

export const Route = createFileRoute("/$org/$repo/issues/")({
	ssr: false,
	loader: ({ context, params }) => {
		void context.queryClient.prefetchQuery(
			repoContentQueryOptions(params.org, params.repo),
		);
		void context.queryClient.prefetchQuery(moderationQueueQueryOptions());
		void context.queryClient.prefetchQuery(automodRulesQueryOptions());
	},
	component: IssuesListPage,
});

function IssuesListPage() {
	const { org, repo } = Route.useParams();
	const content = useQuery(repoContentQueryOptions(org, repo));
	const queue = useQuery(moderationQueueQueryOptions());
	const rules = useQuery(automodRulesQueryOptions());
	const [tab, setTab] = useState<"open" | "closed">("open");

	const counts = {
		queue: queue.data?.length,
		automod: rules.data?.filter((rule) => rule.enabled).length,
	};

	const issues = content.data?.issues ?? [];
	const open = issues.filter((i) => i.status === "open");
	const closed = issues.filter((i) => i.status !== "open");
	const shown = tab === "open" ? open : closed;

	return (
		<DashboardLayout moderator={MODERATOR} counts={counts}>
			<div className="overflow-stable h-full px-5 py-6 md:px-8 md:py-10">
				<div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
					<div className="flex h-8 items-center">
						<RepoCrumbs org={org} repo={repo}>
							<CrumbSep />
							<CrumbText>Issues</CrumbText>
						</RepoCrumbs>
					</div>

					<RepoTabs org={org} repo={repo} active="issues" />

					<ListFilterTabs
						value={tab}
						onChange={setTab}
						openCount={open.length}
						closedCount={closed.length}
					/>

					{content.data ? (
						<div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface-1">
							{shown.map((thread) => (
								<ThreadListRow
									key={thread.number}
									org={org}
									repo={repo}
									thread={thread}
								/>
							))}
							{shown.length === 0 ? (
								<p className="px-4 py-12 text-center text-muted-foreground text-sm">
									No {tab} issues.
								</p>
							) : null}
						</div>
					) : (
						<p className="py-16 text-center text-muted-foreground text-sm">
							Loading issues…
						</p>
					)}
				</div>
			</div>
		</DashboardLayout>
	);
}
