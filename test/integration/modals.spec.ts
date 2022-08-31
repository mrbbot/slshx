import test from "ava";
import type {
  APIApplicationCommandInteraction,
  APIInteractionResponseChannelMessageWithSource,
  APIModalInteractionResponse,
  APIModalSubmitInteraction,
} from "discord-api-types/v10";
import { INTERACTION, dispatchInteraction, ignite } from "./helpers";

test("responds with MODAL", async (t) => {
  const mf = ignite(t);
  const interaction: APIApplicationCommandInteraction = {
    ...INTERACTION,
    type: 2, // InteractionType.APPLICATION_COMMAND
    channel_id: "",
    data: { id: "", type: 1, name: "modals" }, // 1 = ApplicationCommandType.CHAT_INPUT
  };
  const res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 200);
  const body = await res.json<APIModalInteractionResponse>();
  t.deepEqual(body, {
    type: 9, // InteractionResponseType.MODAL
    data: {
      custom_id: "slshx:1/modals$2#EXTRA_DATA",
      title: "Modal Title",
      components: [
        {
          type: 1, // ComponentType.ACTION_ROW
          components: [
            {
              type: 4, // ComponentType.BUTTON
              style: 1, // TextInputStyle.SHORT
              custom_id: "slshx:1/modals$0#",
              label: "Short",
              placeholder: "Short Place",
              min_length: 1,
              max_length: 10,
              required: true,
            },
          ],
        },
        {
          type: 1, // ComponentType.ACTION_ROW
          components: [
            {
              type: 4, // ComponentType.BUTTON
              style: 2, // TextInputStyle.PARAGRAPH
              custom_id: "slshx:1/modals$1#",
              label: "Long",
              placeholder: "Long Placeholder",
              max_length: 1000,
            },
          ],
        },
      ],
    },
  });
});

test("responds with CHANNEL_MESSAGE_WITH_SOURCE in response to modal submit", async (t) => {
  const mf = ignite(t);
  const interaction: APIModalSubmitInteraction = {
    ...INTERACTION,
    type: 5, // InteractionType.MODAL_SUBMIT,
    channel_id: "",
    data: {
      custom_id: "slshx:1/modals$2#EXTRA_DATA",
      components: [
        {
          type: 1, // ComponentType.ACTION_ROW
          components: [
            {
              type: 4,
              custom_id: "slshx:1/modals$0#",
              value: "Hello there!",
            },
          ],
        },
        {
          type: 1, // ComponentType.ACTION_ROW
          components: [
            {
              type: 4, // ComponentType.TEXT_INPUT,
              custom_id: "slshx:1/modals$1#",
              value: "This is a long message to say hi!",
            },
          ],
        },
      ],
    },
  };
  const res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 200);
  const body = await res.json<APIInteractionResponseChannelMessageWithSource>();
  t.deepEqual(body, {
    type: 4, // InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE
    data: {
      content: `Short: "Hello there!" Long: "This is a long message to say hi!"`,
    },
  });
});

test("responds with 404 if modal not found", async (t) => {
  const mf = ignite(t);
  const interaction: APIModalSubmitInteraction = {
    ...INTERACTION,
    type: 5, // InteractionType.MODAL_SUBMIT,
    channel_id: "",
    data: {
      custom_id: "slshx:1/modals$3#",
      components: [
        {
          type: 1, // ComponentType.ACTION_ROW
          components: [
            { type: 4, custom_id: "slshx:1/modals$0#", value: "Hello there!" }, // 4 = ComponentType.TEXT_INPUT,
          ],
        },
      ],
    },
  };
  const res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 404);
  t.is(await res.text(), "Modal Not Found");
});
