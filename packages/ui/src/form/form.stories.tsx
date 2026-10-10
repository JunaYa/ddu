import { zodResolver } from "@hookform/resolvers/zod";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../button/button.tsx";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form.tsx";
import { Input } from "../input/input.tsx";

const meta = {
  title: "UI/Form",
  component: FormItem,
  parameters: { layout: "centered" },
} satisfies Meta<typeof FormItem>;

export default meta;
type Story = StoryObj<typeof FormItem>;

const basicSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
});

export const Default: Story = {
  render: () => {
    function Example() {
      const form = useForm<z.infer<typeof basicSchema>>({
        // zod 4.3's _zod.version literal mismatches @hookform/resolvers'
        // zod-4.0 typing (TS2769). Cast the schema — type-only, runtime is fine.
        resolver: zodResolver(basicSchema as never),
        defaultValues: { username: "", email: "" },
      });
      return (
        <Form {...form}>
          <form className="w-80 space-y-4" onSubmit={form.handleSubmit(() => {})}>
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe" {...field} />
                  </FormControl>
                  <FormDescription>Your public display name.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      );
    }
    return <Example />;
  },
};

const errorSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export const WithErrors: Story = {
  name: "With Validation Errors",
  render: () => {
    function Example() {
      const form = useForm<z.infer<typeof errorSchema>>({
        // See note above — zod 4.3 vs @hookform/resolvers zod-4.0 typing (TS2769).
        resolver: zodResolver(errorSchema as never),
        defaultValues: { name: "" },
      });
      return (
        <Form {...form}>
          <form className="w-80 space-y-4" onSubmit={form.handleSubmit(() => {})}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your name" {...field} />
                  </FormControl>
                  <FormDescription>Click submit to see validation.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      );
    }
    return <Example />;
  },
};
