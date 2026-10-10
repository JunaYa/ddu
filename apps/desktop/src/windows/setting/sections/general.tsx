import { autostart } from "@ddu/native";
import { Field, FieldError, FieldLabel } from "@ddu/ui/field";
import { Switch } from "@ddu/ui/switch";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useId } from "react";
import { SettingCard } from "../setting-card.tsx";

const autostartKey = ["autostart"] as const;

export function GeneralSection() {
  const id = useId();
  const queryClient = useQueryClient();
  const { data: enabled } = useSuspenseQuery({
    queryKey: autostartKey,
    queryFn: autostart.isEnabled,
  });
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
        <Switch
          id={id}
          checked={enabled}
          loading={toggle.isPending}
          disabled={toggle.isPending}
          onCheckedChange={(on) => toggle.mutate(on)}
        />
      </Field>
      {toggle.error && <FieldError>无法修改开机启动：{toggle.error.message}</FieldError>}
    </SettingCard>
  );
}
