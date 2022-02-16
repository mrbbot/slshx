import type {
  APIBaseInteraction,
  APIChatInputApplicationCommandInteraction,
  APIInteractionResponseCallbackData,
  APIMessage,
  APIMessageApplicationCommandInteraction,
  APIMessageComponentInteractionData,
  APIModalInteractionResponseCallbackData,
  APIModalSubmitInteraction,
  APIUser,
  APIUserApplicationCommandInteraction,
} from "discord-api-types/v9";
import { InteractionType } from "../api";
import { Awaitable, AwaitableGenerator, WithFileAttachments } from "../helpers";

// Each command is assigned an ID of the form:
// `slshx:{ApplicationCommandType}[/{group}][/{subgroup}]/{name}`.
// Including {ApplicationCommandType} allows chat input, user and message
// commands to share a name.
//
// Each component custom ID begins with this command ID, and has the form:
// `{commandID}${componentIndex}#`
// The user is free to add any text after the custom ID, and the correct handler
// will still be invoked.
//
// This is why ':', '/', '$' or '#' characters are not allowed in command names.

export const $update = /* @__PURE__ */ Symbol("$update");
export const $modal = /* @__PURE__ */ Symbol("$modal");

// ==== Message Responses ===

export type MessageResponse =
  WithFileAttachments<APIInteractionResponseCallbackData>;

export type ModalResponse = APIModalInteractionResponseCallbackData & {
  [$modal]: true;
};

export function isModalResponse(
  res: MessageResponse | ModalResponse
): res is ModalResponse {
  return (res as any)[$modal] === true;
}

/**
 * - For `CHANNEL_MESSAGE_WITH_SOURCE`, return `MessageResponse`
 * - For `DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE`, yield nothing, then return `MessageResponse`
 * - For `MODAL`, return `ModalResponse`
 * @see https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-response-object-interaction-callback-type
 */
export type CommandResponse =
  | Awaitable<MessageResponse | ModalResponse>
  | AwaitableGenerator<void, MessageResponse, never>;

// The `| symbol` here should be `| typeof $update` but that doesn't
// type-check correctly :(
/**
 * - For `CHANNEL_MESSAGE_WITH_SOURCE`, return `MessageResponse`
 * - For `DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE`, yield nothing, then return `MessageResponse`
 * - For `DEFERRED_UPDATE_MESSAGE`, yield `$update`, then return `MessageResponse`
 * - For `UPDATE_MESSAGE`, return `MessageResponse & { [$update]: true }`
 * @see https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-response-object-interaction-callback-type
 */
export type ComponentHandlerResponse =
  | Awaitable<(MessageResponse & { [$update]?: boolean }) | ModalResponse>
  | AwaitableGenerator<void | symbol, MessageResponse>;

// ==== Command Handlers ===

/** @see {CommandResponse} */
export type CommandHandler<Env = unknown> = (
  interaction: APIChatInputApplicationCommandInteraction,
  env: Env,
  ctx: ExecutionContext
) => CommandResponse;

export type Command<Env = unknown> = () => CommandHandler<Env>;

/** @see {CommandResponse} */
export type UserCommandHandler<Env = unknown> = (
  interaction: APIUserApplicationCommandInteraction,
  env: Env,
  ctx: ExecutionContext,
  user: APIUser
) => CommandResponse;
export type UserCommand<Env = unknown> = () => UserCommandHandler<Env>;

/** @see {CommandResponse} */
export type MessageCommandHandler<Env = unknown> = (
  interaction: APIMessageApplicationCommandInteraction,
  env: Env,
  ctx: ExecutionContext,
  message: APIMessage
) => CommandResponse;
export type MessageCommand<Env = unknown> = () => MessageCommandHandler<Env>;

export type AnyCommandHandler<Env = unknown> =
  | CommandHandler<Env>
  | UserCommandHandler<Env>
  | MessageCommandHandler<Env>;
export type AnyCommand<Env = unknown> = () => AnyCommandHandler<Env>;

// ==== Component Handlers ===

export type APIMessageComponentInteraction<Data> = APIBaseInteraction<
  typeof InteractionType.MESSAGE_COMPONENT,
  Data
> &
  Required<
    Pick<
      APIBaseInteraction<typeof InteractionType.MESSAGE_COMPONENT, Data>,
      "channel_id" | "data" | "message"
    >
  >;

/** @see {ComponentHandlerResponse}*/
export type ComponentHandler<
  Env = unknown,
  Data = APIMessageComponentInteractionData
> = (
  interaction: APIMessageComponentInteraction<Data>,
  env: Env,
  ctx: ExecutionContext
) => ComponentHandlerResponse;

/** @see {CommandResponse} */
export type ModalHandler<Env = unknown> = (
  interaction: APIModalSubmitInteraction,
  env: Env,
  ctx: ExecutionContext
) => ComponentHandlerResponse;

// === Command Options Objects ===

// Allow nesting two-levels deep
export type ChatInputCommands<Env = unknown> = Record<
  string,
  Command<Env> | Record<string, Command<Env> | Record<string, Command<Env>>>
>;

export type UserCommands<Env = unknown> = Record<string, UserCommand<Env>>;
export type MessageCommands<Env = unknown> = Record<
  string,
  MessageCommand<Env>
>;
