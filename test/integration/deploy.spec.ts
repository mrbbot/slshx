import fs from "fs/promises";
import path from "path";
import { Request, Response } from "@miniflare/core";
import test from "ava";
import { APIBearerAuth } from "../../src";
import { Console, EXPECTED_COMMANDS, __dirname, ignite } from "./helpers";

test("auto-deploys commands to test guild", async (t) => {
  const requests: string[] = [];
  let expectedCommands = EXPECTED_COMMANDS;
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
      request.url ===
        "https://discord.com/api/v10/applications/app_id/guilds/guild/commands"
    ) {
      t.is(request.headers.get("Authorization"), `Bearer access token`);
      t.deepEqual(await request.json(), expectedCommands);
      return new Response(null, { status: 204 });
    }

    return new Response("Not Found", { status: 404 });
  };

  const mf = ignite(t, fetch, {
    globals: {
      console: c,
      BigInt64Array: { $SLSHXCACHE: CACHE },
      TEST_SLSHX_GUILD_ID: "guild",
    },
  });

  // Check token fetched, and commands deployed initially
  const n = EXPECTED_COMMANDS.length;
  t.is(await c.next(), "[slshx] Building and deploying commands...");
  t.is(await c.next(), "[slshx] Refreshing access token...");
  t.is(await c.next(), "[slshx] POST /oauth2/token: 200");
  t.deepEqual(requests, ["POST https://discord.com/api/v10/oauth2/token"]);
  t.is(await c.next(), `[slshx] Deploying ${n} commands to server guild...`);
  t.not(CACHE.bearerAuth, undefined);
  // Commands cache shouldn't be updated until successful deploy
  t.is(CACHE.jsonCommands, undefined);
  t.is(
    await c.next(),
    "[slshx] PUT /applications/app_id/guilds/guild/commands: 204"
  );
  t.deepEqual(requests, [
    "POST https://discord.com/api/v10/oauth2/token",
    "PUT https://discord.com/api/v10/applications/app_id/guilds/guild/commands",
  ]);
  t.is(await c.next(), `[slshx] Deployed ${n} commands to server guild!`);
  t.deepEqual(JSON.parse(CACHE.jsonCommands!), expectedCommands);

  // Check token not fetched, and commands not deployed on reload if same
  await mf.reload();
  t.is(await c.next(), "[slshx] Building and deploying commands...");
  t.is(await c.next(), "[slshx] No changes since last deploy!");

  // Check token not fetched, but commands deployed on reload if different
  const scriptPath = path.join(__dirname, "fixture.js");
  let script = await fs.readFile(scriptPath, "utf8");
  // Change the name of the first option in the "add" command from "a" to "x"
  script = script.replace('useNumber("a"', 'useNumber("x"');
  // Update the expected commands (in a clone)
  expectedCommands = JSON.parse(JSON.stringify(EXPECTED_COMMANDS));
  expectedCommands[0].options![0].name = "x";
  // Update Miniflare with new script (automatically reloads worker)
  await mf.setOptions({ script });
  t.is(await c.next(), "[slshx] Building and deploying commands...");
  t.is(await c.next(), `[slshx] Deploying ${n} commands to server guild...`);
  t.is(
    await c.next(),
    "[slshx] PUT /applications/app_id/guilds/guild/commands: 204"
  );
  t.is(await c.next(), `[slshx] Deployed ${n} commands to server guild!`);
  t.deepEqual(JSON.parse(CACHE.jsonCommands!), expectedCommands);

  // Check token fetched and commands deployed on reload if token expired and
  // commands different
  // Set token to expire 10 seconds (< 30) from now
  CACHE.bearerAuth!.expires = Date.now() + 10_000;
  // Switch back to the original script (unset script override)
  expectedCommands = EXPECTED_COMMANDS;
  await mf.setOptions({ script: undefined });
  t.is(await c.next(), "[slshx] Building and deploying commands...");
  t.is(await c.next(), "[slshx] Refreshing access token...");
  t.is(await c.next(), "[slshx] POST /oauth2/token: 200");
  t.is(await c.next(), `[slshx] Deploying ${n} commands to server guild...`);
  t.is(
    await c.next(),
    "[slshx] PUT /applications/app_id/guilds/guild/commands: 204"
  );
  t.is(await c.next(), `[slshx] Deployed ${n} commands to server guild!`);
});
