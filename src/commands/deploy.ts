import {
  APIBearerAuth,
  bulkOverwriteGlobalApplicationCommands,
  bulkOverwriteGuildApplicationCommands,
  getBearerAuth,
} from "../api";
import { log } from "../helpers";
import { Options } from "../options";
import { recordCommands } from "./recorders";

const CACHE: {
  jsonCommands?: string;
  bearerAuth?: APIBearerAuth;
  // @ts-expect-error globalThis isn't updated with custom globals
  // If we're running in Miniflare, we want this cache to persist between
  // reloads, so store it on something obscure (BigInt64Array) that gets passed
  // in directly from Node.
} = globalThis.MINIFLARE ? ((BigInt64Array as any).$SLSHXCACHE ??= {}) : {};

export async function deployCommands<Env>(opts: Options<Env>) {
  if (!opts.applicationId || !opts.applicationSecret) {
    throw new Error(
      "Deploying requires applicationId and applicationSecret to be set"
    );
  }
  log("Building and deploying commands...");

  const commands = recordCommands(opts);

  if (
    !CACHE.bearerAuth?.expires ||
    CACHE.bearerAuth.expires - 30_000 < Date.now()
  ) {
    log("Refreshing access token...");
    CACHE.bearerAuth = await getBearerAuth(
      opts.applicationId,
      opts.applicationSecret
    );
  }

  const s = commands.length === 1 ? "" : "s";
  if (opts.testServerId) {
    // Only check commands different when deploying to a guild...
    // TODO: might be better if we were slightly smarter with diffing,
    //  only updated changed commands? potentially higher rate limits?
    const jsonCommands = JSON.stringify(commands);
    if (CACHE.jsonCommands === jsonCommands) {
      log(`No changes since last deploy!`);
      return;
    }

    log(
      `Deploying ${commands.length} command${s} to server ${opts.testServerId}...`
    );
    await bulkOverwriteGuildApplicationCommands(
      opts.applicationId,
      opts.testServerId,
      commands,
      CACHE.bearerAuth
    );
    log(
      `Deployed ${commands.length} command${s} to server ${opts.testServerId}!`
    );

    // Only update cache if deploy succeeded
    CACHE.jsonCommands = jsonCommands;
  } else {
    // ...always deploy globally
    log(`Deploying ${commands.length} command${s} globally...`);
    await bulkOverwriteGlobalApplicationCommands(
      opts.applicationId,
      commands,
      CACHE.bearerAuth
    );
    log(`Deployed ${commands.length} command${s} globally!`);
  }
}
