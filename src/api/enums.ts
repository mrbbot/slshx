// discord-api-types includes these, but they're declared as ambient const
// enums, which can't be accessed with the `--isolatedModules` flag.
//
// We're using const's as opposed to enums as they still type check with
// discord-api-types' enums, and they're easier to tree shake.

/** @see https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-types */
export const ApplicationCommandType = {
  CHAT_INPUT: 1,
  USER: 2,
  MESSAGE: 3,
} as const;

/** @see https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-type */
export const ApplicationCommandOptionType = {
  SUB_COMMAND: 1,
  SUB_COMMAND_GROUP: 2,
  STRING: 3,
  INTEGER: 4,
  BOOLEAN: 5,
  USER: 6,
  CHANNEL: 7,
  ROLE: 8,
  MENTIONABLE: 9,
  NUMBER: 10,
  ATTACHMENT: 11,
} as const;

/** @see https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object-interaction-type */
export const InteractionType = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  MESSAGE_COMPONENT: 3,
  APPLICATION_COMMAND_AUTOCOMPLETE: 4,
  MODAL_SUBMIT: 5,
} as const;

/** @see https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-response-object-interaction-callback-type */
export const InteractionResponseType = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
  DEFERRED_MESSAGE_UPDATE: 6,
  UPDATE_MESSAGE: 7,
  APPLICATION_COMMAND_AUTOCOMPLETE_RESULT: 8,
  MODAL: 9,
} as const;

/** @see https://discord.com/developers/docs/resources/channel#channel-object-channel-types */
export const ChannelType = {
  GUILD_TEXT: 0,
  DM: 1,
  GUILD_VOICE: 2,
  GROUP_DM: 3,
  GUILD_CATEGORY: 4,
  GUILD_NEWS: 5,
  GUILD_STORE: 6,
  GUILD_NEWS_THREAD: 10,
  GUILD_PUBLIC_THREAD: 11,
  GUILD_PRIVATE_THREAD: 12,
  GUILD_STAGE_VOICE: 13,
} as const;

/** @see https://discord.com/developers/docs/interactions/message-components#component-object-component-types */
export const ComponentType = {
  ACTION_ROW: 1,
  BUTTON: 2,
  SELECT_MENU: 3,
  TEXT_INPUT: 4,
} as const;

/** @see https://discord.com/developers/docs/interactions/message-components#button-object-button-styles */
export const ButtonStyle = {
  PRIMARY: 1,
  SECONDARY: 2,
  SUCCESS: 3,
  DANGER: 4,
  LINK: 5,
} as const;

/** @see https://discord.com/developers/docs/interactions/message-components#text-inputs-text-input-styles */
export const TextInputStyle = {
  SHORT: 1,
  PARAGRAPH: 2,
} as const;

/** @see https://discord.com/developers/docs/resources/channel#allowed-mentions-object-allowed-mention-types */
export const AllowedMentionsTypes = {
  ROLES: "roles",
  USERS: "users",
  EVERYONE: "everyone",
} as const;
