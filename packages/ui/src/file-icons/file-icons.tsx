/**
 * Mimetype → icon / tile-style taxonomy for file-like content (artifacts,
 * attachments, uploads). Extracted from the web app's `artifact-helpers` so the
 * web app and the extension render identical file-type visuals (e.g. in the
 * shared @-mention picker) instead of maintaining parallel copies.
 *
 * Pure string → value mappings only — no fetching, no app types. The Artifact-
 * aware wrappers (artifact labels and entity helpers) stay host-side.
 */

import { type AppIcon, Icons } from "../icons/icons.tsx";

/**
 * Mimetype substrings that classify an artifact as source-code-style content.
 * Centralized so the icon, color, and text-preview helpers stay in sync.
 */
export const CODE_MIMETYPE_SUBSTRINGS = [
  "javascript",
  "typescript",
  "json",
  "html",
  "css",
  "python",
  "x-go",
  "x-rust",
  "yaml",
] as const;

export function isCodeMimetype(mimetype: string): boolean {
  if (CODE_MIMETYPE_SUBSTRINGS.some((token) => mimetype.includes(token))) return true;
  // Match genuine XML precisely. A bare `xml` substring would also catch the
  // OpenXML Office formats (pptx/docx/xlsx), whose mimetypes embed
  // "openxmlformats" — misclassifying slide decks and documents as code/text.
  return mimetype === "application/xml" || mimetype === "text/xml" || mimetype.endsWith("+xml");
}

export function getFileIcon(mimetype: string | null | undefined): AppIcon {
  if (!mimetype) return Icons.artifactFile;
  if (mimetype.startsWith("image/")) return Icons.artifactImage;
  if (mimetype.startsWith("video/")) return Icons.artifactVideo;
  if (mimetype.startsWith("audio/")) return Icons.artifactAudio;
  // Presentation check is before code/etc so the TEMP `application/pdf → slide`
  // override (see `TEMP_TREAT_PDF_AS_SLIDE`) routes PDFs to the slide icon.
  if (isPresentationMimetype(mimetype)) return Icons.artifactPresentation;
  if (mimetype.includes("spreadsheet") || mimetype.includes("excel"))
    return Icons.artifactSpreadsheet;
  if (isCodeMimetype(mimetype)) return Icons.artifactCode;
  return Icons.artifactFile;
}

/**
 * True when the mimetype represents text-based content (text/*, JSON, XML,
 * source code). Drives whether the artifact card renders a text preview block
 * vs. an icon placeholder.
 */
export function isTextBasedMimetype(mimetype: string | null | undefined): boolean {
  if (!mimetype) return false;
  if (mimetype.startsWith("text/")) return true;
  if (mimetype === "application/json" || mimetype.endsWith("+json")) return true;
  if (mimetype === "application/xml" || mimetype.endsWith("+xml")) return true;
  return isCodeMimetype(mimetype);
}

/**
 * TEMP — remove once backend preserves the original kind on `File.mimetype`.
 *
 * Today the backend renders every slide deck into a PDF and stores the PDF as
 * the artifact's content file, so `File.mimetype` comes back as
 * `application/pdf` for both genuine PDFs and slide decks. Until backend
 * ships the fix (where slides keep their `…/presentationml.presentation`
 * mimetype on the File record), every PDF in the system is in practice a
 * slide deck — so we treat them as slides everywhere in the UI.
 *
 * To remove this override:
 *   1. Confirm backend now returns the original mimetype on `File.mimetype`
 *      for derived files (slide → PDF, doc → PDF, …).
 *   2. Flip this constant to `false`.
 *   3. `grep TEMP_TREAT_PDF_AS_SLIDE` and delete the constant + every
 *      reference. The helper / icon / label / layout paths that depend on
 *      `isPresentationMimetype` already do the right thing once the flag is
 *      off, so no other code changes should be required.
 *
 * TODO(PI-527): file a backend ticket and replace this comment with its ID.
 */
const TEMP_TREAT_PDF_AS_SLIDE = true;

