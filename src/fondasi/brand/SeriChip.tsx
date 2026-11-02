import React from "react";
import { useBrand } from "./BrandProvider";
import { poppins } from "./fonts";

export const SeriChip: React.FC<{ text: string }> = ({ text }) => {
  const { palette } = useBrand();
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        top: 262,
        background: palette.thunder,
        color: palette.kuning,
        fontFamily: poppins,
        fontWeight: 700,
        fontSize: 30,
        textTransform: "uppercase",
        padding: "10px 24px",
        borderRadius: 999,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};
