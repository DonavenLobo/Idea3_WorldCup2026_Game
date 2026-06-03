import { assertEquals, assertThrows } from "jsr:@std/assert@1";
import { parseGenerateCardAvatarRequest } from "./schema.ts";

Deno.test("parses a valid cardId request", () => {
  const result = parseGenerateCardAvatarRequest({
    cardId: "11111111-1111-1111-1111-111111111111"
  });

  assertEquals(result.cardId, "11111111-1111-1111-1111-111111111111");
});

Deno.test("rejects a missing cardId", () => {
  assertThrows(() => parseGenerateCardAvatarRequest({}), Error, "cardId");
});

Deno.test("rejects a non-uuid cardId", () => {
  assertThrows(() => parseGenerateCardAvatarRequest({ cardId: "nope" }), Error, "cardId");
});
