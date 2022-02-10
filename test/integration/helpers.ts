import { webcrypto } from "crypto";
import path from "path";
import {
  ReadableStreamDefaultReader,
  TransformStream,
  WritableStreamDefaultWriter,
} from "stream/web";
import { fileURLToPath } from "url";
import { TextEncoder } from "util";
import { Request, RequestInfo, RequestInit, Response } from "@miniflare/core";
import { ExecutionContext } from "ava";
import type {
  APIBaseInteraction,
  APIInteractionDataResolvedChannel,
  APIMessage,
  APIRole,
  APIUser,
  RESTPostAPIApplicationCommandsJSONBody,
} from "discord-api-types/v9";
import { Miniflare, MiniflareOptions } from "miniflare";

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);
const fixturePath = path.join(__dirname, "fixture.js");

// Generate key for signing/verifying requests
export const encoder = new TextEncoder();
// @ts-expect-error crypto doesn't have correct WebCrypto types, so pretend
//  it's Workers crypto.
const crypto = webcrypto as Crypto;
export const algorithm = { name: "NODE-ED25519", namedCurve: "NODE-ED25519" };
// noinspection JSVoidFunctionReturnValueUsed,TypeScriptValidateJSTypes
export const key = (await crypto.subtle.generateKey(algorithm, true, [
  "sign",
  "verify",
])) as CryptoKeyPair;
const publicKey = await crypto.subtle.exportKey("raw", key.publicKey);
// @ts-expect-error publicKey is actually a Uint8Array
export const publicKeyHex = Buffer.from(publicKey).toString("hex");

export class Console {
  readonly #reader: ReadableStreamDefaultReader<string>;
  readonly #writer: WritableStreamDefaultWriter<string>;

  constructor() {
    const { readable, writable } = new TransformStream<string, string>();
    this.#reader = readable.getReader();
    this.#writer = writable.getWriter();
  }

  // noinspection JSUnusedGlobalSymbols
  log(...args: any[]) {
    // Remove colour codes
    const value = args.join(" ").replace(/\x1b\[[0-9]+m/g, "");
    void this.#writer.write(value.trim());
  }

  async next(): Promise<string> {
    return (await this.#reader.read()).value ?? "";
  }
}

export function ignite(
  t: ExecutionContext,
  fetch?: (request: Request) => Promise<Response>,
  opts?: MiniflareOptions
): Miniflare {
  const globals: Record<string, any> = {
    t,
    TEST_SLSHX_PUBLIC_KEY: publicKeyHex,
    fetch: fetch
      ? (input: RequestInfo, init: RequestInit) => {
          return fetch(new Request(input, init));
        }
      : async () => {
          throw new Error("fetch not implemented");
        },
  };
  return new Miniflare({
    ...opts,
    modules: true,
    scriptPath: fixturePath,
    // Flag only needed for tests (checking response files)
    compatibilityFlags: ["formdata_parser_supports_files"],
    bindings: { ...opts?.bindings, KEY: "value" },
    globals: { ...opts?.globals, ...globals },
  });
}

export async function dispatchInteraction<RequestBody>(
  mf: Miniflare,
  body: RequestBody
): Promise<Response> {
  // Sign request...
  const jsonBody = JSON.stringify(body);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = await crypto.subtle.sign(
    algorithm,
    key.privateKey,
    encoder.encode(timestamp + jsonBody)
  );
  const signatureHex = Buffer.from(signature).toString("hex");

  // ...and dispatch it
  return mf.dispatchFetch("http://localhost:8787", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Signature-Ed25519": signatureHex,
      "X-Signature-Timestamp": timestamp,
    },
    body: jsonBody,
  });
}

export const INTERACTION: APIBaseInteraction<number, undefined> = {
  version: 1,
  id: "",
  type: -1,
  application_id: "app",
  token: "".padStart(200, "a"),
};

export const USER: APIUser = {
  id: "basically a snowflake",
  username: "Test User",
  discriminator: "0000",
  avatar: null,
};

