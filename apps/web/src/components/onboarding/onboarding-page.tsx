import { GithubIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import { authQueryKeys } from "#/lib/auth.query";
import { chooseActiveRepo, type RepoLite } from "#/lib/onboarding.functions";
import {
	installUrlQueryOptions,
	onboardingQueryKeys,
	onboardingStateQueryOptions,
} from "#/lib/onboarding.query";
import { cn } from "#/lib/utils";

function Shell({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-h-dvh items-center justify-center bg-background px-6">
			<div className="flex w-full max-w-md flex-col gap-6 rounded-xl border bg-card px-8 py-10">
				<div className="text-center">
					<div className="font-pixel text-lg tracking-tight">
						link your github
					</div>
					<p className="mt-1 text-muted-foreground text-sm">
						tripwire gates one repo at a time. install the app, then pick the
						repo to protect.
					</p>
				</div>
				{children}
			</div>
		</div>
	);
}

export function OnboardingPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { data: state, isLoading } = useQuery(onboardingStateQueryOptions());
	const { data: installUrl } = useQuery(installUrlQueryOptions());

	const finish = useMutation({
		mutationFn: (repoId: string) => chooseActiveRepo({ data: { repoId } }),
		onSettled: async () => {
			await queryClient.invalidateQueries({ queryKey: authQueryKeys.all });
			await queryClient.invalidateQueries({
				queryKey: onboardingQueryKeys.all,
			});
		},
		onSuccess: (res) => {
			if (res.ok) {
				navigate({ to: "/" });
			} else {
				toast("couldn't select that repo — try again.");
			}
		},
	});

	// Exactly one repo granted ⇒ auto-select it and go straight to the dashboard.
	const repos = state?.repos ?? [];
	const single =
		state?.hasInstallation && !state.activeRepo && repos.length === 1;
	const autoFired = useRef(false);
	useEffect(() => {
		if (single && repos[0] && !autoFired.current) {
			autoFired.current = true;
			finish.mutate(repos[0].id);
		}
	}, [single, repos, finish]);

	if (isLoading) {
		return <OnboardingPageSkeleton />;
	}

	// Already onboarded (navigated here directly) — send them home.
	if (state?.activeRepo) {
		navigate({ to: "/" });
		return <OnboardingPageSkeleton />;
	}

	if (!state?.hasInstallation) {
		return (
			<Shell>
				<Button
					className="w-full"
					disabled={!installUrl}
					iconLeft={
						<HugeiconsIcon icon={GithubIcon} size={16} strokeWidth={2} />
					}
					onClick={() => {
						if (installUrl) {
							window.location.href = installUrl;
						}
					}}
				>
					install the github app
				</Button>
				<p className="text-center text-muted-foreground text-xs">
					{installUrl
						? "github will ask which account and repos to grant. you can pick one or all — you'll choose the active one next."
						: "the github app isn't configured yet (set GITHUB_APP_SLUG). nothing to install against."}
				</p>
			</Shell>
		);
	}

	if (repos.length === 0) {
		return (
			<Shell>
				<div className="flex flex-col items-center gap-3 py-2">
					<div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
					<p className="text-center text-muted-foreground text-sm">
						finishing setup — syncing the repos you just granted. this takes a
						moment.
					</p>
				</div>
			</Shell>
		);
	}

	if (single) {
		return <OnboardingPageSkeleton />;
	}

	return (
		<Shell>
			<p className="text-muted-foreground text-sm">
				pick the repo to protect. the others stay linked but idle — tripwire
				gates one repo for now.
			</p>
			<div className="flex flex-col gap-1.5">
				{repos.map((repo) => (
					<RepoRow
						key={repo.id}
						disabled={finish.isPending}
						onSelect={() => finish.mutate(repo.id)}
						repo={repo}
					/>
				))}
			</div>
		</Shell>
	);
}

function RepoRow({
	repo,
	onSelect,
	disabled,
}: {
	repo: RepoLite;
	onSelect: () => void;
	disabled: boolean;
}) {
	return (
		<button
			className={cn(
				"flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
				"hover:bg-surface-1 disabled:opacity-50",
			)}
			disabled={disabled}
			onClick={onSelect}
			type="button"
		>
			<span className="truncate font-medium">{repo.fullName}</span>
			{repo.private ? (
				<span className="ml-2 shrink-0 rounded-full bg-surface-1 px-2 py-0.5 text-muted-foreground text-xs">
					private
				</span>
			) : null}
		</button>
	);
}

export function OnboardingPageSkeleton() {
	return (
		<div className="flex min-h-dvh items-center justify-center bg-background px-6">
			<div className="h-72 w-full max-w-md animate-pulse rounded-xl bg-surface-1" />
		</div>
	);
}
