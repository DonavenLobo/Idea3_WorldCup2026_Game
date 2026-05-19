insert into public.nations (code, name, flag_emoji, confederation, primary_color, secondary_color)
values
  ('USA', 'United States', '🇺🇸', 'CONCACAF', '#1F4E8C', '#C8102E'),
  ('MEX', 'Mexico', '🇲🇽', 'CONCACAF', '#006341', '#CE1126'),
  ('CAN', 'Canada', '🇨🇦', 'CONCACAF', '#D80621', '#FFFFFF'),
  ('BRA', 'Brazil', '🇧🇷', 'CONMEBOL', '#009B3A', '#FFDF00'),
  ('ARG', 'Argentina', '🇦🇷', 'CONMEBOL', '#75AADB', '#F6B40E'),
  ('ENG', 'England', '🏴', 'UEFA', '#FFFFFF', '#C8102E'),
  ('FRA', 'France', '🇫🇷', 'UEFA', '#1D3F8F', '#EF4135')
on conflict (code) do update set
  name = excluded.name,
  flag_emoji = excluded.flag_emoji,
  confederation = excluded.confederation,
  primary_color = excluded.primary_color,
  secondary_color = excluded.secondary_color;
