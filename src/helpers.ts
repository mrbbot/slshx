import type { APIInteractionResponseCallbackData } from "discord-api-types/v10";

export const PREFIX = "slshx";

export type ValueOf<T> = T[keyof T];

export type Awaitable<T> = Promise<T> | T;

export type AwaitableGenerator<T = unknown, TReturn = any, TNext = unknown> =
  | AsyncGenerator<T, TReturn, TNext>
  | Generator<T, TReturn, TNext>;

export function isGenerator(value: any): value is AwaitableGenerator {
  return (
    typeof value?.next === "function" &&
    typeof value?.throw === "function" &&
    typeof value?.return === "function"
  );
}

export function hexDecode(data: string): Uint8Array {
  return new Uint8Array(
    data.match(/.{2}/g)?.map((byte) => parseInt(byte, 16)) ?? []
  );
}

export type WithFileAttachments<
  T extends {
    attachments?: APIInteractionResponseCallbackData["attachments"] | null;
  }
> = Omit<T, "attachments"> & {
  attachments?: File[];
};

export function extractAttachments<T extends { attachments?: File[] }>(
  message: T
): [
  newBody: Omit<T, "attachments"> & {
    attachments?: APIInteractionResponseCallbackData["attachments"];
  },
  formData?: FormData
] {
  if (!message.attachments?.length) return [message as any, undefined];
  const formData = new FormData();
  const attachments: APIInteractionResponseCallbackData["attachments"] = [];
  for (let i = 0; i < message.attachments.length; i++) {
    formData.set(`files[${i}]`, message.attachments[i]);
    attachments.push({
      id: i as unknown as string, // i should be an integer
      filename: message.attachments[i].name,
    });
  }
  return [{ ...message, attachments }, formData];
}

export function mergeFormData<T>(body: T, formData?: FormData): T | FormData {
  if (formData) {
    formData.set("payload_json", JSON.stringify(body));
    return formData;
  } else {
    return body;
  }
}

export function jsonResponse<T>(body: T, formData?: FormData) {
  if (formData) {
    formData.set("payload_json", JSON.stringify(body));
    return new Response(formData);
  } else {
    return new Response(JSON.stringify(body), {
      headers: { "Content-Type": "application/json" },
    });
  }
}

export function log(...data: any[]) {
  console.log(`\x1b[35m[${PREFIX}]`, ...data, "\x1b[39m");
}
