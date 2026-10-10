import { invoke } from "@tauri-apps/api/core";
import type { CommandArgs, CommandName, CommandResult, NoArgs } from "./map.ts";

/** A Rust command rejected; `message` is the string the command returned. */
export class NativeError extends Error {
  override readonly name = "NativeError";

  constructor(
    readonly command: CommandName,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

function messageOf(cause: unknown): string {
  if (typeof cause === "string") return cause;
  if (cause instanceof Error) return cause.message;
  return JSON.stringify(cause);
}

/** Arguments are omitted entirely for commands that take none. */
type ArgsTuple<K extends CommandName> = CommandArgs<K> extends NoArgs ? [] : [CommandArgs<K>];

/**
 * Invoke a registered Rust command. Rejections (ddu commands return
 * `Result<T, String>`) are wrapped in {@link NativeError}; nothing is retried.
 */
export async function call<K extends CommandName>(
  name: K,
  ...args: ArgsTuple<K>
): Promise<CommandResult<K>> {
  try {
    return await invoke<CommandResult<K>>(name, args[0]);
  } catch (cause) {
    throw new NativeError(name, messageOf(cause), { cause });
  }
}
