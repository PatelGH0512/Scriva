// Strips characters illegal in Windows/macOS/Linux filenames and collapses whitespace.
// Falls back to "Scriva Export" if the sanitized result is empty.
export function sanitizeFilename(title: string): string {
  return (
    title
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, "") // illegal filename chars
      .replace(/\.{2,}/g, ".") // no consecutive dots
      .replace(/\s+/g, " ") // collapse whitespace
      .trim() || "Scriva Export"
  );
}
