import { createAuthClient } from "better-auth/react";

/**
 * /api/auth is proxied by vite (dev) / the reverse proxy (deploy) to the api
 * head, so cookies stay same-origin.
 */
export const authClient = createAuthClient({
	basePath: "/api/auth",
});
