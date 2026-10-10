import { Card, CardContent, CardHeader, CardTitle } from "./card/card.tsx";

export interface DemoCardProps {
  /** Greeting text to display (sourced from @ddu/sdk via @ddu/hooks). */
  message: string;
  /** Platform key the card is rendered on (web | extension | desktop). */
  platform: string;
}

/**
 * Presentational demo card. Purely visual — it takes data as props and never
 * imports @ddu/sdk or @ddu/hooks (R3: the design system stays data-agnostic).
 */
export function DemoCard({ message, platform }: DemoCardProps) {
  return (
    <section className="pi-demo-card mx-auto w-full max-w-lg p-6" data-platform={platform}>
      <Card>
        <CardHeader>
          <CardTitle className="pi-demo-card__platform">{platform}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="pi-demo-card__message">{message}</p>
        </CardContent>
      </Card>
    </section>
  );
}
