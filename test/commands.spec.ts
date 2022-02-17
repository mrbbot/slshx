import test, { ThrowsExpectation } from "ava";
import {
  CommandHandler,
  MessageCommandHandler,
  UserCommandHandler,
  recordCommands,
  useDescription,
} from "../src/commands";

// Most of command testing is implicit, in the /test/integration folder

function cmd(): CommandHandler & UserCommandHandler & MessageCommandHandler {
  useDescription("Description");
  return () => ({ content: "" });
}

test("recordCommands: throws on invalid command names", (t) => {
  // Check everything working normally
  const cmds = recordCommands({
    commands: {
      a: cmd,
      b: { c: cmd },
      d: { e: { f: cmd } },
    },
    userCommands: { g: cmd },
    messageCommands: { h: cmd },
  });
  t.deepEqual(
    cmds.map(({ name }) => name),
    ["a", "b", "d", "g", "h"]
  );

  const expectations: ThrowsExpectation = {
    instanceOf: RangeError,
    message:
      /Command name ".+" must not contain ':', '\/', '\$' or '#' characters/,
  };

  // Check with top level chat input commands
  t.throws(() => recordCommands({ commands: { "a:": cmd } }), expectations);

  // Check with chat input commands nested one level
  t.throws(
    () => recordCommands({ commands: { b: { "/c": cmd } } }),
    expectations
  );

  // Check with chat input commands nested two levels
  t.throws(
    () => recordCommands({ commands: { d: { e: { $f: cmd } } } }),
    expectations
  );

  // Check with user commands
  t.throws(() => recordCommands({ userCommands: { "g#": cmd } }), expectations);

  // Check with message commands
  t.throws(
    () => recordCommands({ messageCommands: { h$: cmd } }),
    expectations
  );
});

test("recordCommands: throws on missing description", (t) => {
  const expectations: ThrowsExpectation = {
    instanceOf: TypeError,
    message:
      /Command ".+" must call useDescription\("\.\.\."\) with a non-empty string/,
  };

  function noDescriptionCmd(): CommandHandler {
    return () => ({ content: "" });
  }
  // Check with top level chat input commands
  t.throws(
    () => recordCommands({ commands: { a: noDescriptionCmd } }),
    expectations
  );
  // Check with chat input commands nested one level
  t.throws(
    () => recordCommands({ commands: { b: { c: noDescriptionCmd } } }),
    expectations
  );
  // Check with chat input commands nested two levels
  t.throws(
    () => recordCommands({ commands: { d: { e: { f: noDescriptionCmd } } } }),
    expectations
  );

  // Check calling useDescription() with empty string
  function emptyDescriptionCmd(): CommandHandler {
    useDescription("");
    return () => ({ content: "" });
  }
  t.throws(
    () => recordCommands({ commands: { a: emptyDescriptionCmd } }),
    expectations
  );

  // Check calling useDescription() with undefined
  function undefinedDescriptionCmd(): CommandHandler {
    useDescription(undefined as any);
    return () => ({ content: "" });
  }
  t.throws(
    () => recordCommands({ commands: { a: undefinedDescriptionCmd } }),
    expectations
  );
});
