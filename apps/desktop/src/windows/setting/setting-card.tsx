import { Card, CardContent, CardHeader, CardTitle } from "@ddu/ui/card";
import { FieldGroup } from "@ddu/ui/field";
import type { ReactNode } from "react";

/** A settings section: a glass card whose rows are `Field`s. */
export function SettingCard({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <Card className="surface-glass gap-3 py-4">
      {title && (
        <CardHeader className="px-4">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="px-4">
        <FieldGroup className="gap-3">{children}</FieldGroup>
      </CardContent>
    </Card>
  );
}
