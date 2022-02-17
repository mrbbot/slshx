import test from "ava";
import type { APIApplicationCommandAutocompleteInteraction } from "discord-api-types/payloads/v9/_interactions/autocomplete";
import type { APIApplicationCommandAutocompleteResponse } from "discord-api-types/v9";
import { INTERACTION, dispatchInteraction, ignite } from "./helpers";

test("responds with APPLICATION_COMMAND_AUTOCOMPLETE_RESULT", async (t) => {
  const mf = ignite(t);
  const interaction: APIApplicationCommandAutocompleteInteraction = {
    ...INTERACTION,
    type: 4, // InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE
    channel_id: "",
    data: {
      id: "",
      type: 1, // ApplicationCommandType.CHAT_INPUT,
      name: "autocomplete",
      options: [
        { name: "i", type: 4, value: 42 }, // 4 = ApplicationCommandOptionType.INTEGER
        { name: "user", type: 6, value: "1" }, // 6 = ApplicationCommandOptionType.USER
        { name: "channel", type: 7, value: "2" }, // 7 = ApplicationCommandOptionType.CHANNEL
        { name: "role", type: 8, value: "3" }, // 8 = ApplicationCommandOptionType.ROLE
        { name: "mentionable", type: 9, value: "4" }, // 9 = ApplicationCommandOptionType.MENTIONABLE
        { name: "attachment", type: 11, value: "5" }, // 11 = ApplicationCommandOptionType.ATTACHMENT
        { name: "s", type: 3, value: "I know a song...", focused: true }, // 3 = ApplicationCommandOptionType.STRING
        { name: "n", type: 10, value: 3.141 }, // 10 = ApplicationCommandOptionType.NUMBER
      ],
    },
  };
  let res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 200);
  let body = await res.json<APIApplicationCommandAutocompleteResponse>();
  t.deepEqual(body, {
    type: 8, // InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
    data: {
      choices: [
        { name: "integer 42", value: "integer 42" },
        { name: "string I know a song...", value: "string I know a song..." },
        { name: "Number", value: "number 3.141" },
      ],
    },
  });

  // Check with numeric autocomplete too
  interaction.data!.options = [
    { name: "i", type: 4, value: 42 },
    { name: "n", type: 10, value: 3.141, focused: true },
  ];
  res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 200);
  body = await res.json<APIApplicationCommandAutocompleteResponse>();
  t.deepEqual(body, {
    type: 8, // InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
    data: { choices: [{ name: "42.5", value: 42.5 }] },
  });
});

test("responds with 404 if command not found", async (t) => {
  const mf = ignite(t);
  const interaction: APIApplicationCommandAutocompleteInteraction = {
    ...INTERACTION,
    type: 4, // InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE
    channel_id: "",
    data: {
      id: "",
      type: 1, // ApplicationCommandType.CHAT_INPUT,
      name: "random",
      options: [{ name: "i", type: 4, value: 42 }],
    },
  };
  const res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 404);
  t.is(await res.text(), "Command Not Found");
});

test("responds with 404 if autocomplete function not found", async (t) => {
  const mf = ignite(t);
  const interaction: APIApplicationCommandAutocompleteInteraction = {
    ...INTERACTION,
    type: 4, // InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE
    channel_id: "",
    data: {
      id: "",
      type: 1, // ApplicationCommandType.CHAT_INPUT,
      name: "autocomplete",
      options: [
        // Option "i" does not autocomplete
        { name: "i", type: 4, value: 42, focused: true }, // 4 = ApplicationCommandOptionType.INTEGER
        { name: "s", type: 3, value: "I know a song..." }, // 3 = ApplicationCommandOptionType.STRING
        { name: "n", type: 10, value: 3.141 }, // 10 = ApplicationCommandOptionType.NUMBER
      ],
    },
  };
  const res = await dispatchInteraction(mf, interaction);
  t.is(res.status, 404);
  t.is(await res.text(), "Autocomplete Not Found");
});
