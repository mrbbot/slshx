import type {
  APIInteraction,
  APIModalSubmitInteraction,
} from "discord-api-types/v9";
import { hexDecode } from "../helpers";

const ENCODER = /* @__PURE__ */ new TextEncoder();

export async function validateInteraction(
  publicKeyData: Uint8Array,
  request: Request,
  skipKeyValidation = false
): Promise<APIInteraction | APIModalSubmitInteraction | false> {
  const requestBody = await request.text();
  if (skipKeyValidation) return true && JSON.parse(requestBody);

  const signature = hexDecode(
    String(request.headers.get("X-Signature-Ed25519"))
  );

  const timestamp = String(request.headers.get("X-Signature-Timestamp"));

  const publicKey = await crypto.subtle.importKey(
    "raw",
    publicKeyData,
    // @ts-expect-error Node.js needs to know this is a public key
    { name: "NODE-ED25519", namedCurve: "NODE-ED25519", public: true },
    true,
    ["verify"]
  );
  const valid = await crypto.subtle.verify(
    "NODE-ED25519",
    publicKey,
    signature,
    ENCODER.encode(timestamp + requestBody)
  );

  return valid && JSON.parse(requestBody);
}
