import { Request, Response } from "@miniflare/core";
import test from "ava";
import type {
  APIApplicationCommandInteraction,
  APIInteractionResponseChannelMessageWithSource,
  APIInteractionResponseDeferredChannelMessageWithSource,
  APIInteractionResponseDeferredMessageUpdate,
  APIInteractionResponseUpdateMessage,
  APIMessageComponentInteraction,
  RESTPostAPIInteractionFollowupJSONBody,
} from "discord-api-types/v9";
import {
  Console,
  INTERACTION,
  MESSAGE,
  dispatchInteraction,
  ignite,
} from "./helpers";

test("responds with CHANNEL_MESSAGE_WITH_SOURCE containing components", async (t) => {
  const mf = ignite(t);
  const interaction: APIApplicationCommandInteraction = {
    ...INTERACTION,
    type: 2, // InteractionType.APPLICATION_COMMAND
    channel_id: "",
    data: { id: "", type: 1, name: "buttons" }, // 1 = ApplicationCommandType.CHAT_INPUT
  };
  const res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 200);
  const body = await res.json<APIInteractionResponseChannelMessageWithSource>();
  t.deepEqual(body, {
    type: 4, // InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE
    data: {
      content: "Press some buttons!",
      components: [
        {
          type: 1, // ComponentType.ACTION_ROW
          components: [
            {
              type: 2, // ComponentType.BUTTON
              custom_id: "slshx:1/buttons$0#EXTRA_DATA",
              style: 1, // ButtonStyle.PRIMARY
              label: "New Message",
            },
            {
              type: 2, // ComponentType.BUTTON
              custom_id: "slshx:1/buttons$1#",
              style: 2, // ButtonStyle.SECONDARY
              label: "Update Message",
            },
            {
              type: 2, // ComponentType.BUTTON
              custom_id: "slshx:1/buttons$2#",
              style: 3, // ButtonStyle.SUCCESS
              label: "Deferred New Message",
            },
            {
              type: 2, // ComponentType.BUTTON
              custom_id: "slshx:1/buttons$3#",
              style: 4, // ButtonStyle.DANGER
              label: "Deferred Update Message",
            },
            {
              type: 2, // ComponentType.BUTTON
              style: 5, // ButtonStyle.LINK
              url: "https://miniflare.dev",
              label: "Miniflare",
            },
          ],
        },
        {
          type: 1, // ComponentType.ACTION_ROW
          components: [
            {
              type: 3, // ComponentType.SELECT_MENU
              custom_id: "slshx:1/buttons$4#",
              placeholder: "Nothing selected :(",
              max_values: 2,
              options: [
                { label: "Option 1", value: "1", description: "Description 1" },
                { label: "Option 2", value: "2", description: "Description 2" },
                { label: "Option 3", value: "3", description: "Description 3" },
              ],
            },
          ],
        },
      ],
    },
  });
});

test("responds with CHANNEL_MESSAGE_WITH_SOURCE in response to button press", async (t) => {
  const mf = ignite(t);
  const interaction: APIMessageComponentInteraction = {
    ...INTERACTION,
    type: 3, // InteractionType.MESSAGE_COMPONENT,
    channel_id: "",
    message: MESSAGE,
    data: {
      component_type: 2, // ComponentType.BUTTON
      custom_id: "slshx:1/buttons$0#EXTRA_DATA", // 1 = ApplicationCommandType.CHAT_INPUT
    },
  };
  const res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 200);
  const body = await res.json<APIInteractionResponseChannelMessageWithSource>();
  t.deepEqual(body, {
    type: 4, // InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE
    data: { content: "New button clicked" },
  });
});

test("responds with UPDATE_MESSAGE in response to button press", async (t) => {
  const mf = ignite(t);
  const interaction: APIMessageComponentInteraction = {
    ...INTERACTION,
    type: 3, // InteractionType.MESSAGE_COMPONENT,
    channel_id: "",
    message: MESSAGE,
    data: {
      component_type: 2, // ComponentType.BUTTON
      custom_id: "slshx:1/buttons$1#", // 1 = ApplicationCommandType.CHAT_INPUT
    },
  };
  const res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 200);
  const body = await res.json<APIInteractionResponseUpdateMessage>();
  t.deepEqual(body, {
    type: 7, // InteractionResponseType.UPDATE_MESSAGE
    data: { content: "Update button clicked" },
  });
});

