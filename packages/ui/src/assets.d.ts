// Ambient declarations for side-effect asset imports (e.g. `import 'photoswipe/style.css'`).
// Without these, a stricter `tsc` resolution (as in CI) reports TS2882 for CSS
// side-effect imports that have no type declarations.
declare module "*.css";
declare module "*.scss";
