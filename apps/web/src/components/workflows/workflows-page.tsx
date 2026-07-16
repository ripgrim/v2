import {
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArmCallout } from "#/components/arming/arm-callout";
import { DashboardLayout } from "#/components/layouts/dashboard-layout";
import { WorkflowCanvas } from "#/components/workflows/editor/canvas";
import { orgRepoQueryOptions } from "#/lib/org.query";
import {
	getWorkflowForRepo,
	saveWorkflowForRepo,
} from "#/lib/workflows.functions";

const routeApi = getRouteApi("/$org/$repo/workflows");

export const workflowsQueryKeys = {
	all: ["workflows"] as const,
	details: () => [...workflowsQueryKeys.all, "detail"] as const,
	detail: (org: string, repoId: string) =>
		[...workflowsQueryKeys.details(), org, repoId] as const,
};

const workflowQueryOptions = (org: string, repoId: string) =>
	queryOptions({
		queryKey: workflowsQueryKeys.detail(org, repoId),
		queryFn: ({ signal }) =>
			getWorkflowForRepo({ data: { org, repoId }, signal }),
		staleTime: 15_000,
		enabled: repoId !== "",
	});

export function WorkflowsPage() {
	const queryClient = useQueryClient();
	// Scoped to the URL's repo (§8) — the layout route already resolved it.
	const { org, repo: repoName } = routeApi.useParams();
	const { data: repo } = useQuery(orgRepoQueryOptions(org, repoName));
	const repoId = repo?.id ?? "";
	const { data: definition } = useQuery(workflowQueryOptions(org, repoId));

	const save = useMutation({
		mutationFn: saveWorkflowForRepo,
		onSettled: () =>
			queryClient.invalidateQueries({
				queryKey: workflowsQueryKeys.detail(org, repoId),
			}),
	});

	return (
		<DashboardLayout counts={{}}>
			<div className="mx-auto flex h-[calc(100dvh-10rem)] w-full max-w-5xl flex-col px-6 py-8">
				<header className="mb-4 flex items-center justify-between gap-4">
					<div>
						<h1 className="font-semibold text-2xl tracking-tight">Workflows</h1>
						<p className="text-muted-foreground text-sm">
							the DAG the executor walks — triggers, rules, gates, actions.
						</p>
					</div>
					{repo ? (
						<span className="rounded-md border bg-card px-2.5 py-1.5 font-medium text-muted-foreground text-sm">
							{repo.fullName}
						</span>
					) : null}
				</header>
				{repo && !repo.armed ? (
					<ArmCallout
						className="mb-4"
						org={org}
						repo={repoName}
						repoFullName={repo.fullName}
						variant="banner"
					/>
				) : null}
				{definition ? (
					<WorkflowCanvas
						definition={definition}
						key={`${repoId}-${definition.id}`}
						onSave={(next) => {
							if (!repoId) {
								return;
							}
							save.mutate(
								{ data: { org, repoId, definition: next } },
								{
									onSuccess: (result) => {
										if (result && "error" in result) {
											toast(result.error);
										} else {
											toast("workflow saved");
										}
									},
								},
							);
						}}
						saving={save.isPending}
					/>
				) : null}
			</div>
		</DashboardLayout>
	);
}

export function WorkflowsPageSkeleton() {
	return (
		<DashboardLayout counts={{}}>
			<div className="mx-auto w-full max-w-5xl px-6 py-8">
				<div className="mb-4 h-8 w-48 animate-pulse rounded-md bg-surface-1" />
				<div className="h-[60dvh] animate-pulse rounded-lg bg-surface-1" />
			</div>
		</DashboardLayout>
	);
}
