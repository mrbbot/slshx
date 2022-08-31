import { Request, Response } from "@miniflare/core";
import test from "ava";
import type {
  APIApplicationCommandInteraction,
  APIInteractionResponseChannelMessageWithSource,
  APIInteractionResponseDeferredChannelMessageWithSource,
  APIInteractionResponsePong,
  APIPingInteraction,
  RESTPostAPIInteractionFollowupJSONBody,
} from "discord-api-types/v10";
import {
  ATTACHMENT,
  CHANNEL,
  Console,
  INTERACTION,
  ROLE,
  USER,
  dispatchInteraction,
  ignite,
} from "./helpers";

test("responds with PONG", async (t) => {
  const mf = ignite(t);
  const interaction: APIPingInteraction = { ...INTERACTION, type: 1 }; // 1 = InteractionType.PING
  const res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 200);
  const body = await res.json<APIInteractionResponsePong>();
  t.deepEqual(body, { type: 1 }); // InteractionResponseType.PONG
});

test("responds with CHANNEL_MESSAGE_WITH_SOURCE", async (t) => {
  const mf = ignite(t);
  const interaction: APIApplicationCommandInteraction = {
    ...INTERACTION,
    type: 2, // InteractionType.APPLICATION_COMMAND
    channel_id: "",
    data: {
      id: "",
      type: 1, // ApplicationCommandType.CHAT_INPUT
      name: "add",
      options: [
        { name: "a", type: 10, value: 1 }, // 10 = ApplicationCommandOptionType.NUMBER
        { name: "b", type: 10, value: 2 },
      ],
    },
  };
  const res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 200);
  const body = await res.json<APIInteractionResponseChannelMessageWithSource>();
  t.deepEqual(body, {
    type: 4, // InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE
    data: { content: "1 + 2 = 3" },
  });
});

test("responds with DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE", async (t) => {
  const c = new Console();
  const fetch = async (request: Request) => {
    t.is(
      request.url,
      `https://discord.com/api/v10/webhooks/app_id/${INTERACTION.token}`
    );
    const body = await request.json<RESTPostAPIInteractionFollowupJSONBody>();
    t.deepEqual(body, { content: "5 - 2 = 7" });
    return new Response('"api response"', { status: 200 });
  };
  const mf = ignite(t, fetch, { globals: { console: c } });
  const interaction: APIApplicationCommandInteraction = {
    ...INTERACTION,
    type: 2, // InteractionType.APPLICATION_COMMAND
    channel_id: "",
    data: {
      id: "",
      type: 1, // ApplicationCommandType.CHAT_INPUT
      name: "group1",
      options: [
        {
          name: "sub",
          type: 1, // ApplicationCommandOptionType.SUB_COMMAND
          options: [
            { name: "a", type: 10, value: 5 }, // 10 = ApplicationCommandOptionType.NUMBER
            { name: "b", type: 10, value: 2 },
          ],
        },
      ],
    },
  };
  const res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 200);
  const body =
    await res.json<APIInteractionResponseDeferredChannelMessageWithSource>();
  t.deepEqual(body, { type: 5 }); // 5 = InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
  t.deepEqual(await res.waitUntil(), ["api response"]);
  // Check token obfuscated
  t.is(await c.next(), "[slshx] POST /webhooks/app_id/***: 200");
});

