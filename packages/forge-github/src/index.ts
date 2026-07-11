/**
 * @tripwire/forge-github — the GitHub adapter. Inbound (verify + normalize)
 * landed with ingest (step 3); reads and actions land with the executor and
 * the PR surface. Never imports a sibling adapter.
 */
export {
	createAppJwt,
	type GithubAppCredentials,
	InstallationTokenCache,
} from "./client/auth.ts";
export { normalizeWebhook } from "./webhook/normalize.ts";
export { signWebhookBody, verifyWebhookSignature } from "./webhook/verify.ts";
