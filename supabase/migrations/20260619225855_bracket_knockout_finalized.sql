-- 000033_bracket_knockout_finalized.sql
-- Adds per-round finalized flags so the bracket can be locked-on-save
-- per knockout round (mirroring the existing group save UX).

alter table public.brackets
  add column if not exists r32_finalized   boolean not null default false,
  add column if not exists r16_finalized   boolean not null default false,
  add column if not exists qf_finalized    boolean not null default false,
  add column if not exists sf_finalized    boolean not null default false,
  add column if not exists final_finalized boolean not null default false,
  add column if not exists third_finalized boolean not null default false;

comment on column public.brackets.r32_finalized   is 'True once the user has saved their R32 picks. Becomes permanent (no edits).';
comment on column public.brackets.r16_finalized   is 'Same semantics for R16.';
comment on column public.brackets.qf_finalized    is 'Same semantics for QF.';
comment on column public.brackets.sf_finalized    is 'Same semantics for SF.';
comment on column public.brackets.final_finalized is 'Same semantics for the Final.';
comment on column public.brackets.third_finalized is 'Same semantics for the 3rd-place match.';
