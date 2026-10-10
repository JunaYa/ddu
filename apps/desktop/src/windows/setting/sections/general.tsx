import { autostart } from "@ddu/native";
import { Field, FieldError, FieldLabel } from "@ddu/ui/field";
import { Switch } from "@ddu/ui/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useId } from "react";
import { SettingCard } from "../setting-card.tsx";

const autostartKey = ["autostart"] as const;

export function GeneralSection() {
  const id = useId();
  const queryClient = useQueryClient();
  // Not suspending: if the plugin fails, only this toggle is affected, not the window.
  const state = useQuery({ queryKey: autostartKey, queryFn: autostart.isEnabled, retry: false });
  const toggle = useMutation({
    mutationFn: async (on: boolean) => {
      await (on ? autostart.enable() : autostart.disable());
      return autostart.isEnabled();
    },
    onSuccess: (now) => queryClient.setQueryData(autostartKey, now),
  });

  return (
    <SettingCard>
      <Field orientation="horizontal">
        <FieldLabel htmlFor={id}>开机自动启动</FieldLabel>
        {/* Hidden until the current state is known, as before the migration. */}
        {state.data !== undefined && (
          <Switch
            id={id}
            checked={state.data}
            loading={toggle.isPending}
            onCheckedChange={(on) => toggle.mutate(on)}
          />
        )}
      </Field>
      {state.error && <FieldError>无法读取开机启动状态：{state.error.message}</FieldError>}
      {toggle.error && <FieldError>无法修改开机启动：{toggle.error.message}</FieldError>}
    </SettingCard>
  );
}
