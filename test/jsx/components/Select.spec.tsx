import test from "ava";
import type {
  APIMessageComponentEmoji,
  APISelectMenuComponent,
} from "discord-api-types/v9";
import {
  $actionRowChild,
  ComponentType,
  Option,
  Select,
  createElement,
} from "../../../src";

test("creates select menu component", (t) => {
  const u = undefined;
  let select: APISelectMenuComponent = (
    <Select id="custom_id">
      {Array.from(Array(3)).map((_, i) => (
        <Option value={i.toString()}>Option {i + 1}</Option>
      ))}
    </Select>
  );
  t.deepEqual(select, {
    [$actionRowChild]: true,
    type: ComponentType.SELECT_MENU,
    custom_id: "custom_id",
    placeholder: u,
    min_values: u,
    max_values: u,
    disabled: u,
    options: [
      { value: "0", description: u, emoji: u, default: u, label: "Option 1" },
      { value: "1", description: u, emoji: u, default: u, label: "Option 2" },
      { value: "2", description: u, emoji: u, default: u, label: "Option 3" },
    ],
  });

  const emoji: APIMessageComponentEmoji = { id: "emoji_id" };
  select = (
    <Select id="id" placeholder="thingy" min={1} max={3} disabled>
      <Option value="1" description="Opt. 1 Description" emoji={emoji} default>
        a{[1, ["b", [2]]]}
      </Option>
      {[
        <Option value="2" emoji="🙂">
          Opt. 2
        </Option>,
        [<Option value="3">Opt. 3</Option>],
      ]}
    </Select>
  );
  t.deepEqual(select, {
    [$actionRowChild]: true,
    type: ComponentType.SELECT_MENU,
    custom_id: "id",
    placeholder: "thingy",
    min_values: 1,
    max_values: 3,
    disabled: true,
    options: [
      // Flattened
      {
        value: "1",
        description: "Opt. 1 Description",
        default: true,
        label: "a1b2",
        emoji,
      },
      {
        value: "2",
        description: u,
        default: u,
        label: "Opt. 2",
        emoji: { name: "🙂" },
      },
      { value: "3", description: u, emoji: u, default: u, label: "Opt. 3" },
    ],
  });
});
