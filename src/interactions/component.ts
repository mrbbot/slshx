import type { APIMessageComponentInteraction } from "discord-api-types/v10";
import { instantiateComponentHandler } from "../commands";
import { HandlerOptions } from "../options";
import { matchCustomId } from "./matchers";
import { transformResponse } from "./response";

export async function handleMessageComponentInteraction<Env>(
  interaction: APIMessageComponentInteraction,
  opts: HandlerOptions<Env>,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  const customId = interaction.data.custom_id;
  const [commandId, command] = matchCustomId(customId, opts);
  if (typeof command !== "function") {
    return new Response("Command Not Found", { status: 404 });
  }

  const handler = instantiateComponentHandler(commandId, command, customId);
  if (!handler) {
    return new Response("Component Not Found", { status: 404 });
  }

  const res = handler(interaction, env, ctx);
  return transformResponse(interaction, opts, ctx, res);
}
