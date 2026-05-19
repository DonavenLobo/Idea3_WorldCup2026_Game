import type { PlayerCardRenderTemplate } from "../types";

export function resolveTemplate(
  templates: PlayerCardRenderTemplate[],
  templateId: string
): PlayerCardRenderTemplate {
  const template = templates.find((candidate) => candidate.id === templateId);

  if (!template) {
    throw new Error(`Card template not found: ${templateId}`);
  }

  return template;
}
