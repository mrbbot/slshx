import type {
  APIApplicationCommandInteractionDataBasicOption,
  APIApplicationCommandOption,
  APIInteractionDataResolved,
  LocalizationMap,
} from "discord-api-types/v9";
import { AutocompleteHandler } from "./hooks";
import { ComponentHandler, ModalHandler } from "./types";

interface State {
  // Command currently being handled
  commandId?: string;

  // Recorded command for deployment
  recordingOptions?: APIApplicationCommandOption[];
  recordingDescription: string;
  recordingDescriptionLocalizations?: LocalizationMap;
  recordingNameLocalizations?: LocalizationMap;

  recordingDefaultPermission?: boolean;
  recordingDMPermission?: boolean;

  // Incoming interaction data
  interactionOptions?: Map<
    string,
    APIApplicationCommandInteractionDataBasicOption
  >; // name -> value
  interactionResolved?: APIInteractionDataResolved;
  interactionComponentData?: Map<string, string>; // custom_id -> data

  // Component interaction and modal submit handlers
  componentHandlerCount: number;
  componentHandlers?: Map<string, ComponentHandler>;
  modalHandlers?: Map<string, ModalHandler>;

  // Option autocomplete handlers
  autocompleteHandlers?: Map<
    string,
    AutocompleteHandler<string | number, unknown>
  >;
}

export const STATE: State = {
  recordingDescription: "",
  componentHandlerCount: 0,
};
