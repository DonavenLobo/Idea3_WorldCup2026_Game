insert into public.card_templates (template_key, name, tier, base_image_url, metadata, is_active)
values (
  'level-00-sketch-v1',
  'Sketch Card Level 00',
  0,
  null,
  '{
    "id": "level-00-sketch-v1",
    "name": "Sketch Card Level 00",
    "version": 1,
    "width": 1024,
    "height": 1536,
    "safeArea": { "x": 94, "y": 96, "width": 836, "height": 1344 },
    "layers": {
      "overall": {
        "x": 120,
        "y": 185,
        "width": 150,
        "fontSize": 84,
        "fontWeight": "900",
        "color": "#2C2923",
        "align": "center",
        "label": "OVR",
        "labelFontSize": 26,
        "labelX": 120,
        "labelY": 150
      },
      "avatar": { "x": 235, "y": 220, "width": 565, "height": 735, "fit": "cover" },
      "displayName": {
        "x": 205,
        "y": 1034,
        "width": 614,
        "height": 70,
        "fontSize": 46,
        "fontWeight": "900",
        "color": "#2C2923",
        "align": "center"
      },
      "stats": {
        "x": 0,
        "y": 1272,
        "columns": [
          { "key": "hyp", "x": 154, "width": 82 },
          { "key": "frm", "x": 278, "width": 82 },
          { "key": "atk", "x": 402, "width": 82 },
          { "key": "ast", "x": 526, "width": 82 },
          { "key": "wal", "x": 650, "width": 82 },
          { "key": "lck", "x": 774, "width": 82 }
        ],
        "labelFontSize": 0,
        "valueFontSize": 42,
        "fontWeight": "900",
        "color": "#2C2923",
        "align": "center",
        "showLabels": false
      },
      "badge": {
        "x": 754,
        "y": 161,
        "width": 150,
        "height": 132,
        "fontSize": 76,
        "backgroundColor": "transparent",
        "color": "#2C2923"
      }
    }
  }'::jsonb,
  true
)
on conflict (template_key) do update set
  name = excluded.name,
  tier = excluded.tier,
  base_image_url = excluded.base_image_url,
  metadata = excluded.metadata,
  is_active = excluded.is_active;

update public.card_templates
set is_active = false
where template_key = 'level-01-base-v1';

update public.cards
set template_id = new_template.id,
  updated_at = now()
from public.card_templates old_template,
  public.card_templates new_template
where public.cards.template_id = old_template.id
  and old_template.template_key = 'level-01-base-v1'
  and new_template.template_key = 'level-00-sketch-v1';
