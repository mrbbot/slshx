import type {
  RESTPostOAuth2ClientCredentialsResult,
  Snowflake,
} from "discord-api-types/v9";
import { log } from "../helpers";

export interface APIBasicAuth {
  username: string;
  password: string;
}
export interface APIBearerAuth {
  bearer: string;
  expires?: number;
}
export interface APIBotAuth {
  bot: string;
}
export type APIAuth = APIBasicAuth | APIBearerAuth | APIBotAuth;

export class APIError extends Error {
  constructor(
    readonly method: string,
    readonly path: string,
    readonly code: number,
    message: string
  ) {
    super(message);
    this.name = `APIError [${code}]`;
  }
}

const RELATIVE_FORMAT = /* @__PURE__ */ new Intl.RelativeTimeFormat("en", {
  numeric: "always",
  style: "long",
});

export async function call<Body, Result>(
  method: string,
  path: string,
  body?: Body,
  auth?: APIAuth
): Promise<Result> {
  const url = `https://discord.com/api/v9${path}`;

  const headers: HeadersInit = {};
  const init: RequestInit = { method, headers };

  if (body instanceof FormData) {
    init.body = body;
  } else if (body instanceof URLSearchParams) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    init.body = body.toString();
  } else if (body) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  if (auth) {
    if ("bearer" in auth) {
      headers["Authorization"] = `Bearer ${auth.bearer}`;
    } else if ("bot" in auth) {
      headers["Authorization"] = `Bot ${auth.bot}`;
    } else {
      const credentials = btoa(`${auth.username}:${auth.password}`);
      headers["Authorization"] = `Basic ${credentials}`;
    }
  }

  const res = await fetch(url, init);

  // @ts-expect-error globalThis isn't updated with custom globals
  if (globalThis.MINIFLARE) {
    let resetString = "";
    const limit = res.headers.get("x-ratelimit-limit");
    const remaining = res.headers.get("x-ratelimit-remaining");
    const reset = res.headers.get("x-ratelimit-reset");
    if (limit && remaining && reset) {
      resetString = `(${remaining}/${limit} remaining, reset ${RELATIVE_FORMAT.format(
        Math.round(parseFloat(reset) - Date.now() / 1000),
        "second"
      )})`;
    }
    // Replace interaction tokens with ***
    path = path.replace(/[a-z0-9]{50,}/i, "***") + ":";
    log(method, path, res.status.toString(), res.statusText, resetString);
  }

  if (res.status === 204) {
    return undefined as unknown as Result;
  } else if (res.ok) {
    return await res.json<Result>();
  }

  let error = await res.text();
  // Try prettify the error if it's JSON
  try {
    error = JSON.stringify(JSON.parse(error), null, 2);
  } catch {}
  throw new APIError(method, path, res.status, error);
}

/** @see https://discord.com/developers/docs/topics/oauth2#client-credentials-grant */
export async function getBearerAuth(
  applicationId: Snowflake,
  applicationSecret: string
): Promise<APIBearerAuth> {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: "applications.commands.update",
  });
  const auth: APIBasicAuth = {
    username: applicationId,
    password: applicationSecret,
  };
  const res: RESTPostOAuth2ClientCredentialsResult = await call(
    "POST",
    "/oauth2/token",
    body,
    auth
  );
  return {
    bearer: res.access_token,
    expires: Date.now() + res.expires_in * 1000,
  };
}
