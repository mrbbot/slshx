import type { APIModalSubmitInteraction } from "discord-api-types/v10";
import { ComponentType } from "../api";
import { instantiateModalHandler } from "../commands";
import { HandlerOptions } from "../options";
import { matchCustomId } from "./matchers";
import { transformResponse } from "./response";

export async function handleModalSubmitInteraction<Env>(
  interaction: APIModalSubmitInteraction,
  opts: HandlerOptions<Env>,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  const customId = interaction.data!.custom_id;
  const [commandId, command] = matchCustomId(customId, opts);
  if (typeof command !== "function") {
    return new Response("Command Not Found", { status: 404 });
  }

  // Extract component data
  const data = new Map<string, string>();
  for (const row of interaction.data?.components ?? []) {
    if (row.type !== ComponentType.ACTION_ROW) continue;
    for (const component of row.components) {
      data.set(component.custom_id, component.value);
    }
  }

  const handler = instantiateModalHandler(commandId, command, customId, data);
  if (!handler) {
    return new Response("Modal Not Found", { status: 404 });
  }

  const res = handler(interaction, env, ctx);
  return transformResponse(interaction, opts, ctx, res);
}
