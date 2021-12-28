import test from "ava";
import type {
  APIButtonComponent,
  APIMessageComponentEmoji,
} from "discord-api-types/v9";
import {
  $actionRowChild,
  Button,
  ButtonStyle,
  ComponentType,
  createElement,
} from "../../../src";

const emoji: APIMessageComponentEmoji = { id: "emoji_id" };

test("creates button component with id", (t) => {
  let button: APIButtonComponent = <Button id="custom_id">Label</Button>;
  t.deepEqual(button, {
    [$actionRowChild]: true,
    type: ComponentType.BUTTON,
    custom_id: "custom_id",
    emoji: undefined,
    disabled: undefined,
    label: "Label",
    style: ButtonStyle.SECONDARY,
  });

  button = (
    <Button id="id" disabled emoji={emoji}>
      a{[1, ["b", [2]]]}
    </Button>
  );
  t.deepEqual(button, {
    [$actionRowChild]: true,
    type: ComponentType.BUTTON,
    custom_id: "id",
    emoji,
    disabled: true,
    label: "a1b2",
    style: ButtonStyle.SECONDARY,
  });

  // Check all button styles
  button = <Button id="custom_id" primary />;
  t.is(button.style, ButtonStyle.PRIMARY);
  t.is(button.label, undefined);
  button = <Button id="custom_id" success />;
  t.is(button.style, ButtonStyle.SUCCESS);
  button = <Button id="custom_id" danger />;
  t.is(button.style, ButtonStyle.DANGER);

  // Check implicit string emoji conversion
  button = <Button id="custom_id" emoji="🙂" />;
  t.deepEqual(button.emoji, { name: "🙂" });
});

test("creates button component with url", (t) => {
  let button: APIButtonComponent = (
    <Button url="https://miniflare.dev">Miniflare</Button>
  );
  t.deepEqual(button, {
    [$actionRowChild]: true,
    type: ComponentType.BUTTON,
    url: "https://miniflare.dev",
    emoji: undefined,
    disabled: undefined,
    label: "Miniflare",
    style: ButtonStyle.LINK,
  });
});
