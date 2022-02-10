import type {
  APIApplicationCommandInteractionDataBasicOption,
  APIChatInputApplicationCommandInteractionDataResolved,
} from "discord-api-types/v9";
import { AutocompleteHandler } from "./hooks";
import { STATE } from "./state";
import { AnyCommand, AnyCommandHandler, ComponentHandler } from "./types";

export function instantiateCommandHandler<Env>(
  commandId: string,
  command: AnyCommand<Env>,
  options?: Map<string, APIApplicationCommandInteractionDataBasicOption>,
  resolved?: APIChatInputApplicationCommandInteractionDataResolved
): AnyCommandHandler<Env> {
  STATE.commandId = commandId;
  STATE.interactionOptions = options;
  STATE.interactionResolved = resolved;
  STATE.componentHandlerCount = 0;
  try {
    // Populate option values from hooks
    return command();
  } finally {
    STATE.commandId = undefined;
    STATE.interactionOptions = undefined;
    STATE.interactionResolved = undefined;
  }
}

export function instantiateComponentHandler<Env>(
  commandId: string,
  command: AnyCommand<Env>,
  customId: string
): ComponentHandler<Env> | undefined {
  STATE.commandId = commandId;
  STATE.componentHandlers = new Map();
  STATE.componentHandlerCount = 0;
  try {
    // Record all component handlers
    command();

    // Find the correct component handler, allowing users to add custom state
    // after our custom ID
    customId = customId.substring(0, customId.indexOf("#") + 1);
    return STATE.componentHandlers.get(customId);
  } finally {
    STATE.commandId = undefined;
    STATE.componentHandlers = undefined;
  }
}

export function instantiateAutocompleteHandler<Env>(
  commandId: string,
  command: AnyCommand<Env>,
  options?: Map<string, APIApplicationCommandInteractionDataBasicOption>
): AutocompleteHandler<string | number, Env> | undefined {
  STATE.commandId = commandId;
  STATE.interactionOptions = options;
  STATE.componentHandlerCount = 0;
  STATE.autocompleteHandlers = new Map();
  try {
    // Record all autocomplete handlers
    command();

    // Find the correct autocomplete handler for the focused option
    if (!options) return;
    for (const [name, option] of options) {
      // @ts-expect-error option always defined, focused will just be undefined
      if (option.focused) return STATE.autocompleteHandlers.get(name);
    }
  } finally {
    STATE.commandId = undefined;
    STATE.interactionOptions = undefined;
    STATE.autocompleteHandlers = undefined;
  }
}
