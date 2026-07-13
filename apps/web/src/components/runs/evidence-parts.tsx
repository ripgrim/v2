import { ArrowDown01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ReactNode, useState } from "react";
import type { JsonValue } from "#/lib/runs.functions";
import { cn } from "#/lib/utils";

/**
 * Shared evidence primitives (§10). One visual language for everything that
 * points at a THING — file rows and match cards — reused by ai-review's
 * findings and by the rule-evidence detail blocks. Never a second set.
 */

/** Inline `code` in text → mono chips. Sanitized: rendered as text, not HTML. */
export function renderBackticks(text: string): ReactNode {
	return text.split(/(`[^`]+`)/g).map((part, i) => {
		if (part.length > 2 && part.startsWith("`") && part.endsWith("`")) {
			return (
				<code
					className="rounded bg-surface-2 px-1 py-px font-mono text-[11.5px]"
					// biome-ignore lint/suspicious/noArrayIndexKey: static split, stable order
					key={i}
				>
					{part.slice(1, -1)}
				</code>
			);
		}
		return part;
	});
}

export function FileIcon() {
	return (
		<svg
			className="shrink-0 text-muted-foreground/55"
			fill="none"
			height="13"
			role="img"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.7"
			viewBox="0 0 24 24"
			width="13"
		>
			<title>file</title>
			<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
			<polyline points="14 2 14 8 20 8" />
		</svg>
	);
}

/** Path with a dim directory and a bright basename — that's what reads as a file. */
export function FilePath({ file }: { file: string }) {
	const cut = file.lastIndexOf("/");
	const dir = cut >= 0 ? file.slice(0, cut + 1) : "";
	const base = cut >= 0 ? file.slice(cut + 1) : file;
	return (
		<span className="truncate font-mono text-[12px]/4">
			<span className="text-muted-foreground/55">{dir}</span>
			<span className="font-medium text-foreground">{base}</span>
		</span>
	);
}

export function blobUrl(
	repo: string,
	sha: string | null,
	file: string,
	line?: number,
): string | null {
	if (!sha) {
		return null;
	}
	return `https://github.com/${repo}/blob/${sha}/${file}${line ? `#L${line}` : ""}`;
}

/** Wraps a row in a GitHub blob link when a sha is known, else a plain box. */
export function FileLink({
	url,
	children,
}: {
	url: string | null;
	children: ReactNode;
}) {
	const className = "flex min-w-0 flex-1 items-center gap-2";
	return url ? (
		<a className={className} href={url} rel="noreferrer" target="_blank">
			{children}
		</a>
	) : (
		<div className={className}>{children}</div>
	);
}

function FileRow({
	repo,
	sha,
	file,
}: {
	repo: string;
	sha: string | null;
	file: string;
}) {
	const url = blobUrl(repo, sha, file);
	const row = (
		<div className="flex items-center gap-2 rounded-lg bg-surface-1 px-3 py-2">
			<FileIcon />
			<FilePath file={file} />
		</div>
	);
	return url ? (
		<a className="block" href={url} rel="noreferrer" target="_blank">
			{row}
		</a>
	) : (
		row
	);
}

/** Honeypot: the protected files a change request touched, each a file row. */
export function FileRows({
	repo,
	sha,
	files,
}: {
	repo: string;
	sha: string | null;
	files: string[];
}) {
	return (
		<div className="mt-3 flex flex-col gap-1">
			{files.map((file) => (
				<FileRow file={file} key={file} repo={repo} sha={sha} />
			))}
		</div>
	);
}

/** crypto-address: one row per match — the address as a mono chip + where. */
export function CryptoMatches({
	matches,
}: {
	matches: { value: string; location: string }[];
}) {
	return (
		<div className="mt-3 flex flex-col gap-1">
			{matches.map((match, i) => (
				<div
					className="flex items-center gap-2 rounded-lg bg-surface-1 px-3 py-2"
					// biome-ignore lint/suspicious/noArrayIndexKey: matches have no id; order is stable
					key={i}
				>
					<code className="min-w-0 truncate rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[12px]">
						{match.value}
					</code>
					<span className="shrink-0 text-[11px] text-muted-foreground">
						in {match.location}
					</span>
				</div>
			))}
		</div>
	);
}

/**
 * The maintainer-only raw disclosure — the rule's `evidence` (NOT the RuleResult
 * envelope), collapsed by default. Thresholds and the ai-review trace live here.
 * The caller only renders this for the full view — never for a public visitor.
 */
export function RawDisclosure({ evidence }: { evidence: JsonValue }) {
	const [open, setOpen] = useState(false);
	if (evidence === null || evidence === undefined) {
		return null;
	}
	return (
		<div className="mt-2">
			<button
				className={cn(
					"flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground",
				)}
				onClick={() => setOpen((v) => !v)}
				type="button"
			>
				<HugeiconsIcon
					icon={open ? ArrowDown01Icon : ArrowRight01Icon}
					size={12}
					strokeWidth={2}
				/>
				raw
			</button>
			{open ? (
				<pre className="mt-1.5 overflow-x-auto rounded-md bg-surface-1 px-3 py-2 font-mono text-[11px] text-muted-foreground leading-relaxed">
					{JSON.stringify(evidence, null, 2)}
				</pre>
			) : null}
		</div>
	);
}
