import { Text, View } from "@react-pdf/renderer";
import { pdfDefaultSchemaMappings } from "@blocknote/xl-pdf-exporter";

export const scrivaPDFMappings = {
  blockMapping: {
    ...pdfDefaultSchemaMappings.blockMapping,

    // Hard guarantee — annotated blocks are Scriva app artifacts, NEVER export
    annotated: () => null,

    heading: (block: any, exporter: any) => {
      const sizes: Record<number, number> = { 1: 22, 2: 16, 3: 13 };
      return (
        <Text
          style={{
            fontSize: sizes[block.props.level] ?? 13,
            fontWeight: "bold",
            marginBottom: 8,
            marginTop: block.props.level === 1 ? 20 : 14,
            color: "#1A1A1A",
          }}
        >
          {exporter.transformInlineContent(block.content)}
        </Text>
      );
    },

    quote: (block: any, exporter: any) => (
      <View
        style={{
          borderLeftWidth: 3,
          borderLeftColor: "#0D9488",
          paddingLeft: 12,
          marginVertical: 10,
          backgroundColor: "rgba(13,148,136,0.04)",
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontStyle: "italic",
            color: "#555555",
            lineHeight: 1.6,
          }}
        >
          {exporter.transformInlineContent(block.content)}
        </Text>
      </View>
    ),

    video: (block: any) => (
      <View
        style={{
          padding: 8,
          backgroundColor: "#F5F5F5",
          borderRadius: 4,
          marginVertical: 6,
        }}
      >
        <Text style={{ fontSize: 10, color: "#8A8A93", fontStyle: "italic" }}>
          {`Video: ${block.props?.url ?? "embedded video"}`}
        </Text>
      </View>
    ),

    audio: (block: any) => (
      <View
        style={{
          padding: 8,
          backgroundColor: "#F5F5F5",
          borderRadius: 4,
          marginVertical: 6,
        }}
      >
        <Text style={{ fontSize: 10, color: "#8A8A93", fontStyle: "italic" }}>
          {`Audio: ${block.props?.url ?? "embedded audio"}`}
        </Text>
      </View>
    ),
  },

  inlineContentMapping: pdfDefaultSchemaMappings.inlineContentMapping,
  styleMapping: pdfDefaultSchemaMappings.styleMapping,
};
