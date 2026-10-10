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
  /** Runs after a `plugin:store|get` is answered, e.g. to simulate a racing write. */
  onStoreGet?: (key: string, settings: Map<string, unknown>) => void;
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
 * @tauri-apps/api 2.11's event mock never drops unsubscribed listeners
 * (`_unlisten` sends `eventId`, the mock's remover reads `id`), so emitting
 * after an unsubscribe warns about the already-unregistered callback. The
 * warning means the unsubscribe worked; hide only that message.
 */
const STALE_CALLBACK = "[TAURI] Couldn't find callback id";
/** The `console.warn` in place before `mockNative` (possibly a test's spy). */
let previousWarn: typeof console.warn | undefined;

/**
 * Replace Tauri's IPC with an in-memory fake: registered commands, a
 * `plugin:store` that behaves like the shared Rust store (one resource id,
 * app-wide `store://change` events), and Tauri's mocked event bus.
 * Call `resetNativeMock()` in `afterEach`.
 */
export function mockNative(options: MockNativeOptions = {}): NativeMock {
  const settings = new Map(Object.entries(options.settings ?? {}));
  const calls: Array<[string, unknown]> = [];

  // Like the real plugin, the change event is broadcast separately from the
  // IPC reply, so code under test must not rely on seeing it first.
  const changed = (key: string, value: unknown) =>
    new Promise<void>((resolve) =>
      setTimeout(() => {
        void emit("store://change", {
          path: "settings.json",
          resourceId: STORE_RID,
          key,
          value: value ?? null,
          exists: value !== undefined,
        }).then(resolve);
      }, 0),
    );

  const expectStore = (args: Record<string, unknown>) => {
    if ("path" in args && args.path !== "settings.json")
      throw `mockNative: unexpected store "${String(args.path)}"`;
    if ("rid" in args && args.rid !== STORE_RID)
      throw `mockNative: unknown store resource ${String(args.rid)}`;
  };

  const forward = (previousWarn ??= console.warn);
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].startsWith(STALE_CALLBACK)) return;
    forward(...args);
  };
  mockWindows(options.window ?? "setting");
  mockIPC(
    async (cmd, payload) => {
      const args = (payload ?? {}) as Record<string, unknown>;
      if (!cmd.startsWith("plugin:event|")) calls.push([cmd, payload]);
      if (cmd.startsWith("plugin:store|")) expectStore(args);

      switch (cmd) {
        case "plugin:store|load":
        case "plugin:store|get_store":
          return STORE_RID;
        case "plugin:store|get": {
          const key = args.key as string;
          const reply = [settings.get(key) ?? null, settings.has(key)];
          options.onStoreGet?.(key, settings);
          return reply;
        }
        case "plugin:store|set":
          settings.set(args.key as string, args.value);
          void changed(args.key as string, args.value);
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
  if (previousWarn) console.warn = previousWarn;
  previousWarn = undefined;
  clearMocks();
}
