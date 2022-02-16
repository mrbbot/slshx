import { InteractionType } from "./api";
import { deployCommands } from "./commands";
import { hexDecode } from "./helpers";
import {
  handleApplicationCommandInteraction,
  handleAutocompleteInteraction,
  handleMessageComponentInteraction,
  handleModalSubmitInteraction,
  handlePingInteraction,
  validateInteraction,
} from "./interactions";
import { handleLanding } from "./landing";
import { HandlerOptions, Options } from "./options";

export function createHandler<Env>(opts: Options<Env>) {
  const publicKeyData =
    opts.applicationPublicKey && hexDecode(opts.applicationPublicKey);

  // @ts-expect-error globalThis isn't updated with custom globals
  // Auto-deploy commands to a test guild if we're running in Miniflare.
  // `void`ing this, unhandled promise rejections get logged in Miniflare now :)
  if (globalThis.MINIFLARE && opts.testServerId) void deployCommands(opts);

  return async function (request: Request, env: Env, ctx: ExecutionContext) {
    // @ts-expect-error globalThis isn't updated with custom globals
    if (globalThis.MINIFLARE) {
      const res = await handleLanding(opts, request);
      if (res) return res;
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    if (!opts.applicationId || !publicKeyData) {
      throw new Error(
        "Handler requires applicationId and applicationPublicKey to be set"
      );
    }
    const hopts = opts as HandlerOptions<Env>;
    const interaction = await validateInteraction(publicKeyData, request);
    if (!interaction) return new Response("Unauthorized", { status: 401 });

    if (interaction.type === InteractionType.PING) {
      return handlePingInteraction();
    } else if (interaction.type === InteractionType.APPLICATION_COMMAND) {
      return handleApplicationCommandInteraction(interaction, hopts, env, ctx);
    } else if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
      return handleMessageComponentInteraction(interaction, hopts, env, ctx);
    } else if (
      interaction.type === InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE
    ) {
      return handleAutocompleteInteraction(interaction, hopts, env, ctx);
    } else if (interaction.type === InteractionType.MODAL_SUBMIT) {
      return handleModalSubmitInteraction(interaction, hopts, env, ctx);
    }

    return new Response("Bad Request", { status: 400 });
  };
}

export * from "./api";
export * from "./commands/deploy";
export * from "./commands/hooks";
export * from "./commands/types";
export * from "./jsx";
export type {
  Awaitable,
  AwaitableGenerator,
  ValueOf,
  WithFileAttachments,
} from "./helpers";
export * from "./landing";
export type { Options } from "./options";
