import test from "ava";
import type {
  APIInteractionResponseChannelMessageWithSource,
  APIInteractionResponseUpdateMessage,
  APIMessageApplicationCommandInteraction,
  APIMessageComponentInteraction,
  APIUserApplicationCommandInteraction,
} from "discord-api-types/v10";
import {
  INTERACTION,
  MESSAGE,
  USER,
  dispatchInteraction,
  ignite,
} from "./helpers";

test("user command responds with CHANNEL_MESSAGE_WITH_SOURCE", async (t) => {
  const mf = ignite(t);
  const interaction: APIUserApplicationCommandInteraction = {
    ...INTERACTION,
    type: 2, // InteractionType.APPLICATION_COMMAND
    channel_id: "",
    data: {
      id: "",
      type: 2, // ApplicationCommandType.USER
      name: "User Command",
      target_id: USER.id,
      resolved: { users: { [USER.id]: USER } },
    },
  };
  const res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 200);
  const body = await res.json<APIInteractionResponseChannelMessageWithSource>();
  t.deepEqual(body, {
    type: 4, // InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE
    data: { content: `User: ${USER.username} (${USER.id})` },
  });
});
test("user command responds with UPDATE_MESSAGE in response to button press", async (t) => {
  const mf = ignite(t);
  const interaction: APIMessageComponentInteraction = {
    ...INTERACTION,
    type: 3, // InteractionType.MESSAGE_COMPONENT,
    channel_id: "",
    message: MESSAGE,
    data: {
      component_type: 2, // ComponentType.BUTTON
      custom_id: "slshx:2/User Command$0#", // 2 = ApplicationCommandType.USER
    },
  };
  const res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 200);
  const body = await res.json<APIInteractionResponseUpdateMessage>();
  t.deepEqual(body, {
    type: 7, // InteractionResponseType.UPDATE_MESSAGE
    data: { content: "User update button clicked" },
  });
});
test("responds with 404 if user command not found", async (t) => {
  const mf = ignite(t);
  const interaction: APIUserApplicationCommandInteraction = {
    ...INTERACTION,
    type: 2, // InteractionType.APPLICATION_COMMAND
    channel_id: "",
    data: {
      id: "",
      type: 2, // ApplicationCommandType.USER
      name: "Not a User Command",
      target_id: USER.id,
      resolved: { users: { [USER.id]: USER } },
    },
  };
  let res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 404);
  t.is(await res.text(), "Command Not Found");

  // Check chat input command name but USER type
  interaction.data.name = "add";
  res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 404);
  t.is(await res.text(), "Command Not Found");

  // Check message command name but USER type
  interaction.data.name = "Message Command";
  res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 404);
  t.is(await res.text(), "Command Not Found");
});

test("message command responds with CHANNEL_MESSAGE_WITH_SOURCE", async (t) => {
  const mf = ignite(t);
  const interaction: APIMessageApplicationCommandInteraction = {
    ...INTERACTION,
    type: 2, // InteractionType.APPLICATION_COMMAND
    channel_id: "",
    data: {
      id: "",
      type: 3, // ApplicationCommandType.MESSAGE
      name: "Message Command",
      target_id: MESSAGE.id,
      resolved: { messages: { [MESSAGE.id]: MESSAGE } },
    },
  };
  const res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 200);
  const body = await res.json<APIInteractionResponseChannelMessageWithSource>();
  t.deepEqual(body, {
    type: 4, // InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE
    data: { content: `Message: ${MESSAGE.content} (${MESSAGE.id})` },
  });
});
test("message command responds with UPDATE_MESSAGE in response to button press", async (t) => {
  const mf = ignite(t);
  const interaction: APIMessageComponentInteraction = {
    ...INTERACTION,
    type: 3, // InteractionType.MESSAGE_COMPONENT,
    channel_id: "",
    message: MESSAGE,
    data: {
      component_type: 2, // ComponentType.BUTTON
      custom_id: "slshx:3/Message Command$0#", // 3 = ApplicationCommandType.MESSAGE
    },
  };
  const res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 200);
  const body = await res.json<APIInteractionResponseUpdateMessage>();
  t.deepEqual(body, {
    type: 7, // InteractionResponseType.UPDATE_MESSAGE
    data: { content: "Message update button clicked" },
  });
});
test("responds with 404 if message command not found", async (t) => {
  const mf = ignite(t);
  const interaction: APIMessageApplicationCommandInteraction = {
    ...INTERACTION,
    type: 2, // InteractionType.APPLICATION_COMMAND
    channel_id: "",
    data: {
      id: "",
      type: 3, // ApplicationCommandType.MESSAGE
      name: "Not a Message Command",
      target_id: MESSAGE.id,
      resolved: { messages: { [MESSAGE.id]: MESSAGE } },
    },
  };
  let res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 404);
  t.is(await res.text(), "Command Not Found");

  // Check chat input command name but MESSAGE type
  interaction.data.name = "add";
  res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 404);
  t.is(await res.text(), "Command Not Found");

  // Check user command name but MESSAGE type
  interaction.data.name = "User Command";
  res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 404);
  t.is(await res.text(), "Command Not Found");
});
