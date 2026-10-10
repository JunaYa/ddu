# PI UI

Shared UI primitives migrated from `streamify-one-design-system/packages/ui`,
with their original stories and regression tests. Import components through
explicit public subpaths:

```tsx
import { Button } from "@ddu/ui/button";
import { Card, CardContent } from "@ddu/ui/card";

export function Example() {
  return (
    <Card>
      <CardContent>
        <Button variant="primary">Save</Button>
      </CardContent>
    </Card>
  );
}
```

The existing `DemoCard` remains available from `@ddu/ui` and uses the shared
Card component. The root entry deliberately does not re-export every component.

## Styles and foundations

Import `@ddu/styles/base.css` once in a host stylesheet and enable
`@tailwindcss/vite` in its Vite configuration. Web, desktop, the extension popup,
and Storybook are already wired. Toggle the `dark` class on the document element
to select the dark theme.

- `@ddu/tokens`: color, typography, radius, effect, and semantic CSS variables.
- `@ddu/styles`: Tailwind baseline, animations, source scanning, and utilities.
- `@ddu/iconography`: product icons and the SVG illustration catalogs.
- `@ddu/brand`: neutral PI placeholder geometry and React marks used by iconography.

Font stacks are preserved. Font binaries are not bundled; hosts can supply
Manrope, Lora, Geist Mono, and Noto SC, or use the configured system fallbacks.
The foundation packages remain private source packages, as in the source repo;
external publication requires packaging and publishing them first.

`@ddu/styles/src/vendor/shadcn.css` preserves the MIT-licensed Tailwind preset
from shadcn (version and full license in its header). Only this stylesheet is
needed at runtime; vendoring it avoids installing the shadcn CLI and its
unrelated dependency graph. Update the stylesheet and retained license together.

## Develop and verify

```sh
vp run @ddu/ui#storybook
vp run @ddu/ui#build-storybook
vp run @ddu/ui#test
vp run @ddu/ui#build
vp run -r check
```

Storybook includes UI and iconography stories with a light/dark toolbar. Library
builds emit JavaScript and declarations for every public component entry.
`tsconfig.build.json` excludes stories and tests from declaration emission;
the normal checks continue to typecheck them.

## Animation inspection

Lapse is optional and is not part of the default dependency graph. See
[the opt-in guide](../../docs/optional-lapse.md) to install it with your own
registry access and enable development-only clock patches and the panel.