/**
 * True when the mimetype represents a slide/presentation artifact (PPT, PPTX,
 * ODP). Used to switch the artifact card into the video-style thumbnail-first
 * layout — slides read better with a 16:9 preview on top and the title below,
 * matching the NoteCard pattern for YouTube/video notes.
 */
export function isPresentationMimetype(mimetype: string | null | undefined): boolean {
  if (!mimetype) return false;
  if (mimetype.includes("presentation") || mimetype.includes("powerpoint")) return true;
  // TEMP — see `TEMP_TREAT_PDF_AS_SLIDE` above.
  if (TEMP_TREAT_PDF_AS_SLIDE && mimetype === "application/pdf") return true;
  return false;
}

/**
 * True when the mimetype represents a document-style artifact (PDF, Word,
 * presentation, spreadsheet) that should render with a portrait paper-shaped
 * placeholder, mirroring the `contentType === 'file'` branch in note cards.
 */
export function isDocumentMimetype(mimetype: string | null | undefined): boolean {
  if (!mimetype) return false;
  return (
    mimetype === "application/pdf" ||
    mimetype.includes("word") ||
    mimetype === "application/msword" ||
    mimetype.includes("presentation") ||
    mimetype.includes("powerpoint") ||
    mimetype.includes("spreadsheet") ||
    mimetype.includes("excel")
  );
}

export function getFileIconStyle(mimetype: string | null | undefined): { bg: string; fg: string } {
  if (!mimetype) return { bg: "bg-muted-foreground/10", fg: "text-muted-foreground" };
  if (mimetype.startsWith("image/")) return { bg: "bg-emerald-500/10", fg: "text-emerald-500" };
  if (mimetype.startsWith("video/")) return { bg: "bg-purple-500/10", fg: "text-purple-500" };
  if (mimetype.startsWith("audio/")) return { bg: "bg-amber-500/10", fg: "text-amber-500" };
  // Presentation check is before the bare PDF branch so the TEMP override
  // (see `TEMP_TREAT_PDF_AS_SLIDE`) gives PDFs the orange slide treatment.
  if (isPresentationMimetype(mimetype)) return { bg: "bg-orange-500/10", fg: "text-orange-500" };
  if (mimetype === "application/pdf") return { bg: "bg-red-500/10", fg: "text-red-500" };
  if (mimetype.includes("spreadsheet") || mimetype.includes("excel"))
    return { bg: "bg-green-600/10", fg: "text-green-600" };
  if (mimetype.includes("word") || mimetype === "application/msword")
    return { bg: "bg-blue-500/10", fg: "text-blue-500" };
  if (isCodeMimetype(mimetype)) return { bg: "bg-sky-500/10", fg: "text-sky-500" };
  return { bg: "bg-muted-foreground/10", fg: "text-muted-foreground" };
}

/**
 * Map common file-extension suffixes to their canonical mimetype.
 *
 * Lets list surfaces (sidebar list, mention picker) display correct file-type
 * icons without paying for an N-request `useFile` fetch per item — the
 * artifact's `name` is usually a filename like `notes.md` or `script.py`.
 * The detail view still resolves the real mimetype on click.
 */
const EXTENSION_TO_MIMETYPE: Record<string, string> = {
  // text & code
  md: "text/markdown",
  markdown: "text/markdown",
  txt: "text/plain",
  json: "application/json",
  xml: "text/xml",
  yaml: "text/yaml",
  yml: "text/yaml",
  html: "text/html",
  htm: "text/html",
  css: "text/css",
  ts: "text/typescript",
  tsx: "text/typescript",
  js: "text/javascript",
  jsx: "text/javascript",
  py: "text/x-python",
  rs: "text/x-rust",
  go: "text/x-go",
  // images
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  heic: "image/heic",
  heif: "image/heif",
  // video
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
  // audio
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  // docs
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export function guessMimetypeFromName(name: string | null | undefined): string | undefined {
  if (!name) return undefined;
  const dot = name.lastIndexOf(".");
  if (dot < 0 || dot === name.length - 1) return undefined;
  const ext = name.slice(dot + 1).toLowerCase();
  return EXTENSION_TO_MIMETYPE[ext];
}
