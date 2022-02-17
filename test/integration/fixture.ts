import {
  $modal,
  $update,
  ButtonStyle,
  ChannelType,
  CommandHandler,
  ComponentType,
  MessageCommandHandler,
  TextInputStyle,
  UserCommandHandler,
  createFollowupMessage,
  createHandler,
  useAttachment,
  useBoolean,
  useButton,
  useChannel,
  useDefaultPermission,
  useDescription,
  useInput,
  useInteger,
  useMentionable,
  useModal,
  useNumber,
  useRole,
  useSelectMenu,
  useString,
  useUser,
} from "../../src";

type Env = { KEY: string };

function add(): CommandHandler<Env> {
  useDescription("Add numbers");
  const a = useNumber("a", "1st number", { required: true });
  const b = useNumber("b", "2nd number", { required: true });
  return (interaction, env, ctx) => {
    // Check parameters are correct
    t.is(interaction.data.name, "add");
    t.is(env.KEY, "value");
    t.is(typeof ctx.waitUntil, "function");

    return { content: `${a} + ${b} = ${a + b}` };
  };
}

function sub(): CommandHandler {
  useDescription("Subtracts numbers");
  const a = useNumber("a", "1st number", { required: true });
  const b = useNumber("b", "2nd number", { required: true });
  return async function* () {
    // Defer response
    yield;
    await scheduler.wait(0);
    return { content: `${a} - ${b} = ${a + b}` };
  };
}

function mul(): CommandHandler {
  useDescription("Multiplies numbers");
  useDefaultPermission(false);
  const a = useNumber("a", "1st number", { required: true });
  const b = useNumber("b", "2nd number", { required: true });
  return async function* () {
    // Make sure options are extracted correctly for nested groups, we should
    // throw later, so won't be able to check this from the response
    t.is(a, 2);
    t.is(b, 3);

    yield; // Defer
    yield; // Defer again, not allowed, should throw

    return { content: `${a} * ${b} = ${a + b}` };
  };
}

// `div` not implemented, should respond with 404 when invoked

function all(): CommandHandler {
  useDescription("Command using all option types");
  useDefaultPermission(false);
  const stringOpt = useString("string", "String option");
  const integerOpt = useInteger("integer", "Integer option");
  const booleanOpt = useBoolean("boolean", "Boolean option");
  const userOpt = useUser("user", "User option");
  const channelOpt = useChannel("channel", "Channel option", {
    types: [ChannelType.GUILD_TEXT, ChannelType.DM],
  });
  const roleOpt = useRole("role", "Role option");
  const mentionableOpt = useMentionable("mentionable", "Mentionable option");
  const numberOpt = useNumber("number", "Number option");
  const attachmentOpt = useAttachment("attachment", "Attachment option");
  return async () => {
    // Check promise response
    await scheduler.wait(0);

    // String-ify-ing options in response, so check types correct here
    t.is(typeof stringOpt, "string");
    t.is(typeof integerOpt, "number");
    t.is(typeof booleanOpt, "boolean");
    t.is(typeof userOpt, "object");
    t.is(typeof channelOpt, "object");
    t.is(typeof roleOpt, "object");
    t.is(typeof mentionableOpt, "object");
    t.is(typeof numberOpt, "number");
    t.is(typeof attachmentOpt, "object");

    return {
      embeds: [
        {
          title: "Values",
          fields: [
            { name: "string", value: String(stringOpt) },
            { name: "integer", value: String(integerOpt) },
            { name: "boolean", value: String(booleanOpt) },
            { name: "user", value: JSON.stringify(userOpt) },
            { name: "channel", value: JSON.stringify(channelOpt) },
            { name: "role", value: JSON.stringify(roleOpt) },
            { name: "mentionable", value: JSON.stringify(mentionableOpt) },
            { name: "number", value: String(numberOpt) },
            { name: "attachment", value: JSON.stringify(attachmentOpt) },
          ],
        },
      ],
    };
  };
}

function choices(): CommandHandler {
  useDescription("Limits inputs to a set of choices");
  // Checking types here (no need to include them normally, they're inferred)
  const n: 1 | 2 | 3 = useNumber("n", "Number", {
    required: true,
    choices: [1, { value: 2 }, { name: "Three", value: 3 }] as const,
  });
  const s: "a" | "b" | "c" | null = useString("s", "String", {
    choices: [{ value: "a" }, { name: "B", value: "b" }, "c"] as const,
  });

  // Check values always satisfy types, even when recording
  t.true([1, 2, 3].includes(n));
  t.true(["a", "b", "c", null].includes(s));

  // Implicitly check returning synchronous generator that immediately returns
  return function* () {
    return { content: `${n} ${s}` };
  };
}

