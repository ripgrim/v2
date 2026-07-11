import {
	InformationCircleIcon,
	Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { GithubAccountCard } from "#/components/integrations/github-account-card";
import { RepoPagination } from "#/components/integrations/repo-pagination";
import { RepoRow } from "#/components/integrations/repo-row";
import { DashboardLayout } from "#/components/layouts/dashboard-layout";
import { Input } from "#/components/ui/input";
import { automodRulesQueryOptions } from "#/lib/automod.query";
import { githubIntegrationQueryOptions } from "#/lib/integrations.query";
import { moderationQueueQueryOptions } from "#/lib/moderation.query";
import { MODERATOR } from "#/lib/site-config";

const PER_PAGE = 6;

export const Route = createFileRoute("/$org/integrations/github")({
	ssr: false,
	loader: ({ context }) => {
		void context.queryClient.prefetchQuery(githubIntegrationQueryOptions());
		void context.queryClient.prefetchQuery(moderationQueueQueryOptions());
		void context.queryClient.prefetchQuery(automodRulesQueryOptions());
	},
	component: GithubIntegrationPage,
});

function GithubIntegrationPage() {
	const { org } = Route.useParams();
	const integration = useQuery(githubIntegrationQueryOptions());
	const queueQuery = useQuery(moderationQueueQueryOptions());
	const rulesQuery = useQuery(automodRulesQueryOptions());

	const counts = {
		queue: queueQuery.data?.length,
		automod: rulesQuery.data?.filter((rule) => rule.enabled).length,
	};

	const accounts = integration.data?.accounts ?? [];
	const repos = useMemo(
		() => integration.data?.repos ?? [],
		[integration.data],
	);

	const [search, setSearch] = useState("");
	const [page, setPage] = useState(0);
	const [overrideActive, setOverrideActive] = useState<string | null>(null);
	const activeId = overrideActive ?? integration.data?.activeRepoId;

	// Filter in place — the active repo keeps its natural spot. Only when it
	// lives on another page do we hoist it to the top of the current one so it
	// stays reachable.
	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		return q
			? repos.filter((repo) => repo.fullName.toLowerCase().includes(q))
			: repos;
	}, [repos, search]);

	const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
	const safePage = Math.min(page, pageCount - 1);
	const slice = filtered.slice(
		safePage * PER_PAGE,
		safePage * PER_PAGE + PER_PAGE,
	);
	const activeRepo = filtered.find((repo) => repo.id === activeId) ?? null;
	const activeOnPage = slice.some((repo) => repo.id === activeId);
	const rows = activeRepo && !activeOnPage ? [activeRepo, ...slice] : slice;

	const setActive = (id: string) => {
		if (id === activeId) return;
		setOverrideActive(id);
		const repo = repos.find((r) => r.id === id);
		if (repo) toast(`${repo.fullName} is now the active repository`);
	};

	return (
		<DashboardLayout moderator={MODERATOR} counts={counts}>
			<div className="overflow-stable h-full px-5 py-6 md:px-8 md:py-10">
				<div className="mx-auto flex w-full max-w-2xl flex-col">
					<header className="flex flex-col gap-1.5">
						<h1 className="font-semibold text-2xl tracking-tight">GitHub</h1>
						<p className="text-muted-foreground text-sm">
							Connect GitHub to{" "}
							<span className="font-medium text-foreground">{org}</span> and
							choose the repository tripwire gates.
						</p>
					</header>

					{/* Linked accounts — borderless rows + a quiet connect link. */}
					<div className="mt-7 mb-8 flex flex-col gap-1">
						{accounts.map((account) => (
							<GithubAccountCard key={account.id} account={account} />
						))}
						<button
							type="button"
							onClick={() => toast("Opening GitHub App install…")}
							className="self-center p-2 text-muted-foreground text-xs transition-colors hover:text-foreground"
						>
							+ Connect another account
						</button>
					</div>

					{/* Active repository */}
					<section className="flex flex-col gap-3">
						<div className="flex items-center justify-between gap-3">
							<h2 className="font-semibold text-sm tracking-tight">
								Active repository
							</h2>
							<span className="text-muted-foreground text-xs tabular-nums">
								{repos.length} connected
							</span>
						</div>

						<div className="relative flex items-center">
							<HugeiconsIcon
								icon={Search01Icon}
								size={14}
								strokeWidth={2}
								className="pointer-events-none absolute left-3 text-muted-foreground"
							/>
							<Input
								type="search"
								value={search}
								onChange={(e) => {
									setSearch(e.target.value);
									setPage(0);
								}}
								placeholder="Filter repositories…"
								className="h-9 rounded-xl bg-surface-1 pl-9 text-[13px]"
							/>
						</div>

						<div className="divide-y divide-border overflow-hidden rounded-xl bg-surface-1">
							{rows.map((repo) => (
								<RepoRow
									key={repo.id}
									repo={repo}
									active={repo.id === activeId}
									onSelect={() => setActive(repo.id)}
								/>
							))}

							{rows.length === 0 ? (
								<p className="px-3 py-8 text-center text-muted-foreground text-xs">
									No repositories match “{search}”.
								</p>
							) : null}
						</div>

						<RepoPagination
							page={safePage}
							pageCount={pageCount}
							onPage={setPage}
						/>

						<p className="flex items-start gap-1.5 text-muted-foreground text-xs">
							<HugeiconsIcon
								icon={InformationCircleIcon}
								size={13}
								strokeWidth={2}
								className="mt-0.5 shrink-0"
							/>
							<span>
								The active repository is the one tripwire watches — its issues,
								pull requests, and comments flow into your queue and run through
								automod.
							</span>
						</p>
					</section>
				</div>
			</div>
		</DashboardLayout>
	);
}
