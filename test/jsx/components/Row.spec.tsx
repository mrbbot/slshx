import test from "ava";
import type { APIActionRowComponent } from "discord-api-types/v9";
import {
  $actionRow,
  $actionRowChild,
  Button,
  ButtonStyle,
  ComponentType,
  Row,
  createElement,
} from "../../../src";

test("creates action row component", (t) => {
  const row: APIActionRowComponent = (
    <Row>
      <Button id="1" />
      {[<Button id="2" />, [<Button id="3" />]]}
    </Row>
  );
  const btn = {
    [$actionRowChild]: true,
    type: ComponentType.BUTTON,
    style: ButtonStyle.SECONDARY,
    emoji: undefined,
    disabled: undefined,
    label: undefined,
  };
  t.deepEqual(row, {
    [$actionRow]: true,
    type: ComponentType.ACTION_ROW,
    components: [
      // Flattened
      { ...btn, custom_id: "1" },
      { ...btn, custom_id: "2" },
      { ...btn, custom_id: "3" },
    ],
  });
});