function files(): CommandHandler {
  useDescription("Uploads some files");
  // Implicitly check returning async function
  return async (interaction, env, ctx) => {
    async function uploadAgain() {
      await scheduler.wait(0);
      return createFollowupMessage("app_id", interaction.token, {
        content: "...and here's another one!",
        attachments: [
          new File(["<p>goodbye</p>"], "file3.html", { type: "text/html" }),
        ],
      });
    }
    ctx.waitUntil(uploadAgain());

    return {
      content: "Here's some files...",
      attachments: [
        new File(["hello"], "file.txt", { type: "text/plain" }),
        new File(["important stuff"], "file2.txt", { type: "text/plain" }),
      ],
    };
  };
}

function autocomplete(): CommandHandler {
  useDescription("Autocompletes an option");
  const i = useInteger("i", "Integer", { required: true, min: 0, max: 100 });

  // Check options that would usually be resolved fully just contain id
  const user = useUser("user", "User");
  const channel = useChannel("channel", "Channel");
  const role = useRole("role", "Role");
  const mentionable = useMentionable("mentionable", "Mentionable");
  const attachment = useAttachment("attachment", "Attachment");

  const s: string = useString<Env>("s", "String", {
    required: true,
    async autocomplete(interaction, env, ctx) {
      // Check values are correct
      t.is(interaction.data?.name, "autocomplete");
      t.is(env.KEY, "value");
      t.is(typeof ctx.waitUntil, "function");

      t.deepEqual(user, { id: "1" } as any);
      t.deepEqual(channel, { id: "2" } as any);
      t.deepEqual(role, { id: "3" } as any);
      t.deepEqual(mentionable, { id: "4" } as any);
      t.deepEqual(attachment, { id: "5" } as any);

      return [
        `integer ${i}`, // before
        { value: `string ${s}` }, // self
        { name: "Number", value: `number ${n}` }, // after
      ];
    },
  });
  const n = useNumber("n", "Number", {
    autocomplete() {
      t.is(s, ""); // Check omitted values still have correct types
      return [i + 0.5];
    },
  });
  return () => ({ content: `integer ${i}, string ${s}, number ${n}` });
}

