import { type AiReviewOutput, aiReviewOutputSchema } from "@tripwire/contracts";
import { AiFindings } from "#/components/runs/ai-findings";
import {
	CryptoMatches,
	FileRows,
	RawDisclosure,
} from "#/components/runs/evidence-parts";
import type { JsonValue, RunStepView } from "#/lib/runs.functions";

/**
 * Rule evidence, §10 — the stored projection, never raw JSON. The step's
 * `summary` is its statement (rendered by the step card); this renders the
 * detail block ONLY for rules that point at THINGS (honeypot ⇒ touched files,
 * crypto-address ⇒ matched addresses, ai-review ⇒ findings). Every other rule's
 * summary is the whole story. The raw `evidence` (thresholds, the ai-review
 * trace) is a maintainer-only collapsed disclosure — never for a public visitor.
 */

function isRecord(v: JsonValue): v is { [k: string]: JsonValue } {
	return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** The rule's `evidence`, unwrapped from the RuleResult envelope if present. */
function innerEvidence(evidence: JsonValue): JsonValue {
	if (isRecord(evidence) && "evidence" in evidence) {
		return evidence.evidence ?? null;
	}
	return evidence ?? null;
}

function reviewOutput(inner: JsonValue): AiReviewOutput | null {
	if (!isRecord(inner) || !("output" in inner)) {
		return null;
	}
	const parsed = aiReviewOutputSchema.safeParse(inner.output);
	return parsed.success ? parsed.data : null;
}

function touchedFiles(inner: JsonValue): string[] {
	if (isRecord(inner) && Array.isArray(inner.touched)) {
		return inner.touched.filter((v): v is string => typeof v === "string");
	}
	return [];
}

function cryptoMatches(
	inner: JsonValue,
): { value: string; location: string }[] {
	if (!isRecord(inner) || !Array.isArray(inner.matches)) {
		return [];
	}
	return inner.matches.flatMap((m) =>
		isRecord(m) && typeof m.value === "string" && typeof m.location === "string"
			? [{ value: m.value, location: m.location }]
			: [],
	);
}

export function RuleEvidence({
	step,
	repo,
	sha,
	maintainer,
}: {
	step: RunStepView;
	repo: string;
	sha: string | null;
	/** The full (session/open-dev) view — public visitors never see raw. */
	maintainer: boolean;
}) {
	const inner = innerEvidence(step.evidence);
	const ruleId = step.ruleRef ? step.ruleRef.split("@")[0] : null;

	let detail: React.ReactNode = null;
	if (step.ruleRef?.startsWith("ai-review@")) {
		const output = reviewOutput(inner);
		detail = output ? (
			<AiFindings output={output} repo={repo} sha={sha} />
		) : null;
	} else if (ruleId === "honeypot") {
		const files = touchedFiles(inner);
		detail =
			files.length > 0 ? (
				<FileRows files={files} repo={repo} sha={sha} />
			) : null;
	} else if (ruleId === "crypto-address") {
		const matches = cryptoMatches(inner);
		detail = matches.length > 0 ? <CryptoMatches matches={matches} /> : null;
	}

	return (
		<>
			{detail}
			{maintainer ? <RawDisclosure evidence={inner} /> : null}
		</>
	);
}
