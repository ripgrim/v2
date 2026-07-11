import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Ban, Check, Plus } from "lucide-react";
import { useState } from "react";
import { DashboardLayout } from "#/components/layouts/dashboard-layout";
import { ContributionGraph } from "#/components/profile/contribution-graph";
import { ProfileActivity } from "#/components/profile/profile-activity";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { automodRulesQueryOptions } from "#/lib/automod.query";
import { contributorProfileQueryOptions } from "#/lib/contributor.query";
import type { ContributorProfile } from "#/lib/contributor.types";
import { moderationQueueQueryOptions } from "#/lib/moderation.query";
import { MODERATOR } from "#/lib/site-config";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/profile/$userHandle")({
	ssr: false,
	loader: ({ context, params }) => {
		void context.queryClient.prefetchQuery(
			contributorProfileQueryOptions(params.userHandle),
		);
		void context.queryClient.prefetchQuery(moderationQueueQueryOptions());
		void context.queryClient.prefetchQuery(automodRulesQueryOptions());
	},
	component: ProfilePage,
});

function ProfilePage() {
	const { userHandle } = Route.useParams();
	const router = useRouter();
	const profileQuery = useQuery(contributorProfileQueryOptions(userHandle));
	const queue = useQuery(moderationQueueQueryOptions());
	const rules = useQuery(automodRulesQueryOptions());

	const counts = {
		queue: queue.data?.length,
		automod: rules.data?.filter((rule) => rule.enabled).length,
	};

	const profile = profileQuery.data;

	return (
		<DashboardLayout moderator={MODERATOR} counts={counts}>
			<div className="overflow-stable h-full px-5 py-6 md:px-8 md:py-10">
				<div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
					<button
						type="button"
						onClick={() => router.history.back()}
						className="flex w-fit items-center gap-1.5 text-muted-foreground text-xs transition-colors hover:text-foreground"
					>
						<HugeiconsIcon icon={ArrowLeft01Icon} size={14} strokeWidth={2} />
						Back
					</button>

					{profile ? (
						<ProfileBody handle={userHandle} profile={profile} />
					) : (
						<ProfileSkeleton />
					)}
				</div>
			</div>
		</DashboardLayout>
	);
}