function buttons(): CommandHandler {
  useDescription("Buttons and select menus!");
  const newButtonId = useButton<Env>((interaction, env, ctx) => {
    // Check values are correct, with EXTRA_DATA added by us
    t.is(interaction.data.custom_id, "slshx:1/buttons$0#EXTRA_DATA");
    t.is(env.KEY, "value");
    t.is(typeof ctx.waitUntil, "function");
    return { content: "New button clicked" };
  });
  const updateButtonId = useButton((interaction) => {
    t.is(interaction.data.custom_id, "slshx:1/buttons$1#");
    return { [$update]: true, content: "Update button clicked" };
  });
  const deferredNewButtonId = useButton(async function* (interaction) {
    // `new RegExp` ensures AVA recognises this as a RegExp
    // (we're running under Miniflare, so cross-realm)
    t.regex(interaction.data.custom_id, new RegExp(/^slshx:1\/buttons\$2#/));
    yield;
    if (interaction.data.custom_id.endsWith("DOUBLE_DEFER")) yield;
    await scheduler.wait(0);
    return { content: "Deferred new button clicked" };
  });
  const deferredUpdateButtonId = useButton(async function* (interaction) {
    t.is(interaction.data.custom_id, "slshx:1/buttons$3#");
    yield $update;
    await scheduler.wait(0);
    return { content: "Deferred update button clicked" };
  });
  const selectId = useSelectMenu((interaction) => {
    t.is(interaction.data.custom_id, "slshx:1/buttons$4#");
    const values = interaction.data.values.join(", ");
    return { [$update]: true, content: `Dropdown clicked, selected ${values}` };
  });

  // Check IDs always correct, when recording and handling interactions
  // (1 = ApplicationCommandType.CHAT_INPUT)
  t.is(newButtonId, "slshx:1/buttons$0#");
  t.is(updateButtonId, "slshx:1/buttons$1#");
  t.is(deferredNewButtonId, "slshx:1/buttons$2#");
  t.is(deferredUpdateButtonId, "slshx:1/buttons$3#");
  t.is(selectId, "slshx:1/buttons$4#");

  return () => ({
    content: `Press some buttons!`,
    components: [
      {
        type: ComponentType.ACTION_ROW,
        components: [
          {
            type: ComponentType.BUTTON,
            custom_id: newButtonId + "EXTRA_DATA",
            style: ButtonStyle.PRIMARY,
            label: "New Message",
          },
          {
            type: ComponentType.BUTTON,
            custom_id: updateButtonId,
            style: ButtonStyle.SECONDARY,
            label: "Update Message",
          },
          {
            type: ComponentType.BUTTON,
            custom_id: deferredNewButtonId,
            style: ButtonStyle.SUCCESS,
            label: "Deferred New Message",
          },
          {
            type: ComponentType.BUTTON,
            custom_id: deferredUpdateButtonId,
            style: ButtonStyle.DANGER,
            label: "Deferred Update Message",
          },
          {
            type: ComponentType.BUTTON,
            style: ButtonStyle.LINK,
            url: "https://miniflare.dev",
            label: "Miniflare",
          },
        ],
      },
      {
        type: ComponentType.ACTION_ROW,
        components: [
          {
            type: ComponentType.SELECT_MENU,
            custom_id: selectId,
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
  });
}

function modals(): CommandHandler {
  useDescription("Modals!");
  const [shortId, shortValue] = useInput();
  const [longId, longValue] = useInput();
  const modalId = useModal<Env>((interaction, env, ctx) => {
    // Check values are correct, with EXTRA_DATA added by us
    t.is(interaction.data!.custom_id, "slshx:1/modals$2#EXTRA_DATA");
    t.is(env.KEY, "value");
    t.is(typeof ctx.waitUntil, "function");
    return { content: `Short: "${shortValue}" Long: "${longValue}"` };
  });

  // Check IDs always correct, when recording and handling interactions
  // (1 = ApplicationCommandType.CHAT_INPUT)
  t.is(shortId, "slshx:1/modals$0#");
  t.is(longId, "slshx:1/modals$1#");
  t.is(modalId, "slshx:1/modals$2#");

  return () => {
    // Check modal values are empty by default
    t.is(shortValue, "");
    t.is(longValue, "");

    return {
      [$modal]: true,
      custom_id: modalId + "EXTRA_DATA",
      title: "Modal Title",
      components: [
        {
          type: ComponentType.ACTION_ROW,
          components: [
            {
              type: ComponentType.TEXT_INPUT,
              style: TextInputStyle.SHORT,
              custom_id: shortId,
              label: "Short",
              placeholder: "Short Place",
              min_length: 1,
              max_length: 10,
              required: true,
            },
          ],
        },
        {
          type: ComponentType.ACTION_ROW,
          components: [
            {
              type: ComponentType.TEXT_INPUT,
              style: TextInputStyle.PARAGRAPH,
              custom_id: longId,
              label: "Long",
              placeholder: "Long Placeholder",
              max_length: 1000,
            },
          ],
        },
      ],
    };
  };
}

function errors(): CommandHandler {
  useDescription("Errors!");
  useButton(() => {
    throw new Error("Button error!");
  });
  useModal(() => {
    throw new TypeError("Modal error!");
  });
  return () => {
    throw "Error-ish!";
  };
}

function userCommand(): UserCommandHandler {
  const buttonId = useButton((interaction) => {
    t.is(interaction.data.custom_id, "slshx:2/User Command$0#");
    return { [$update]: true, content: "User update button clicked" };
  });
  t.is(buttonId, "slshx:2/User Command$0#"); // 2 = ApplicationCommandType.USER
  return (interaction, env, ctx, user) => {
    const targetId = interaction.data.target_id;
    t.is(user.id, targetId);
    return { content: `User: ${user.username} (${targetId})` };
  };
}

function messageCommand(): MessageCommandHandler {
  useDefaultPermission(false);
  const buttonId = useButton((interaction) => {
    t.is(interaction.data.custom_id, "slshx:3/Message Command$0#");
    return { [$update]: true, content: "Message update button clicked" };
  });
  t.is(buttonId, "slshx:3/Message Command$0#"); // 3 = ApplicationCommandType.MESSAGE
  return (interaction, env, ctx, message) => {
    const targetId = interaction.data.target_id;
    t.is(message.id, targetId);
    return { content: `Message: ${message.content} (${targetId})` };
  };
}

const handler = createHandler({
  applicationId: "app_id",
  applicationPublicKey: TEST_SLSHX_PUBLIC_KEY,
  applicationSecret: "secret",
  // TEST_SLSHX_GUILD_ID will only be defined when we want to test auto-deploy
  // @ts-expect-error globalThis isn't updated with custom globals
  testServerId: globalThis.TEST_SLSHX_GUILD_ID,
  commands: {
    add,
    group1: { sub },
    group2: { subgroup: { mul } },
    all,
    choices,
    files,
    autocomplete,
    buttons,
    modals,
    errors,
  },
  userCommands: { "User Command": userCommand },
  messageCommands: { "Message Command": messageCommand },
});

// noinspection JSUnusedGlobalSymbols
export default { fetch: handler };
