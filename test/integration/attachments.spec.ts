// noinspection JSObjectNullOrUndefined

import assert from "assert";
import { Request, Response } from "@miniflare/core";
import test from "ava";
import type {
  APIApplicationCommandInteraction,
  APIInteractionResponseChannelMessageWithSource,
  RESTPostAPIInteractionFollowupJSONBody,
} from "discord-api-types/v9";
import { Console, INTERACTION, dispatchInteraction, ignite } from "./helpers";

test("responds with file attachments", async (t) => {
  const fetch = async (request: Request) => {
    // Check followup message with files is also handled correctly
    t.is(
      request.url,
      `https://discord.com/api/v9/webhooks/app_id/${INTERACTION.token}`
    );
    const body = await request.formData();

    // Check JSON payload
    const payloadJson = body.get("payload_json");
    assert(typeof payloadJson === "string");
    const payload: RESTPostAPIInteractionFollowupJSONBody =
      JSON.parse(payloadJson);
    t.deepEqual(payload, {
      content: "...and here's another one!",
      attachments: [{ id: 0 as any, filename: "file3.html" }],
    });

    // Check file type and contents
    const file = body.get("files[0]");
    assert(file !== null && typeof file === "object");
    t.is(file.type, "text/html");
    t.is(await file.text(), "<p>goodbye</p>");

    return new Response('"api response"', { status: 200 });
  };
  const mf = ignite(t, fetch, { globals: { console: new Console() } });
  const interaction: APIApplicationCommandInteraction = {
    ...INTERACTION,
    type: 2, // InteractionType.APPLICATION_COMMAND,
    channel_id: "",
    data: {
      id: "",
      type: 1, // ApplicationCommandType.CHAT_INPUT,
      name: "files",
    },
  };
  const res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 200);
  const body = await res.formData();

  // Check JSON payload
  const payloadJson = body.get("payload_json");
  assert(typeof payloadJson === "string");
  const payload: APIInteractionResponseChannelMessageWithSource =
    JSON.parse(payloadJson);
  t.deepEqual(payload, {
    type: 4, // InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE
    data: {
      content: "Here's some files...",
      attachments: [
        { id: 0 as any, filename: "file.txt" },
        { id: 1 as any, filename: "file2.txt" },
      ],
    },
  });

  // Check file types and contents
  let file = body.get("files[0]");
  assert(file !== null && typeof file === "object");
  t.is(file.type, "text/plain");
  t.is(await file.text(), "hello");

  file = body.get("files[1]");
  assert(file !== null && typeof file === "object");
  t.is(file.type, "text/plain");
  t.is(await file.text(), "important stuff");

  t.deepEqual(await res.waitUntil(), ["api response"]);
});
