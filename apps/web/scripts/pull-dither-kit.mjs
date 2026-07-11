// Pull the dither-kit chart engine from the tripwire registry.
//
//   bun run charts:pull                        # from https://tripwire.sh/r
//   bun run charts:pull -- --from <dir-or-url> # e.g. ~/tripwire/apps/web/public/r
//
// The source of truth lives in the tripwire repo (apps/web/src/components/
// dither-kit) and is published as a shadcn registry at tripwire.sh/r. This
// script resolves the all-in-one `dither-kit` item plus its registry
// dependencies (core + every chart) and writes the files into
// src/components/charts/dither-kit/ — the same place the app imports from.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DEST = join(ROOT, "src/components/charts/dither-kit");

const fromFlag = process.argv.indexOf("--from");
const SOURCE =
	fromFlag !== -1 ? process.argv[fromFlag + 1] : "https://tripwire.sh/r";

async function readItem(name) {
	const ref = `${SOURCE.replace(/\/$/, "")}/${name}.json`;
	if (SOURCE.startsWith("http")) {
		const res = await fetch(ref);
		if (!res.ok) throw new Error(`${ref} → HTTP ${res.status}`);
		return res.json();
	}
	return JSON.parse(readFileSync(ref.replace("~", process.env.HOME), "utf8"));
}

// Walk the all-in-one item and its @dither-kit/* dependencies.
const seen = new Set();
const queue = ["dither-kit"];
const files = new Map(); // filename → content

while (queue.length) {
	const name = queue.shift();
	if (seen.has(name)) continue;
	seen.add(name);
	const item = await readItem(name);
	for (const f of item.files ?? []) {
		files.set(basename(f.path), f.content);
	}
	for (const dep of item.registryDependencies ?? []) {
		const depName = dep.replace(/^@dither-kit\//, "");
		if (!seen.has(depName)) queue.push(depName);
	}
}

mkdirSync(DEST, { recursive: true });
for (const [name, content] of files) {
	writeFileSync(join(DEST, name), content);
}

console.log(
	`pulled ${files.size} files from ${SOURCE} (items: ${[...seen].join(", ")}) → src/components/charts/dither-kit/`,
);
