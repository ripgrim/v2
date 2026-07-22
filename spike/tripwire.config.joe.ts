import { Tripwire, forgeJoe } from "./fixture.ts";

export const tripwire = new Tripwire({ forge: forgeJoe });
export const { rule, signals } = tripwire;
