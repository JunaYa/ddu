interface ImportMeta {
  glob(
    pattern: string,
    options: {
      eager: true;
      query: string;
      import: "default";
    },
  ): Record<string, string>;
}
