import { InteractionType } from "./api";
import { CommandResponse, deployCommands } from "./commands";
import { hexDecode } from "./helpers";
import {
  handleApplicationCommandInteraction,
  handleAutocompleteInteraction,
  handleMessageComponentInteraction,
  handleModalSubmitInteraction,
  handlePingInteraction,
  transformResponse,
  validateInteraction,
} from "./interactions";
import { handleLanding } from "./landing";
import { HandlerOptions, Options } from "./options";

export function transformError(error?: Error): CommandResponse {
  const title = `🚨  ${error?.name ?? "Error"}`;
  let description = `${error?.message ?? error}`;
  if (error?.stack) description += `\n\`\`\`${error.stack}\`\`\``;
  return {
    embeds: [
      {
        title,
        description,
        color: 0xfc484a,
        footer: { text: "Errors are only returned during development" },
      },
    ],
  };
}

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
    const int = await validateInteraction(publicKeyData, request);
    if (!int) return new Response("Unauthorized", { status: 401 });

    try {
      if (int.type === InteractionType.APPLICATION_COMMAND) {
        return await handleApplicationCommandInteraction(int, hopts, env, ctx);
      } else if (int.type === InteractionType.MESSAGE_COMPONENT) {
        return await handleMessageComponentInteraction(int, hopts, env, ctx);
      } else if (int.type === InteractionType.MODAL_SUBMIT) {
        return await handleModalSubmitInteraction(int, hopts, env, ctx);
      }
    } catch (e: any) {
      // @ts-expect-error globalThis isn't updated with custom globals
      if (globalThis.MINIFLARE) {
        return transformResponse(int, hopts, ctx, transformError(e));
      }
      throw e;
    }

    if (int.type === InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE) {
      return handleAutocompleteInteraction(int, hopts, env, ctx);
    } else if (int.type === InteractionType.PING) {
      return handlePingInteraction();
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
