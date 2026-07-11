import { createHmac, timingSafeEqual } from "node:crypto";
import type { RawForgeEvent } from "@tripwire/forge";

/**
 * Constant-time verification of X-Hub-Signature-256 (HMAC SHA-256 of the raw
 * body with the webhook secret). Reject ≠ 401 at the route (§5.1).
 */
export function verifyWebhookSignature(
	event: Pick<RawForgeEvent, "body" | "signature">,
	secret: string,
): boolean {
	if (!event.signature?.startsWith("sha256=")) {
		return false;
	}
	const expected = createHmac("sha256", secret)
		.update(event.body)
		.digest("hex");
	const provided = event.signature.slice("sha256=".length);
	if (provided.length !== expected.length) {
		return false;
	}
	return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

/** Computes the signature header value — used by tests and fixture replays. */
export function signWebhookBody(body: string, secret: string): string {
	return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}
