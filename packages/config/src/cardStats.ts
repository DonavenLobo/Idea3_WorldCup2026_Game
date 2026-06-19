import type { CardStatKey } from "@gogaffa/types";

export const CARD_STATS: Array<{ key: CardStatKey; label: string; name: string }> = [
  { key: "hyp", label: "HYP", name: "Hype" },
  { key: "frm", label: "FRM", name: "Form" },
  { key: "atk", label: "ATK", name: "Attack" },
  { key: "ast", label: "AST", name: "Assist" },
  { key: "wal", label: "WAL", name: "Wall" },
  { key: "lck", label: "LCK", name: "Luck" }
] as const;

export const BASE_CARD_STATS = {
  hyp: 50,
  frm: 50,
  atk: 50,
  ast: 50,
  wal: 50,
  lck: 50
} satisfies Record<CardStatKey, number>;
