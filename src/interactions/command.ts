import type { APIApplicationCommandAutocompleteInteraction } from "discord-api-types/payloads/v9/_interactions/autocomplete";
import type {
  APIApplicationCommandInteraction,
  APIApplicationCommandInteractionDataOption,
  APIApplicationCommandInteractionDataOptionWithValues,
  APIChatInputApplicationCommandInteractionDataResolved,
  APIInteractionResponseChannelMessageWithSource,
  APIInteractionResponseDeferredChannelMessageWithSource,
  APIMessage,
  APIUser,
} from "discord-api-types/v9";
import {
  ApplicationCommandType,
  InteractionResponseType,
  createFollowupMessage,
} from "../api";
import {
  AnyCommand,
  ChatInputCommands,
  CommandResponse,
  instantiateCommandHandler,
} from "../commands";
import {
  PREFIX,
  ValueOf,
  extractAttachments,
  isGenerator,
  jsonResponse,
} from "../helpers";
import { HandlerOptions } from "../options";

export function matchCommand<Env>(
  interaction:
    | APIApplicationCommandInteraction
    | APIApplicationCommandAutocompleteInteraction,
  opts: HandlerOptions<Env>
): [
  commandId: string,
  command?: AnyCommand<Env>,
  options?: Map<string, APIApplicationCommandInteractionDataOptionWithValues>
] {
  if (!interaction.data) return ["", undefined, undefined];
  const type = interaction.data.type;
  let data: {
    name: string;
    options?: APIApplicationCommandInteractionDataOption[];
  } = interaction.data;

  // See src/commands/types.ts for an explanation of command IDs
  let id = `${PREFIX}:${type}/${data.name}`;
  let command: AnyCommand<Env> | undefined;
  if (type === ApplicationCommandType.CHAT_INPUT) {
    let cursor: ValueOf<ChatInputCommands<Env>> | undefined;
    let group = opts.commands;
    while ((cursor = group?.[data.name])) {
      if (typeof cursor === "function") {
        command = cursor;
        break;
      }
      group = cursor;
      data = data.options![0];
      id += `/${data.name}`;
    }
  } else {
    command = (
      type === ApplicationCommandType.USER
        ? opts.userCommands
        : opts.messageCommands
    )?.[data.name];
  }

  let options:
    | Map<string, APIApplicationCommandInteractionDataOptionWithValues>
    | undefined;
  if (command && data.options) {
    options = new Map();
    for (const option of data.options) {
      options.set(option.name, option as any);
    }
  }

  return [id, command, options];
}

export async function handleApplicationCommandInteraction<Env>(
  interaction: APIApplicationCommandInteraction,
  opts: HandlerOptions<Env>,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  const [commandId, command, options] = matchCommand(interaction, opts);
  if (!command) {
    return new Response("Command Not Found", { status: 404 });
  }

  const resolved = interaction.data.resolved;
  const handler = instantiateCommandHandler(
    commandId,
    command,
    options,
    resolved as APIChatInputApplicationCommandInteractionDataResolved
  );

  let target: APIUser | APIMessage | undefined;
  if ("target_id" in interaction.data) {
    if (interaction.data.type === ApplicationCommandType.USER) {
      target = interaction.data.resolved.users[interaction.data.target_id];
    } else if (interaction.data.type === ApplicationCommandType.MESSAGE) {
      target = interaction.data.resolved.messages[interaction.data.target_id];
    }
  }

  // `target` will just be `undefined` for chat input commands so doesn't matter
  // if we pass it as the final argument
  let res = await ((handler as any)(
    interaction,
    env,
    ctx,
    target
  ) as CommandResponse);

  if (isGenerator(res)) {
    const yieldRes = await res.next();
    if (!yieldRes.done) {
      // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
      const deferredPromise = Promise.resolve(res.next()).then((res) => {
        if (!res.done) throw new Error("Response can only be deferred once");
        return createFollowupMessage(
          opts.applicationId,
          interaction.token,
          res.value
        );
      });
      ctx.waitUntil(deferredPromise);
      return jsonResponse<APIInteractionResponseDeferredChannelMessageWithSource>(
        { type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE }
      );
    }
    // If we never yielded in the generator, treat as a normal function call
    res = yieldRes.value;
  }

  // CHANNEL_MESSAGE_WITH_SOURCE
  const [newBody, formData] = extractAttachments(res);
  return jsonResponse<APIInteractionResponseChannelMessageWithSource>(
    {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: newBody,
    },
    formData
  );
}
