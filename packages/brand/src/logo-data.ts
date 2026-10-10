/** Generic PI placeholder geometry. Replace with your own product mark. */
export interface SvgData {
  path: string;
  viewBox: string;
}

export const SYMBOL_SVG: SvgData = {
  path: "M4 6H28V11H24V27H19V11H13V27H8V11H4Z",
  viewBox: "0 0 32 32",
};

export const WORDMARK_SVG: SvgData = {
  path: "M4 4H19V19H9V28H4ZM9 9V14H14V9ZM25 4H30V28H25Z",
  viewBox: "0 0 34 32",
};

export const WORDMARK_SCALE = 0.927;
export const GAP_SCALE = 0.102;
export const V_GAP_SCALE = 0.034;