export const MESSAGE: APIMessage = {
  id: "",
  channel_id: "",
  guild_id: "guild",
  author: USER,
  content: "content",
  timestamp: "2021-12-24T13:47:51.110000+00:00",
  edited_timestamp: null,
  tts: false,
  mention_everyone: false,
  mentions: [],
  mention_roles: [],
  attachments: [],
  embeds: [],
  pinned: false,
  type: 0,
};

export const CHANNEL: APIInteractionDataResolvedChannel = {
  id: "",
  type: 0,
  name: "testing",
  permissions: "",
};

export const ROLE: APIRole = {
  id: "",
  name: "",
  color: 0x0094ff,
  hoist: false,
  position: 0,
  permissions: "",
  managed: false,
  mentionable: false,
};

export const EXPECTED_COMMANDS: RESTPostAPIApplicationCommandsJSONBody[] = [
  {
    name: "add",
    description: "Add numbers",
    options: [
      { type: 10, name: "a", description: "1st number", required: true },
      { type: 10, name: "b", description: "2nd number", required: true },
    ],
  },
  {
    name: "group1",
    description: "group1",
    options: [
      {
        type: 1,
        name: "sub",
        description: "Subtracts numbers",
        options: [
          { type: 10, name: "a", description: "1st number", required: true },
          { type: 10, name: "b", description: "2nd number", required: true },
        ],
      },
    ],
  },
  {
    name: "group2",
    description: "group2",
    default_permission: false,
    options: [
      {
        type: 2,
        name: "subgroup",
        description: "subgroup",
        options: [
          {
            type: 1,
            name: "mul",
            description: "Multiplies numbers",
            options: [
              {
                type: 10,
                name: "a",
                description: "1st number",
                required: true,
              },
              {
                type: 10,
                name: "b",
                description: "2nd number",
                required: true,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "all",
    description: "Command using all option types",
    default_permission: false,
    options: [
      { type: 3, name: "string", description: "String option" },
      { type: 4, name: "integer", description: "Integer option" },
      { type: 5, name: "boolean", description: "Boolean option" },
      { type: 6, name: "user", description: "User option" },
      {
        type: 7,
        name: "channel",
        description: "Channel option",
        channel_types: [0, 1], // [ChannelType.GUILD_TEXT, ChannelType.DM]
      },
      { type: 8, name: "role", description: "Role option" },
      { type: 9, name: "mentionable", description: "Mentionable option" },
      { type: 10, name: "number", description: "Number option" },
    ],
  },
  {
    name: "choices",
    description: "Limits inputs to a set of choices",
    options: [
      {
        type: 10,
        name: "n",
        description: "Number",
        required: true,
        choices: [
          { name: "1", value: 1 },
          { name: "2", value: 2 },
          { name: "Three", value: 3 },
        ],
      },
      {
        type: 3,
        name: "s",
        description: "String",
        choices: [
          { name: "a", value: "a" },
          { name: "B", value: "b" },
          { name: "c", value: "c" },
        ],
      },
    ],
  },
  { name: "files", description: "Uploads some files" },
  {
    name: "autocomplete",
    description: "Autocompletes an option",
    options: [
      {
        type: 4,
        name: "i",
        description: "Integer",
        required: true,
        min_value: 0,
        max_value: 100,
      },
      {
        type: 6,
        name: "user",
        description: "User",
      },
      {
        type: 7,
        name: "channel",
        description: "Channel",
      },
      {
        type: 8,
        name: "role",
        description: "Role",
      },
      {
        type: 9,
        name: "mentionable",
        description: "Mentionable",
      },
      {
        type: 3,
        name: "s",
        description: "String",
        required: true,
        autocomplete: true,
      },
      { type: 10, name: "n", description: "Number", autocomplete: true },
    ],
  },
  { name: "buttons", description: "Buttons and select menus!" },
  {
    name: "User Command",
    type: 2, // ApplicationCommandType.USER
    description: "",
  },
  {
    name: "Message Command",
    type: 3, // ApplicationCommandType.MESSAGE
    description: "",
    default_permission: false,
  },
];
