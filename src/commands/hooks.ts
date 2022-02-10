import type { APIApplicationCommandAutocompleteInteraction } from "discord-api-types/payloads/v9/_interactions/autocomplete";
import type {
  APIApplicationCommandOptionChoice,
  APIInteractionDataResolvedChannel,
  APIMessageButtonInteractionData,
  APIMessageSelectMenuInteractionData,
  APIRole,
  APIUser,
  ChannelType,
} from "discord-api-types/v9";
import { ApplicationCommandOptionType } from "../api";
import { Awaitable, ValueOf } from "../helpers";
import { STATE } from "./state";
import { ComponentHandler } from "./types";

export function useDescription(description: string): void {
  if (!STATE.commandId) {
    throw new Error(`Hooks must be called inside a command`);
  }
  if (STATE.recordingOptions) {
    STATE.recordingDescription = description;
  }
}

export function useDefaultPermission(permission: boolean): void {
  if (!STATE.commandId) {
    throw new Error(`Hooks must be called inside a command`);
  }
  if (STATE.recordingOptions) {
    STATE.recordingDefaultPermission = permission;
  }
}

// ========================================================================================================
// | Message Component Hooks:                                                                             |
// | https://discord.com/developers/docs/interactions/message-components#component-object-component-types |
// ========================================================================================================

function useComponent<Env>(handler: ComponentHandler<Env>): string {
  if (!STATE.commandId) {
    throw new Error(`Hooks must be called inside a command`);
  }
  const customId = `${STATE.commandId}$${STATE.componentHandlerCount++}#`;
  if (STATE.componentHandlers) {
    STATE.componentHandlers.set(customId, handler as any);
  }
  return customId;
}

export function useButton<Env>(
  handler: ComponentHandler<Env, APIMessageButtonInteractionData>
) {
  return useComponent(handler as any);
}

export function useSelectMenu<Env>(
  handler: ComponentHandler<Env, APIMessageSelectMenuInteractionData>
) {
  return useComponent(handler as any);
}

// ====================================================================================================================================
// | Option Hooks:                                                                                                                    |
// | https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-type |
// ====================================================================================================================================

export type Choice<T> = T | { name?: string; value: T };
export type ChoiceValue<Choice> = Choice extends { value: unknown }
  ? Choice["value"]
  : Choice;

function normaliseChoice<T extends string | number>(
  choice: Choice<T>
): APIApplicationCommandOptionChoice {
  if (typeof choice === "object" && "value" in choice) {
    return { name: choice.name ?? String(choice.value), value: choice.value };
  }
  const name = String(choice);
  return { name, value: typeof choice === "number" ? choice : name };
}

export function normaliseChoices<T extends string | number>(
  choices?: ReadonlyArray<Choice<T>>
): APIApplicationCommandOptionChoice[] | undefined {
  return choices?.map(normaliseChoice);
}

export type AutocompleteHandler<T, Env> = (
  interaction: APIApplicationCommandAutocompleteInteraction,
  env: Env,
  ctx: ExecutionContext
) => Awaitable<Choice<T>[]>;

export interface OptionalOption<T, Env> {
  required?: false;
  autocomplete?: AutocompleteHandler<T, Env>;
}
export interface RequiredOption<T, Env> {
  required: true;
  autocomplete?: AutocompleteHandler<T, Env>;
}

export interface OptionalChoicesOption<
  Choices extends ReadonlyArray<Choice<string | number>>
> {
  required?: false;
  choices: Choices;
}
export interface RequiredChoicesOption<
  Choices extends ReadonlyArray<Choice<string | number>>
> {
  required: true;
  choices: Choices;
}

export interface NumericOption {
  min?: number;
  max?: number;
}
export interface ChannelOption {
  types?: ChannelType[];
}

type CombinedOption<T, Env> = {
  required?: boolean;
  autocomplete?: AutocompleteHandler<T, Env>;
  choices?: ReadonlyArray<Choice<T>>;
} & NumericOption &
  ChannelOption;

function useOption<T, Env>(
  type: ValueOf<typeof ApplicationCommandOptionType>,
  empty: T,
  name: string,
  description: string,
  options?: CombinedOption<T, Env>
): T | null {
  if (!STATE.commandId) {
    throw new Error(`Hooks must be called inside a command`);
  }
  if (STATE.autocompleteHandlers && options?.autocomplete) {
    STATE.autocompleteHandlers.set(name, options.autocomplete as any);
  }

  // Build a default value that satisfies the required return type, when
  // recording, or if the user hasn't yet provided a value for this option
  const def = options?.required
    ? options.choices?.length
      ? (normaliseChoice(options.choices[0] as any).value as unknown as T)
      : empty
    : null; // If not required, we can just use null :)

  if (STATE.interactionOptions) {
    return (STATE.interactionOptions.get(name)?.value as unknown as T) ?? def;
  }
  if (STATE.recordingOptions) {
    STATE.recordingOptions.push({
      type: type as number,
      name,
      description,
      required: options?.required,
      autocomplete: options?.autocomplete && true,
      choices: normaliseChoices(options?.choices as any),
      channel_types: options?.types as any,
      min_value: options?.min,
      max_value: options?.max,
    });
  }
  return def;
}

export function useString<Env>(
  name: string,
  description: string,
  options?: OptionalOption<string, Env>
): string | null;
export function useString<Env>(
  name: string,
  description: string,
  options: RequiredOption<string, Env>
): string;
export function useString<Choices extends ReadonlyArray<Choice<string>>>(
  name: string,
  description: string,
  options: OptionalChoicesOption<Choices>
): ChoiceValue<Choices[number]> | null;
export function useString<Choices extends ReadonlyArray<Choice<string>>>(
  name: string,
  description: string,
  options: RequiredChoicesOption<Choices>
): ChoiceValue<Choices[number]>;
export function useString<Env>(
  name: string,
  description: string,
  options?: CombinedOption<string, Env>
): string | null {
  return useOption(
    ApplicationCommandOptionType.STRING,
    "",
    name,
    description,
    options
  );
}

