import { createSign } from "node:crypto";

/**
 * GitHub App auth: a short-lived RS256 App JWT mints installation tokens,
 * cached until shortly before expiry. No octokit — the REST surface Tripwire
 * touches is small and the coupling stays visible.
 */

export interface GithubAppCredentials {
	appId: string;
	/** PEM-encoded private key (PKCS#1 or PKCS#8). */
	privateKey: string;
}

function b64url(input: string | Buffer): string {
	return Buffer.from(input)
		.toString("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

/** App JWT per GitHub docs: iat 60s in the past, exp ≤ 10 minutes. */
export function createAppJwt(
	creds: GithubAppCredentials,
	now = Date.now(),
): string {
	const iat = Math.floor(now / 1000) - 60;
	const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
	const payload = b64url(
		JSON.stringify({ iat, exp: iat + 600, iss: creds.appId }),
	);
	const signature = createSign("RSA-SHA256")
		.update(`${header}.${payload}`)
		.sign(creds.privateKey);
	return `${header}.${payload}.${b64url(signature)}`;
}

interface CachedToken {
	token: string;
	expiresAt: number;
}

const TOKEN_SAFETY_MS = 60_000;

export class InstallationTokenCache {
	private readonly cache = new Map<string, CachedToken>();

	constructor(
		private readonly creds: GithubAppCredentials,
		private readonly apiBase = "https://api.github.com",
		private readonly fetchImpl: typeof fetch = fetch,
	) {}

	async getToken(installationId: string): Promise<string> {
		const cached = this.cache.get(installationId);
		if (cached && cached.expiresAt - TOKEN_SAFETY_MS > Date.now()) {
			return cached.token;
		}
		const res = await this.fetchImpl(
			`${this.apiBase}/app/installations/${installationId}/access_tokens`,
			{
				method: "POST",
				headers: {
					authorization: `Bearer ${createAppJwt(this.creds)}`,
					accept: "application/vnd.github+json",
					"x-github-api-version": "2022-11-28",
				},
			},
		);
		if (!res.ok) {
			throw new Error(
				`installation token request failed: ${res.status} ${await res.text()}`,
			);
		}
		const data = (await res.json()) as { token: string; expires_at: string };
		this.cache.set(installationId, {
			token: data.token,
			expiresAt: new Date(data.expires_at).getTime(),
		});
		return data.token;
	}
}