function ProfileBody({
	handle,
	profile,
}: {
	handle: string;
	profile: ContributorProfile;
}) {
	const [watchlisted, setWatchlisted] = useState(profile.watchlisted);
	const { details, repoStats } = profile;

	return (
		<>
			{/* Banner with the avatar straddling its lower-left edge. */}
			<div className="relative h-30 shrink-0 rounded-[14px] bg-gradient-to-r from-surface-0 via-surface-1 to-surface-0">
				<Avatar className="absolute top-18 left-3.5 size-19 border-4 border-card">
					<AvatarImage src={`https://github.com/${handle}.png`} alt={handle} />
					<AvatarFallback className="bg-[#7c5cff] font-semibold text-[28px] text-white">
						{profile.initial}
					</AvatarFallback>
				</Avatar>
			</div>

			{/* Identity */}
			<div className="flex items-start justify-between gap-4 pt-2 pl-2">
				<div className="flex flex-col gap-0.5">
					<h1 className="font-semibold text-foreground text-xl tracking-[-0.01em]">
						{handle}
					</h1>
					<span className="text-[13px] text-muted-foreground">@{handle}</span>
					<span className="mt-1 text-muted-foreground text-xs">
						Joined {profile.joinedDaysAgo} days ago · {profile.publicRepos}{" "}
						public {plural(profile.publicRepos, "repo")} · {profile.followers}{" "}
						{plural(profile.followers, "follower")}
					</span>
				</div>
				<div className="flex shrink-0 items-center gap-2">
					<Button
						size="xs"
						variant="outline"
						onClick={() => setWatchlisted((v) => !v)}
						className={cn(watchlisted && "bg-surface-0")}
						iconLeft={
							watchlisted ? (
								<Check size={12} strokeWidth={2.2} />
							) : (
								<Plus size={12} strokeWidth={2.2} />
							)
						}
					>
						{watchlisted ? "Watchlisted" : "Watchlist"}
					</Button>
					<Button
						size="xs"
						variant="outline"
						className="text-red-500 hover:text-red-500"
						iconLeft={<Ban size={12} strokeWidth={1.8} />}
					>
						Block
					</Button>
				</div>
			</div>

			{/* Contributions */}
			<section className="flex flex-col gap-2.5">
				<div className="flex items-baseline justify-between">
					<h2 className="font-semibold text-[13px] text-foreground">
						Contributions
					</h2>
					<span className="text-muted-foreground text-xs tabular-nums">
						{profile.contributions.total.toLocaleString()} in the last year
					</span>
				</div>
				<ContributionGraph year={profile.contributions} />
			</section>

			{/* Body: details + repo stats beside the activity feed */}
			<div className="flex flex-col items-start gap-8 md:flex-row">
				<div className="flex w-full flex-col gap-[22px] md:w-60 md:shrink-0">
					<div className="flex flex-col gap-[11px]">
						<h2 className="font-semibold text-[13px] text-foreground">
							Details
						</h2>
						<DetailRow
							label="Account age"
							value={accountAge(details.accountAgeDays)}
						/>
						<DetailRow
							label="Location"
							value={details.location ?? "—"}
							muted={!details.location}
						/>
						<DetailRow
							label="Email"
							value={details.emailVerified ? "Verified" : "Unverified"}
							tone={details.emailVerified ? "default" : "warn"}
						/>
						<DetailRow
							label="2FA"
							value={details.twoFactor ? "On" : "Off"}
							muted={!details.twoFactor}
						/>
					</div>

					<div className="h-px shrink-0 bg-border" />

					<div className="flex flex-col gap-2.5">
						<h2 className="font-semibold text-[13px] text-foreground">
							In your repos
						</h2>
						<div className="grid grid-cols-2 gap-2">
							<RepoStat value={repoStats.mergedPrs} label="Merged PRs" />
							<RepoStat value={repoStats.openPrs} label="Open PRs" />
							<RepoStat value={repoStats.comments} label="Comments" />
							<RepoStat
								value={repoStats.hiddenByAutomod}
								label="Hidden by automod"
								warn={repoStats.hiddenByAutomod > 0}
							/>
						</div>
					</div>
				</div>

				<ProfileActivity events={profile.activity} />
			</div>
		</>
	);
}

function DetailRow({
	label,
	value,
	muted,
	tone = "default",
}: {
	label: string;
	value: string;
	muted?: boolean;
	tone?: "default" | "warn";
}) {
	return (
		<div className="flex items-center justify-between">
			<span className="text-muted-foreground text-xs">{label}</span>
			<span
				className={cn(
					"text-xs tabular-nums",
					tone === "warn"
						? "text-amber-400"
						: muted
							? "text-muted-foreground"
							: "text-foreground",
				)}
			>
				{value}
			</span>
		</div>
	);
}

function RepoStat({
	value,
	label,
	warn,
}: {
	value: number;
	label: string;
	warn?: boolean;
}) {
	return (
		<div className="flex flex-col gap-0.5 rounded-[10px] bg-muted px-3 py-2.5">
			<span
				className={cn(
					"font-semibold text-lg leading-none tabular-nums",
					warn ? "text-amber-400" : "text-foreground",
				)}
			>
				{value}
			</span>
			<span className="text-[11px] text-muted-foreground">{label}</span>
		</div>
	);
}

function ProfileSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			<Skeleton className="h-30 rounded-[14px]" />
			<div className="flex items-center gap-3 pt-2 pl-2">
				<Skeleton className="size-12 rounded-full" />
				<div className="flex flex-col gap-2">
					<Skeleton className="h-5 w-32" />
					<Skeleton className="h-3 w-48" />
				</div>
			</div>
			<Skeleton className="h-27 rounded-lg" />
			<div className="flex gap-8">
				<Skeleton className="h-60 w-60 shrink-0 rounded-lg" />
				<Skeleton className="h-60 flex-1 rounded-lg" />
			</div>
		</div>
	);
}

function plural(n: number, word: string) {
	return n === 1 ? word : `${word}s`;
}

function accountAge(days: number) {
	if (days < 30) return `${days} ${plural(days, "day")}`;
	if (days < 365) {
		const months = Math.floor(days / 30);
		return `${months} ${plural(months, "month")}`;
	}
	const years = Math.floor(days / 365);
	return `${years} ${plural(years, "year")}`;
}