test("responds with DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE in response to button press", async (t) => {
  const c = new Console();
  const fetch = async (request: Request) => {
    t.is(
      request.url,
      `https://discord.com/api/v9/webhooks/app_id/${INTERACTION.token}`
    );
    const body = await request.json<RESTPostAPIInteractionFollowupJSONBody>();
    t.deepEqual(body, { content: "Deferred new button clicked" });
    return new Response('"api response"', { status: 200 });
  };
  const mf = ignite(t, fetch, { globals: { console: c } });
  const interaction: APIMessageComponentInteraction = {
    ...INTERACTION,
    type: 3, // InteractionType.MESSAGE_COMPONENT,
    channel_id: "",
    message: MESSAGE,
    data: {
      component_type: 2, // ComponentType.BUTTON
      custom_id: "slshx:1/buttons$2#", // 1 = ApplicationCommandType.CHAT_INPUT
    },
  };
  const res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 200);
  const body =
    await res.json<APIInteractionResponseDeferredChannelMessageWithSource>();
  t.deepEqual(body, {
    type: 5, // InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
  });
  t.deepEqual(await res.waitUntil(), ["api response"]);
  t.is(await c.next(), "[slshx] POST /webhooks/app_id/***: 200");
});

test("responds with DEFERRED_MESSAGE_UPDATE in response to button press", async (t) => {
  const c = new Console();
  const fetch = async (request: Request) => {
    t.is(
      request.url,
      `https://discord.com/api/v9/webhooks/app_id/${INTERACTION.token}/messages/@original`
    );
    const body = await request.json<RESTPostAPIInteractionFollowupJSONBody>();
    t.deepEqual(body, { content: "Deferred update button clicked" });
    return new Response('"api response"', { status: 200 });
  };
  const mf = ignite(t, fetch, { globals: { console: c } });
  const interaction: APIMessageComponentInteraction = {
    ...INTERACTION,
    type: 3, // InteractionType.MESSAGE_COMPONENT,
    channel_id: "",
    message: MESSAGE,
    data: {
      component_type: 2, // ComponentType.BUTTON
      custom_id: "slshx:1/buttons$3#", // 1 = ApplicationCommandType.CHAT_INPUT
    },
  };
  const res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 200);
  const body = await res.json<APIInteractionResponseDeferredMessageUpdate>();
  t.deepEqual(body, {
    type: 6, // InteractionResponseType.DEFERRED_MESSAGE_UPDATE
  });
  t.deepEqual(await res.waitUntil(), ["api response"]);
  t.is(
    await c.next(),
    "[slshx] PATCH /webhooks/app_id/***/messages/@original: 200"
  );
});

test("responds with UPDATE_MESSAGE in response to select menu changed", async (t) => {
  const mf = ignite(t);
  const interaction: APIMessageComponentInteraction = {
    ...INTERACTION,
    type: 3, // InteractionType.MESSAGE_COMPONENT,
    channel_id: "",
    message: MESSAGE,
    data: {
      component_type: 3, // ComponentType.SELECT_MENU
      custom_id: "slshx:1/buttons$4#", // 1 = ApplicationCommandType.CHAT_INPUT
      values: ["1", "3"],
    },
  };
  const res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 200);
  const body = await res.json<APIInteractionResponseUpdateMessage>();
  t.deepEqual(body, {
    type: 7, // InteractionResponseType.UPDATE_MESSAGE
    data: { content: "Dropdown clicked, selected 1, 3" },
  });
});

test("responds with 404 if component not found", async (t) => {
  const mf = ignite(t);
  const interaction: APIMessageComponentInteraction = {
    ...INTERACTION,
    type: 3, // InteractionType.MESSAGE_COMPONENT,
    channel_id: "",
    message: MESSAGE,
    data: {
      component_type: 2, // ComponentType.BUTTON
      custom_id: "slshx:1/buttons$5#", // 1 = ApplicationCommandType.CHAT_INPUT
    },
  };
  const res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 404);
  t.is(await res.text(), "Component Not Found");
});

test("throws if response to button press deferred more than once", async (t) => {
  const mf = ignite(t);
  const interaction: APIMessageComponentInteraction = {
    ...INTERACTION,
    type: 3, // InteractionType.MESSAGE_COMPONENT,
    channel_id: "",
    message: MESSAGE,
    data: {
      component_type: 2, // ComponentType.BUTTON
      custom_id: "slshx:1/buttons$2#DOUBLE_DEFER", // 1 = ApplicationCommandType.CHAT_INPUT
    },
  };
  const res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 200);
  const body =
    await res.json<APIInteractionResponseDeferredChannelMessageWithSource>();
  t.deepEqual(body, { type: 5 }); // 5 = InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
  await t.throwsAsync(res.waitUntil(), {
    message: "Response can only be deferred once",
  });
});
