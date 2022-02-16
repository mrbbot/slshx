import type {
  APIApplicationCommandInteraction,
  APIChatInputApplicationCommandInteractionDataResolved,
  APIMessage,
  APIUser,
} from "discord-api-types/v9";
import { ApplicationCommandType } from "../api";
import { instantiateCommandHandler } from "../commands";
import { HandlerOptions } from "../options";
import { matchCommand } from "./matchers";
import { transformResponse } from "./response";

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

  // Extract targeted user or message for context menu commands
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
  const res = handler(interaction as any, env, ctx, target as any);
  return transformResponse(interaction, opts, ctx, res);
}
