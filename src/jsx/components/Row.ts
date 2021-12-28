import type {
  APIActionRowComponent,
  APIMessageComponent,
} from "discord-api-types/v9";
import { ComponentType } from "../../api";

export const $actionRow = /* @__PURE__ */ Symbol("$actionRow");
export const $actionRowChild = /* @__PURE__ */ Symbol("$actionRowChild");

export interface RowProps {
  children?: Exclude<APIMessageComponent, APIActionRowComponent>[];
}

export function Row(
  props: RowProps
): APIActionRowComponent & { [$actionRow]: true } {
  return {
    [$actionRow]: true,
    type: ComponentType.ACTION_ROW,
    components: props.children?.flat(Infinity) ?? [],
  };
}
