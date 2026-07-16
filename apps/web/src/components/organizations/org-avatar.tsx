import { DitherAvatar } from "#/components/charts/dither-kit";

/**
 * §7 org identity — the generative dither avatar, DERIVED from the org's
 * name at render (deterministic: same name ⇒ same avatar, ~1.5T combinations).
 * Nothing is stored except the optional hue override on the org row. Feed it
 * a controlled input's live value and it regenerates as the user types — the
 * /dither-kit landing behavior; `replayToken` can force the materialize
 * entrance to replay on demand.
 */
export function OrgAvatar({
	name,
	hue,
	size = 20,
	animate = false,
	replayToken,
	className,
}: {
	name: string;
	/** Optional stored override (organization.avatarHue). */
	hue?: number | null;
	size?: number;
	animate?: boolean;
	replayToken?: number;
	className?: string;
}) {
	return (
		<DitherAvatar
			name={name || "tripwire"}
			hue={hue ?? undefined}
			size={size}
			animate={animate}
			replayToken={replayToken}
			className={className}
		/>
	);
}
