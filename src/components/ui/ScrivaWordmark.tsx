interface ScrivaWordmarkProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: { fontSize: "14px", letterSpacing: "-0.03em", fontWeight: 600 },
  md: { fontSize: "26px", letterSpacing: "-0.04em", fontWeight: 600 },
  lg: { fontSize: "40px", letterSpacing: "-0.05em", fontWeight: 600 },
  xl: { fontSize: "56px", letterSpacing: "-0.055em", fontWeight: 600 },
};

export function ScrivaWordmark({
  size = "sm",
  className,
}: ScrivaWordmarkProps) {
  const { fontSize, letterSpacing, fontWeight } = sizeMap[size];

  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        fontSize,
        fontWeight,
        letterSpacing,
        lineHeight: 1,
        background:
          "linear-gradient(135deg, #5eead4 0%, #0d9488 55%, #0f766e 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
        userSelect: "none",
      }}
    >
      scriva
    </span>
  );
}
