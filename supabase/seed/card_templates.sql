insert into public.card_templates (template_key, name, tier, base_image_url, metadata)
values (
  'level-01-base-v1',
  'Base Card Level 01',
  1,
  null,
  '{
    "id": "level-01-base-v1",
    "name": "Base Card Level 01",
    "version": 1,
    "width": 1024,
    "height": 1536,
    "safeArea": { "x": 76, "y": 80, "width": 872, "height": 1376 },
    "layers": {
      "overall": { "x": 115, "y": 210, "fontSize": 88, "fontWeight": "800", "color": "#3A2A05" },
      "avatar": { "x": 260, "y": 260, "width": 560, "height": 740, "fit": "contain" },
      "displayName": {
        "x": 160,
        "y": 1010,
        "width": 704,
        "height": 100,
        "fontSize": 74,
        "fontWeight": "900",
        "color": "#3A2A05",
        "align": "center"
      },
      "stats": {
        "y": 1160,
        "columns": [
          { "key": "hyp", "x": 145 },
          { "key": "frm", "x": 295 },
          { "key": "atk", "x": 445 },
          { "key": "ast", "x": 595 },
          { "key": "wal", "x": 745 },
          { "key": "lck", "x": 895 }
        ],
        "labelFontSize": 44,
        "valueFontSize": 58,
        "color": "#3A2A05"
      },
      "badge": { "x": 460, "y": 1320, "width": 110, "height": 110 }
    }
  }'::jsonb
)
on conflict (template_key) do update set
  name = excluded.name,
  tier = excluded.tier,
  metadata = excluded.metadata,
  is_active = true;
