## 0.3.0

- Add support for [modals](https://github.com/mrbbot/slshx#using-modals)
- Add support for [attachment options](https://github.com/mrbbot/slshx#options)
- Return [error messages](https://github.com/mrbbot/slshx#errors) and stack
  traces to Discord during development
- Add support for
  [`Bot` token authentication](https://github.com/mrbbot/slshx#missing-apis) to
  `call()`
- Fallback to partial `{ id }` objects for mentionables, channels, and
  attachments on autocomplete. Closes
  [issue #1](https://github.com/mrbbot/slshx/issues/1), thanks
  [@helloimalastair](https://github.com/helloimalastair).
- Throw clearer error when `useDescription("...")` isn't called. Closes
  [issue #2](https://github.com/mrbbot/slshx/issues/2), thanks
  [@SkyfallWasTaken](https://github.com/SkyfallWasTaken).

## 0.2.0

- Convert JSX `<Embed>` `author`/`footer` props to `snake_case`

## 0.1.1

- Fix missing `applicationPublicKey` error message
- Add note to `README.md` that Slshx requires the
  [`--global-async-io` Miniflare flag](https://v2.miniflare.dev/core/standards#global-functionality-limits)
  to be set, to enable auto-deployments on reload.

## 0.1.0

Initial Release
