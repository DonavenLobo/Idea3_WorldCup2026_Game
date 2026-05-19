import { parseSendPushNotificationRequest } from "./schema.ts";

Deno.serve(async (request) => {
  const input = parseSendPushNotificationRequest(await request.json());

  return Response.json({
    status: "not_implemented",
    type: input.type,
    next: "Send Expo push notification after validating notification preferences."
  });
});
