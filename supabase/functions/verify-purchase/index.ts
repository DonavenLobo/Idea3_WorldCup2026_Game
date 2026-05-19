import { parseVerifyPurchaseRequest } from "./schema.ts";

Deno.serve(async (request) => {
  const input = parseVerifyPurchaseRequest(await request.json());

  return Response.json({
    status: "not_implemented",
    productId: input.productId,
    next: "Verify receipt with platform, write purchases, then grant card/status credits only."
  });
});
