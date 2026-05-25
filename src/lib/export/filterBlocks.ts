import type { Block } from "@blocknote/core";

// Block types that are Scriva app artifacts and must NEVER appear in any export.
// Note: the custom block type is "annotated" (contextLabel is a *prop* on it,
// not the type name). Using the wrong name here would silently leak the block.
const EXCLUDED_BLOCK_TYPES: string[] = ["annotated"];

export function filterExportableBlocks(
  blocks: Block<any, any, any>[],
): Block<any, any, any>[] {
  return blocks
    .filter((block) => !EXCLUDED_BLOCK_TYPES.includes(block.type))
    .map((block) => ({
      ...block,
      children: block.children
        ? filterExportableBlocks(block.children as Block<any, any, any>[])
        : [],
    }));
}
