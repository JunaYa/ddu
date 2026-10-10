import { clearMocks, mockIPC, mockWindows } from "@tauri-apps/api/mocks";
import { emit } from "@tauri-apps/api/event";
import type { CommandArgs, CommandName, CommandResult } from "./commands/map.ts";
import type { EventMap } from "./events.ts";

type Handler<K extends CommandName> = (
  args: CommandArgs<K>,
) => CommandResult<K> | Promise<CommandResult<K>>;

/** Fake implementations for the commands a test exercises. */
export type CommandHandlers = { [K in CommandName]?: Handler<K> };

export interface MockNativeOptions {
  /** Window the code under test runs in. Defaults to `setting`. */
  window?: string;
  /** Initial raw `settings.json` contents, e.g. `{ include_cursor: { value: true } }`. */
  settings?: Record<string, unknown>;
  commands?: CommandHandlers;
  /** Results for plugin commands such as `plugin:autostart|is_enabled`. */
  plugins?: Record<string, (args: unknown) => unknown>;
}

export interface NativeMock {
  /** Raw store contents, as Rust would see them on disk after `save`. */
  readonly settings: Map<string, unknown>;
  /** Every IPC call made, in order: `[command, args]`. */
  readonly calls: Array<[string, unknown]>;
  /** Simulate another window (or Rust) writing a setting. */
  externalWrite(key: string, raw: unknown): Promise<void>;
}

const STORE_RID = 1;

/**
 * Replace Tauri's IPC with an in-memory fake: registered commands, a
 * `plugin:store` that behaves like the shared Rust store (one resource id,
 * app-wide `store://change` events), and Tauri's mocked event bus.
 * Call `resetNativeMock()` in `afterEach`.
 */
export function mockNative(options: MockNativeOptions = {}): NativeMock {
  const settings = new Map(Object.entries(options.settings ?? {}));
  const calls: Array<[string, unknown]> = [];

  const changed = (key: string, value: unknown) =>
    emit("store://change", {
      path: "settings.json",
      resourceId: STORE_RID,
      key,
      value: value ?? null,
      exists: value !== undefined,
    });

  mockWindows(options.window ?? "setting");
  mockIPC(
    async (cmd, payload) => {
      const args = (payload ?? {}) as Record<string, unknown>;
      if (!cmd.startsWith("plugin:event|")) calls.push([cmd, payload]);

      switch (cmd) {
        case "plugin:store|load":
        case "plugin:store|get_store":
          return STORE_RID;
        case "plugin:store|get": {
          const key = args.key as string;
          return [settings.get(key) ?? null, settings.has(key)];
        }
        case "plugin:store|set":
          settings.set(args.key as string, args.value);
          await changed(args.key as string, args.value);
          return null;
        case "plugin:store|save":
          return null;
      }

      const plugin = options.plugins?.[cmd];
      if (plugin) return plugin(payload);

      const handler = (options.commands as Record<string, ((a: unknown) => unknown) | undefined>)[
        cmd
      ];
      if (handler) return handler(payload);

      throw `mockNative: unexpected IPC call "${cmd}"`;
    },
    { shouldMockEvents: true },
  );

  return {
    settings,
    calls,
    async externalWrite(key, raw) {
      settings.set(key, raw);
      await changed(key, raw);
    },
  };
}

/** Emit a Rust event to the code under test (requires `mockNative`). */
export function emitNative<K extends keyof EventMap>(name: K, payload: EventMap[K]): Promise<void> {
  return emit(name, payload);
}

export function resetNativeMock(): void {
  clearMocks();
}
