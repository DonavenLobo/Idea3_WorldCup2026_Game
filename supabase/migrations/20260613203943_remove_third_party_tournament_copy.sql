update public.locker_items
set
  name = 'Tournament ''26',
  metadata = jsonb_set(coalesce(metadata, '{}'::jsonb), '{emoji}', '"26"', true)
where item_key = 'badge-wc26';

create or replace function pg_temp.gogaffa_sanitize_tournament_copy(value text)
returns text
language sql
immutable
as $$
  select case
    when value is null then null
    else replace(
      replace(
        replace(
          replace(
            replace(
              replace(
                replace(value,
                  'FIFA World Cups', 'global football tournaments'),
                'FIFA World Cup', 'global football tournament'),
              'World Cups', 'global football tournaments'),
            'World Cup', 'global football tournament'),
          'FIFA', 'international football governing body'),
        'WCs', 'global tournaments'),
      'WC', 'global tournament')
  end
$$;

update public.trivia_questions
set
  question = pg_temp.gogaffa_sanitize_tournament_copy(question),
  answer_options = pg_temp.gogaffa_sanitize_tournament_copy(answer_options::text)::jsonb,
  explanation = pg_temp.gogaffa_sanitize_tournament_copy(explanation),
  source_url = null
where
  question ilike '%fifa%'
  or question ilike '%world cup%'
  or question like '%WC%'
  or answer_options::text ilike '%fifa%'
  or answer_options::text ilike '%world cup%'
  or answer_options::text like '%WC%'
  or explanation ilike '%fifa%'
  or explanation ilike '%world cup%'
  or explanation like '%WC%';
