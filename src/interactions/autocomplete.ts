import type { APIApplicationCommandAutocompleteInteraction } from "discord-api-types/payloads/v10/_interactions/autocomplete";
import type { APIApplicationCommandAutocompleteResponse } from "discord-api-types/v10";
import { InteractionResponseType } from "../api";
import { instantiateAutocompleteHandler, normaliseChoices } from "../commands";
import { jsonResponse } from "../helpers";
import { HandlerOptions } from "../options";
import { matchCommand } from "./matchers";

export async function handleAutocompleteInteraction<Env>(
  interaction: APIApplicationCommandAutocompleteInteraction,
  opts: HandlerOptions<Env>,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  const [commandId, command, options] = matchCommand(interaction, opts);
  if (!command) {
    return new Response("Command Not Found", { status: 404 });
  }
  const handler = instantiateAutocompleteHandler(commandId, command, options);
  if (!handler) {
    return new Response("Autocomplete Not Found", { status: 404 });
  }

  const choices = normaliseChoices(await handler(interaction, env, ctx));
  return jsonResponse<APIApplicationCommandAutocompleteResponse>({
    type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
    data: { choices },
  });
}
