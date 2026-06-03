import { assertStringIncludes } from "jsr:@std/assert@1";
import { buildAvatarPrompt } from "./prompt.ts";

Deno.test("edit prompt names the nation and forbids text", () => {
  const prompt = buildAvatarPrompt({
    kitDescription: "yellow and green kit",
    mode: "edit",
    nationName: "Brazil"
  });

  assertStringIncludes(prompt, "Brazil");
  assertStringIncludes(prompt, "yellow and green kit");
  assertStringIncludes(prompt, "no text");
  assertStringIncludes(prompt, "no crests");
});

Deno.test("generate prompt does not assume an input photo", () => {
  const prompt = buildAvatarPrompt({
    kitDescription: "red, white and navy kit",
    mode: "generate",
    nationName: "USA"
  });

  assertStringIncludes(prompt, "Invent");
});