test("throws if response deferred more than once", async (t) => {
  const mf = ignite(t);
  const interaction: APIApplicationCommandInteraction = {
    ...INTERACTION,
    type: 2, // InteractionType.APPLICATION_COMMAND
    channel_id: "",
    data: {
      id: "",
      type: 1, // ApplicationCommandType.CHAT_INPUT
      name: "group2",
      options: [
        {
          name: "subgroup",
          type: 2, // ApplicationCommandOptionType.SUB_COMMAND_GROUP
          options: [
            {
              name: "mul",
              type: 1, // ApplicationCommandOptionType.SUB_COMMAND
              options: [
                { name: "a", type: 10, value: 2 }, // 10 = ApplicationCommandOptionType.NUMBER
                { name: "b", type: 10, value: 3 },
              ],
            },
          ],
        },
      ],
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

test("responds with all option types", async (t) => {
  const mf = ignite(t);
  const interaction: APIApplicationCommandInteraction = {
    ...INTERACTION,
    type: 2, // InteractionType.APPLICATION_COMMAND
    channel_id: "",
    data: {
      id: "",
      type: 1, // ApplicationCommandType.CHAT_INPUT
      name: "all",
      options: [
        { name: "string", type: 3, value: "test" }, // 3 = ApplicationCommandOptionType.STRING
        { name: "integer", type: 4, value: 42 }, // 4 = ApplicationCommandOptionType.INTEGER
        { name: "boolean", type: 5, value: true }, // 5 = ApplicationCommandOptionType.BOOLEAN
        { name: "user", type: 6, value: "snowflake-ish1" }, // 6 = ApplicationCommandOptionType.USER
        { name: "channel", type: 7, value: "snowflake-ish2" }, // 7 = ApplicationCommandOptionType.CHANNEL
        { name: "role", type: 8, value: "snowflake-ish3" }, // 8 = ApplicationCommandOptionType.ROLE
        { name: "mentionable", type: 9, value: "snowflake-ish4" }, // 9 = ApplicationCommandOptionType.MENTIONABLE
        { name: "number", type: 10, value: 3.141 }, // 10 = ApplicationCommandOptionType.NUMBER
        { name: "attachment", type: 11, value: "snowflake-ish5" }, // 11 = ApplicationCommandOptionType.ATTACHMENT
      ],
      resolved: {
        users: { "snowflake-ish1": USER },
        channels: { "snowflake-ish2": CHANNEL },
        roles: { "snowflake-ish3": ROLE, "snowflake-ish4": ROLE },
        attachments: { "snowflake-ish5": ATTACHMENT },
      },
    },
  };
  const res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 200);
  const body = await res.json<APIInteractionResponseChannelMessageWithSource>();
  t.deepEqual(body, {
    type: 4, // InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE
    data: {
      embeds: [
        {
          title: "Values",
          fields: [
            { name: "string", value: "test" },
            { name: "integer", value: "42" },
            { name: "boolean", value: "true" },
            { name: "user", value: JSON.stringify(USER) },
            { name: "channel", value: JSON.stringify(CHANNEL) },
            { name: "role", value: JSON.stringify(ROLE) },
            { name: "mentionable", value: JSON.stringify(ROLE) },
            { name: "number", value: "3.141" },
            { name: "attachment", value: JSON.stringify(ATTACHMENT) },
          ],
        },
      ],
    },
  });
});

test("responds with 404 if command not found", async (t) => {
  const mf = ignite(t);
  let interaction: APIApplicationCommandInteraction = {
    ...INTERACTION,
    type: 2, // InteractionType.APPLICATION_COMMAND
    channel_id: "",
    data: {
      id: "",
      type: 1, // ApplicationCommandType.CHAT_INPUT,
      name: "div",
      options: [
        { name: "a", type: 10, value: 6 }, // 10 = ApplicationCommandOptionType.NUMBER
        { name: "b", type: 10, value: 3 },
      ],
    },
  };
  let res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 404);
  t.is(await res.text(), "Command Not Found");

  // Check subcommand
  interaction = {
    ...INTERACTION,
    type: 2, // InteractionType.APPLICATION_COMMAND
    channel_id: "",
    data: {
      id: "",
      type: 1, // ApplicationCommandType.CHAT_INPUT,
      name: "group1",
      options: [
        {
          name: "add",
          type: 1, // ApplicationCommandOptionType.SUB_COMMAND
          options: [
            { name: "a", type: 10, value: 1 }, // 10 = ApplicationCommandOptionType.NUMBER
            { name: "b", type: 10, value: 2 },
          ],
        },
      ],
    },
  };
  res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 404);
  t.is(await res.text(), "Command Not Found");

  // Check subcommand group
  interaction = {
    ...INTERACTION,
    type: 2, // InteractionType.APPLICATION_COMMAND
    channel_id: "",
    data: {
      id: "",
      type: 1, // ApplicationCommandType.CHAT_INPUT
      name: "group2",
      options: [
        {
          name: "subgroup",
          type: 2, // ApplicationCommandOptionType.SUB_COMMAND_GROUP
          options: [
            {
              name: "sub",
              type: 1, // ApplicationCommandOptionType.SUB_COMMAND
              options: [
                { name: "a", type: 10, value: 5 }, // 10 = ApplicationCommandOptionType.NUMBER
                { name: "b", type: 10, value: 2 },
              ],
            },
          ],
        },
      ],
    },
  };
  res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 404);
  t.is(await res.text(), "Command Not Found");

  // Check user command name but CHAT_INPUT type
  interaction = {
    ...INTERACTION,
    type: 2, // InteractionType.APPLICATION_COMMAND
    channel_id: "",
    data: {
      id: "",
      type: 1, // ApplicationCommandType.CHAT_INPUT,
      name: "User Command",
    },
  };
  res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 404);
  t.is(await res.text(), "Command Not Found");
});
