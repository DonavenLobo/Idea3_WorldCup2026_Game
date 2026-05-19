export interface VerifyPurchaseRequest {
  userId: string;
  platform: "ios" | "android" | "web";
  productId: string;
  transactionId: string;
  rawReceipt: unknown;
}

export function parseVerifyPurchaseRequest(value: unknown): VerifyPurchaseRequest {
  const input = value as Partial<VerifyPurchaseRequest>;

  if (!input.userId || !input.platform || !input.productId || !input.transactionId) {
    throw new Error("Invalid verify-purchase request.");
  }

  return input as VerifyPurchaseRequest;
}
