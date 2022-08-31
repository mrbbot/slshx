import { Request, Response } from "@miniflare/core";
import test from "ava";
import { APIBearerAuth } from "../../src";
import { Console, EXPECTED_COMMANDS, ignite, publicKeyHex } from "./helpers";

test("responds with landing page", async (t) => {
  const mf = ignite(t);
  let res = await mf.dispatchFetch("http://localhost:8787");
  t.is(res.status, 200);
  const body = await res.text();
  t.regex(body, /<title>⚔️ Slshx<\/title>/);
  t.regex(body, /action="\?slshx_action=authorize".+Add to Server/);
  t.regex(body, /action="\?slshx_action=deploy".+Deploy Commands Globally/);
  t.regex(body, /\(app_id\)/);

  // Check only responds to GET requests
  res = await mf.dispatchFetch("http://localhost:8787", { method: "POST" });
  t.not(res.status, 200);

  // Check doesn't respond when deployed
  await mf.setOptions({
    globals: { MINIFLARE: undefined, TEST_SLSHX_PUBLIC_KEY: publicKeyHex },
  });
  res = await mf.dispatchFetch("http://localhost:8787");
  t.is(res.status, 405);
  t.is(await res.text(), "Method Not Allowed");
});

test("redirects to authorize page", async (t) => {
  const mf = ignite(t);
  let res = await mf.dispatchFetch(
    "http://localhost:8787/?slshx_action=authorize",
    { method: "POST" }
  );
  t.is(res.status, 302);
  t.is(
    res.headers.get("Location"),
    "https://discord.com/api/oauth2/authorize?client_id=app_id&scope=applications.commands"
  );

  // Check doesn't redirect when deployed
  await mf.setOptions({
    globals: { MINIFLARE: undefined, TEST_SLSHX_PUBLIC_KEY: publicKeyHex },
  });
  res = await mf.dispatchFetch(
    "http://localhost:8787/?slshx_action=authorize",
    { method: "POST" }
  );
  t.not(res.status, 302);
});

test("deploys commands globally", async (t) => {
  const requests: string[] = [];
  const c = new Console();
  const CACHE: { bearerAuth?: APIBearerAuth; jsonCommands?: string } = {};

  const fetch = async (request: Request) => {
    requests.push(`${request.method} ${request.url}`);

    // For token requests, check the headers, body, and then return a bearer
    // token that expires 1 hour from now
    if (
      request.method === "POST" &&
      request.url === "https://discord.com/api/v10/oauth2/token"
    ) {
      const [type, auth] = request.headers.get("Authorization")!.split(" ");
      t.is(type, "Basic");
      t.is(Buffer.from(auth, "base64").toString(), "app_id:secret");

      const formData = await request.formData();
      t.is(formData.get("grant_type"), "client_credentials");
      t.is(formData.get("scope"), "applications.commands.update");

      return new Response(
        JSON.stringify({
          access_token: "access token",
          expires_in: 604800,
          scope: "applications.commands.update",
          token_type: "Bearer",
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // For command override requests, check the access token, the body, and then
    // return nothing: the result should be ignored if successful
    if (
      request.method === "PUT" &&
      request.url === "https://discord.com/api/v10/applications/app_id/commands"
    ) {
      t.is(request.headers.get("Authorization"), `Bearer access token`);
      t.deepEqual(await request.json(), EXPECTED_COMMANDS);
      return new Response(null, { status: 204 });
    }

    return new Response("Not Found", { status: 404 });
  };

  const mf = ignite(t, fetch, {
    globals: {
      console: c,
      BigInt64Array: { $SLSHXCACHE: CACHE },
    },
  });

  // Try to deploy commands globally
  let res = await mf.dispatchFetch(
    "http://localhost:8787/?slshx_action=deploy",
    { method: "POST" }
  );
  t.is(res.status, 200);
  const body = await res.text();
  t.regex(body, /<title>⚔️ Slshx<\/title>/);
  t.regex(body, /\(app_id\)/);
  t.regex(body, /Deployed! ✅/);
  t.regex(body, /\(changes may take up to an hour to propagate\)/);

  t.deepEqual(requests, [
    "POST https://discord.com/api/v10/oauth2/token",
    "PUT https://discord.com/api/v10/applications/app_id/commands",
  ]);
  const n = EXPECTED_COMMANDS.length;
  t.is(await c.next(), "[slshx] Building and deploying commands...");
  t.is(await c.next(), "[slshx] Refreshing access token...");
  t.is(await c.next(), "[slshx] POST /oauth2/token: 200");
  t.is(await c.next(), `[slshx] Deploying ${n} commands globally...`);
  t.is(await c.next(), "[slshx] PUT /applications/app_id/commands: 204");
  t.is(await c.next(), `[slshx] Deployed ${n} commands globally!`);

  // Check deploying again still deploys, nothing is cached
  res = await mf.dispatchFetch("http://localhost:8787/?slshx_action=deploy", {
    method: "POST",
  });
  t.is(res.status, 200);
  t.deepEqual(requests, [
    "POST https://discord.com/api/v10/oauth2/token",
    "PUT https://discord.com/api/v10/applications/app_id/commands",
    "PUT https://discord.com/api/v10/applications/app_id/commands",
  ]);

  // Check doesn't deploy when deployed :D
  await mf.setOptions({
    globals: { MINIFLARE: undefined, TEST_SLSHX_PUBLIC_KEY: publicKeyHex },
  });
  res = await mf.dispatchFetch("http://localhost:8787/?slshx_action=deploy", {
    method: "POST",
  });
  t.not(res.status, 200);
});
