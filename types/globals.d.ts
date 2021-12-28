import { ExecutionContext } from "ava";

declare global {
  const MINIFLARE: boolean | undefined;

  // For integration tests
  const t: ExecutionContext;
  const TEST_SLSHX_PUBLIC_KEY: string;
  const TEST_SLSHX_GUILD_ID: string | undefined;
}
