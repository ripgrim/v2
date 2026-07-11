/**
 * Minimal authenticated GitHub REST client shared by reads and actions.
 * No octokit — the surface Tripwire touches stays small and visible.
 */
export interface GithubHttpOptions {
	tokenFor(repoFullName: string): Promise<string>;
	apiBase?: string;
	fetchImpl?: typeof fetch;
}

export class GithubHttp {
	readonly apiBase: string;
	private readonly fetchImpl: typeof fetch;

	constructor(private readonly options: GithubHttpOptions) {
		this.apiBase = options.apiBase ?? "https://api.github.com";
		this.fetchImpl = options.fetchImpl ?? fetch;
	}

	async request(
		repoFullName: string,
		method: "GET" | "POST" | "PATCH" | "PUT",
		path: string,
		body?: unknown,
	): Promise<unknown> {
		const token = await this.options.tokenFor(repoFullName);
		const res = await this.fetchImpl(`${this.apiBase}${path}`, {
			method,
			headers: {
				authorization: `Bearer ${token}`,
				accept: "application/vnd.github+json",
				"x-github-api-version": "2022-11-28",
				...(body === undefined ? {} : { "content-type": "application/json" }),
			},
			body: body === undefined ? undefined : JSON.stringify(body),
		});
		if (!res.ok) {
			throw new Error(
				`${method} ${path} failed: ${res.status} ${await res.text()}`,
			);
		}
		return res.status === 204 ? null : await res.json();
	}

	get(repo: string, path: string): Promise<unknown> {
		return this.request(repo, "GET", path);
	}
	post(repo: string, path: string, body: unknown): Promise<unknown> {
		return this.request(repo, "POST", path, body);
	}
	patch(repo: string, path: string, body: unknown): Promise<unknown> {
		return this.request(repo, "PATCH", path, body);
	}
	put(repo: string, path: string, body: unknown): Promise<unknown> {
		return this.request(repo, "PUT", path, body);
	}
}
