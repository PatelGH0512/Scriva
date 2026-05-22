"use client";

import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";

const annotatedBlockFactory = createReactBlockSpec(
  {
    type: "annotated" as const,
    propSchema: {
      contextLabel: { default: "" },
      appendedAt: { default: "" },
    },
    content: "inline",
  },
  {
    render: ({ block, contentRef }) => (
      <div>
        {block.props.contextLabel && (
          <p
            style={{
              fontSize: "10px",
              color: "var(--muted-foreground)",
              opacity: 0.55,
              marginBottom: "4px",
              fontFamily: "var(--font-inter), sans-serif",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              fontWeight: 600,
              userSelect: "none",
            }}
          >
            {block.props.contextLabel}
          </p>
        )}
        <div ref={contentRef} />
      </div>
    ),
  }
);

export const scrivaSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    annotated: annotatedBlockFactory(),
  },
});

export type ScrivaSchema = typeof scrivaSchema;
