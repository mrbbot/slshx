import type {
  APIApplicationCommandInteractionDataBasicOption,
  APIApplicationCommandOption,
  APIChatInputApplicationCommandInteractionDataResolved,
} from "discord-api-types/v9";
import { AutocompleteHandler } from "./hooks";
import { ComponentHandler } from "./types";

interface State {
  commandId?: string;

  recordingOptions?: APIApplicationCommandOption[];
  recordingDescription: string;
  recordingDefaultPermission?: boolean;

  interactionOptions?: Map<
    string,
    APIApplicationCommandInteractionDataBasicOption
  >;
  interactionResolved?: APIChatInputApplicationCommandInteractionDataResolved;

  componentHandlers?: Map<string, ComponentHandler>;
  componentHandlerCount: number;

  autocompleteHandlers?: Map<
    string,
    AutocompleteHandler<string | number, unknown>
  >;
}

export const STATE: State = {
  recordingDescription: "",
  componentHandlerCount: 0,
};
