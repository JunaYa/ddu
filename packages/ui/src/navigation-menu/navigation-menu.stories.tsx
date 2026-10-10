import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./navigation-menu.tsx";

const meta = {
  title: "UI/Navigation Menu",
  component: NavigationMenu,
  parameters: { layout: "centered" },
} satisfies Meta<typeof NavigationMenu>;

export default meta;
type Story = StoryObj<typeof NavigationMenu>;

export const Default: Story = {
  render: () => (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Getting Started</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-[400px] gap-1 p-1">
              <NavigationMenuLink href="#">
                <div className="flex flex-col gap-1">
                  <div className="font-medium">Introduction</div>
                  <p className="text-muted-foreground text-xs">
                    Learn the basics and get started quickly.
                  </p>
                </div>
              </NavigationMenuLink>
              <NavigationMenuLink href="#">
                <div className="flex flex-col gap-1">
                  <div className="font-medium">Installation</div>
                  <p className="text-muted-foreground text-xs">
                    Step-by-step guide to set up your project.
                  </p>
                </div>
              </NavigationMenuLink>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Components</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-[400px] gap-1 p-1 md:w-[500px] md:grid-cols-2">
              <NavigationMenuLink href="#">
                <div className="flex flex-col gap-1">
                  <div className="font-medium">Button</div>
                  <p className="text-muted-foreground text-xs">Trigger actions.</p>
                </div>
              </NavigationMenuLink>
              <NavigationMenuLink href="#">
                <div className="flex flex-col gap-1">
                  <div className="font-medium">Dialog</div>
                  <p className="text-muted-foreground text-xs">Modal overlays.</p>
                </div>
              </NavigationMenuLink>
              <NavigationMenuLink href="#">
                <div className="flex flex-col gap-1">
                  <div className="font-medium">Popover</div>
                  <p className="text-muted-foreground text-xs">Floating panels.</p>
                </div>
              </NavigationMenuLink>
              <NavigationMenuLink href="#">
                <div className="flex flex-col gap-1">
                  <div className="font-medium">Tooltip</div>
                  <p className="text-muted-foreground text-xs">Contextual hints.</p>
                </div>
              </NavigationMenuLink>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#">Documentation</NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
};
