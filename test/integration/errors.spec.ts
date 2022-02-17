import assert from "assert";
import test from "ava";
import type {
  APIApplicationCommandInteraction,
  APIEmbed,
  APIInteractionResponseChannelMessageWithSource,
  APIMessageComponentInteraction,
  APIModalSubmitInteraction,
} from "discord-api-types/v9";
import { INTERACTION, MESSAGE, dispatchInteraction, ignite } from "./helpers";

const ERROR: Partial<APIEmbed> = {
  title: "🚨  Error",
  color: 0xfc484a,
  footer: { text: "Errors are only returned during development" },
};

test("responds with nice error in response to chat input", async (t) => {
  let mf = ignite(t);
  const interaction: APIApplicationCommandInteraction = {
    ...INTERACTION,
    type: 2, // InteractionType.APPLICATION_COMMAND
    channel_id: "",
    data: { id: "", type: 1, name: "errors" }, // 1 = ApplicationCommandType.CHAT_INPUT
  };
  const res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 200);
  const body = await res.json<APIInteractionResponseChannelMessageWithSource>();
  t.deepEqual(body, {
    type: 4, // InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE
    data: { embeds: [{ ...ERROR, description: "Error-ish!" }] },
  });

  // Check not shown in production
  mf = ignite(t, undefined, { globals: { MINIFLARE: undefined } });
  try {
    await dispatchInteraction(mf, interaction);
    t.fail();
  } catch (e) {
    t.is(e, "Error-ish!");
  }
});

test("responds with nice error in response to button press", async (t) => {
  let mf = ignite(t);
  const interaction: APIMessageComponentInteraction = {
    ...INTERACTION,
    type: 3, // InteractionType.MESSAGE_COMPONENT
    channel_id: "",
    message: MESSAGE,
    data: {
      component_type: 2, // ComponentType.BUTTON
      custom_id: "slshx:1/errors$0#", // 1 = ApplicationCommandType.CHAT_INPUT
    },
  };
  const res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 200);
  const body = await res.json<APIInteractionResponseChannelMessageWithSource>();
  t.is(body.type, 4); // InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE
  const embed = body.data.embeds?.[0];
  assert(embed);
  t.like(embed, ERROR);
  t.regex(embed.description!, /^Button error!\n```Error: Button error!\n/);

  // Check not shown in production
  mf = ignite(t, undefined, { globals: { MINIFLARE: undefined } });
  await t.throwsAsync(dispatchInteraction(mf, interaction), {
    instanceOf: Error,
    message: "Button error!",
  });
});

test("responds with nice error in response to modal submit", async (t) => {
  let mf = ignite(t);
  const interaction: APIModalSubmitInteraction = {
    ...INTERACTION,
    type: 5, // InteractionType.MODAL_SUBMIT,
    channel_id: "",
    data: { custom_id: "slshx:1/errors$1#" },
  };
  const res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 200);
  const body = await res.json<APIInteractionResponseChannelMessageWithSource>();
  t.is(body.type, 4); // InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE
  const embed = body.data.embeds?.[0];
  assert(embed);
  t.like(embed, { ...ERROR, title: "🚨  TypeError" });
  t.regex(embed.description!, /^Modal error!\n```TypeError: Modal error!\n/);

  // Check not shown in production
  mf = ignite(t, undefined, { globals: { MINIFLARE: undefined } });
  await t.throwsAsync(dispatchInteraction(mf, interaction), {
    instanceOf: TypeError,
    message: "Modal error!",
  });
});
