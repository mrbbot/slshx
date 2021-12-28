import type {
  APIInteractionResponseChannelMessageWithSource,
  APIInteractionResponseDeferredChannelMessageWithSource,
  APIInteractionResponseDeferredMessageUpdate,
  APIInteractionResponseUpdateMessage,
  APIMessageComponentInteraction,
} from "discord-api-types/v9";
import {
  ApplicationCommandType,
  InteractionResponseType,
  createFollowupMessage,
  editOriginalInteractionResponse,
} from "../api";
import {
  $update,
  ChatInputCommands,
  MessageCommand,
  UserCommand,
  instantiateComponentHandler,
} from "../commands";
import {
  PREFIX,
  ValueOf,
  extractAttachments,
  isGenerator,
  jsonResponse,
} from "../helpers";
import { HandlerOptions } from "../options";

export async function handleMessageComponentInteraction<Env>(
  interaction: APIMessageComponentInteraction,
  opts: HandlerOptions<Env>,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  const customId = interaction.data.custom_id;
  // See src/commands/types.ts for an explanation of command IDs
  const commandId = customId.substring(0, customId.indexOf("$"));
  const locator = commandId.substring(PREFIX.length + 1);
  const parts = locator.split("/");
  const type = parseInt(parts.shift()!);
  let command:
    | ValueOf<ChatInputCommands<Env>>
    | UserCommand<Env>
    | MessageCommand<Env>
    | undefined;
  if (type === ApplicationCommandType.CHAT_INPUT) {
    command = opts.commands?.[parts.shift()!];
    let part: string | undefined;
    while (typeof command === "object" && (part = parts.shift())) {
      command = command[part];
    }
  } else {
    command = (
      type === ApplicationCommandType.USER
        ? opts.userCommands
        : opts.messageCommands
    )?.[parts[0]];
  }

  if (typeof command !== "function") {
    return new Response("Command Not Found", { status: 404 });
  }

  const handler = instantiateComponentHandler(
    commandId,
    command as any,
    customId
  );
  if (!handler) {
    return new Response("Component Not Found", { status: 404 });
  }

  let res = await handler(interaction, env, ctx);
  if (isGenerator(res)) {
    const yieldRes = await res.next();
    if (!yieldRes.done) {
      // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE | DEFERRED_UPDATE_MESSAGE
      const update = yieldRes.value === $update;
      const resType = update
        ? InteractionResponseType.DEFERRED_MESSAGE_UPDATE
        : InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE;

      const deferredPromise = Promise.resolve(res.next()).then((res) => {
        if (!res.done) throw new Error("Response can only be deferred once");
        return (
          update ? editOriginalInteractionResponse : createFollowupMessage
        )(opts.applicationId, interaction.token, res.value);
      });
      ctx.waitUntil(deferredPromise);

      return jsonResponse<
        | APIInteractionResponseDeferredChannelMessageWithSource
        | APIInteractionResponseDeferredMessageUpdate
      >({ type: resType });
    }
    // If we never yielded in the generator, treat as a normal function call
    res = yieldRes.value;
  }

  // CHANNEL_MESSAGE_WITH_SOURCE | UPDATE_MESSAGE
  const [newBody, formData] = extractAttachments(res);
  const resType = res[$update]
    ? InteractionResponseType.UPDATE_MESSAGE
    : InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE;
  return jsonResponse<
    | APIInteractionResponseChannelMessageWithSource
    | APIInteractionResponseUpdateMessage
  >({ type: resType, data: newBody }, formData);
}
