import { SecurityIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import { armActiveRepo } from "#/lib/arm.functions";
import { cn } from "#/lib/utils";

interface ArmCalloutProps {
	repoFullName: string;
	/** hero dominates the home page; banner is the inline call on scoped pages. */
	variant?: "hero" | "banner";
	className?: string;
}

const WHAT_ARMING_DOES =
	"arming turns the gate on: every non-exempt change request is evaluated against your rules, and one that trips them is blocked with a comment naming why. nothing runs until you arm — tripwire won't touch a change request you didn't choose.";

function useArm(repoFullName: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => armActiveRepo(),
		onSettled: async () => {
			// The whole dashboard re-derives from armed state — refetch broadly.
			await queryClient.invalidateQueries();
		},
		onSuccess: (result) => {
			if (result.armed) {
				toast.success(`tripwire is now watching ${repoFullName}`);
			}
		},
		onError: () => toast.error("couldn't arm the repo — try again"),
	});
}

/**
 * §4 — the unarmed state is a call to action, never an empty state. It DOMINATES
 * the page (hero on home) or leads it (banner on scoped pages) until resolved.
 */
export function ArmCallout({
	repoFullName,
	variant = "banner",
	className,
}: ArmCalloutProps) {
	const arm = useArm(repoFullName);

	if (variant === "hero") {
		return (
			<div
				className={cn(
					"flex flex-col gap-5 rounded-xl bg-surface-1 p-6 md:p-8",
					className,
				)}
			>
				<div className="flex items-center gap-2 text-muted-foreground">
					<HugeiconsIcon icon={SecurityIcon} size={16} strokeWidth={2} />
					<span className="font-medium text-xs uppercase tracking-wide">
						not armed
					</span>
				</div>
				<div className="flex flex-col gap-2">
					<h2 className="font-semibold text-2xl tracking-tight">
						tripwire isn't watching{" "}
						<span className="font-mono text-xl">{repoFullName}</span> yet
					</h2>
					<p className="max-w-xl text-muted-foreground text-sm">
						{WHAT_ARMING_DOES}
					</p>
				</div>
				<div>
					<Button
						disabled={arm.isPending}
						iconLeft={
							<HugeiconsIcon icon={SecurityIcon} size={16} strokeWidth={2} />
						}
						onClick={() => arm.mutate()}
					>
						{arm.isPending ? "arming…" : "arm this repo"}
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"flex items-center gap-4 rounded-lg bg-surface-1 px-4 py-3",
				className,
			)}
		>
			<div className="min-w-0 flex-1">
				<p className="font-medium text-sm">
					not armed — tripwire isn't watching this repo
				</p>
				<p className="text-muted-foreground text-xs">
					what's below is what will run once you arm it.
				</p>
			</div>
			<Button
				className="shrink-0"
				disabled={arm.isPending}
				onClick={() => arm.mutate()}
				size="sm"
			>
				{arm.isPending ? "arming…" : "arm"}
			</Button>
		</div>
	);
}
