# Utils Scope
Rules for `packages/utils/**`.
Shared helpers so agents never redefine them. Imported by everything except
`@tripwire/contracts`.

HARD RULES:
- Check here BEFORE writing any inline helper. A helper used by 2+ files moves here.
- `generateId()` returns UUIDv7 and is the ONLY id source — never
  `crypto.randomUUID`, never nanoid, never raw uuid libs, anywhere in the repo.
- No domain types, no I/O beyond what a helper's job strictly requires.
- No abstractions for a single consumer.

See `.claude/rules/architecture.md`, `.claude/rules/naming.md`.
