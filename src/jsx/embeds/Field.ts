import type { APIEmbedField } from "discord-api-types/v10";
import { Child, childrenContent } from "../helpers";

export const $field = /* @__PURE__ */ Symbol("$field");

export interface FieldProps {
  name: string;
  inline?: boolean;
  children?: Child[]; // For value
}

export function Field(props: FieldProps): APIEmbedField & { [$field]: true } {
  return {
    [$field]: true,
    name: props.name,
    value: childrenContent(props.children) ?? "",
    inline: props.inline,
  };
}