export function useInteger<Env>(
  name: string,
  description: string,
  options?: OptionalOption<number, Env> & NumericOption
): number | null;
export function useInteger<Env>(
  name: string,
  description: string,
  options: RequiredOption<number, Env> & NumericOption
): number;
export function useInteger<Choices extends ReadonlyArray<Choice<number>>>(
  name: string,
  description: string,
  options: OptionalChoicesOption<Choices>
): ChoiceValue<Choices[number]> | null;
export function useInteger<Choices extends ReadonlyArray<Choice<number>>>(
  name: string,
  description: string,
  options: RequiredChoicesOption<Choices>
): ChoiceValue<Choices[number]>;
export function useInteger<Env>(
  name: string,
  description: string,
  options?: CombinedOption<number, Env>
): number | null {
  return useOption(
    ApplicationCommandOptionType.INTEGER,
    0,
    name,
    description,
    options
  );
}

export function useBoolean<Env>(
  name: string,
  description: string,
  options?: OptionalOption<boolean, Env>
): boolean | null;
export function useBoolean<Env>(
  name: string,
  description: string,
  options: RequiredOption<boolean, Env>
): boolean;
export function useBoolean<Env>(
  name: string,
  description: string,
  options?: CombinedOption<boolean, Env>
): boolean | null {
  return useOption(
    ApplicationCommandOptionType.BOOLEAN,
    false,
    name,
    description,
    options
  );
}

export function useUser<Env>(
  name: string,
  description: string,
  options?: OptionalOption<string, Env>
): APIUser | null;
export function useUser<Env>(
  name: string,
  description: string,
  options: RequiredOption<string, Env>
): APIUser;
export function useUser<Env>(
  name: string,
  description: string,
  options?: CombinedOption<string, Env>
): APIUser | null {
  const id = useOption(
    ApplicationCommandOptionType.USER,
    "",
    name,
    description,
    options
  );
  // Autocomplete interactions may not include resolved, so return just the ID
  const fallback = id === null ? null : ({ id } as APIUser);
  return STATE.interactionResolved?.users?.[id!] ?? fallback;
}

export function useChannel<Env>(
  name: string,
  description: string,
  options?: OptionalOption<string, Env> & ChannelOption
): APIInteractionDataResolvedChannel | null;
export function useChannel<Env>(
  name: string,
  description: string,
  options: RequiredOption<string, Env> & ChannelOption
): APIInteractionDataResolvedChannel;
export function useChannel<Env>(
  name: string,
  description: string,
  options?: CombinedOption<string, Env>
): APIInteractionDataResolvedChannel | null {
  const id = useOption(
    ApplicationCommandOptionType.CHANNEL,
    "",
    name,
    description,
    options
  );
  // Autocomplete interactions may not include resolved, so return just the ID
  const fallback =
    id === null ? null : ({ id } as APIInteractionDataResolvedChannel);
  return STATE.interactionResolved?.channels?.[id!] ?? fallback;
}

export function useRole<Env>(
  name: string,
  description: string,
  options?: OptionalOption<string, Env>
): APIRole | null;
export function useRole<Env>(
  name: string,
  description: string,
  options: RequiredOption<string, Env>
): APIRole;
export function useRole<Env>(
  name: string,
  description: string,
  options?: CombinedOption<string, Env>
): APIRole | null {
  const id = useOption(
    ApplicationCommandOptionType.ROLE,
    "",
    name,
    description,
    options
  );
  // Autocomplete interactions may not include resolved, so return just the ID
  const fallback = id === null ? null : ({ id } as APIRole);
  return STATE.interactionResolved?.roles?.[id!] ?? fallback;
}

export function useMentionable<Env>(
  name: string,
  description: string,
  options?: OptionalOption<string, Env>
): APIUser | APIRole | null;
export function useMentionable<Env>(
  name: string,
  description: string,
  options: RequiredOption<string, Env>
): APIUser | APIRole;
export function useMentionable<Env>(
  name: string,
  description: string,
  options?: CombinedOption<string, Env>
): APIUser | APIRole | null {
  const id = useOption(
    ApplicationCommandOptionType.MENTIONABLE,
    "",
    name,
    description,
    options
  );
  // Autocomplete interactions may not include resolved, so return just the ID
  const fallback = id === null ? null : ({ id } as APIUser | APIRole);
  return (
    STATE.interactionResolved?.users?.[id!] ??
    STATE.interactionResolved?.roles?.[id!] ??
    fallback
  );
}

export function useNumber<Env>(
  name: string,
  description: string,
  options?: OptionalOption<number, Env> & NumericOption
): number | null;
export function useNumber<Env>(
  name: string,
  description: string,
  options: RequiredOption<number, Env> & NumericOption
): number;
export function useNumber<Choices extends ReadonlyArray<Choice<number>>>(
  name: string,
  description: string,
  options: OptionalChoicesOption<Choices>
): ChoiceValue<Choices[number]> | null;
export function useNumber<Choices extends ReadonlyArray<Choice<number>>>(
  name: string,
  description: string,
  options: RequiredChoicesOption<Choices>
): ChoiceValue<Choices[number]>;
export function useNumber<Env>(
  name: string,
  description: string,
  options?: CombinedOption<number, Env>
): number | null {
  return useOption(
    ApplicationCommandOptionType.NUMBER,
    0,
    name,
    description,
    options
  );
}
