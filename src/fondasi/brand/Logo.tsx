import React from "react";
import { Img, staticFile } from "remotion";
import { useBrand } from "./BrandProvider";

/** Static brand logo. Never animate, fade, recolor or rotate it. */
export const Logo: React.FC<{ variant: "color" | "light" }> = ({ variant }) => {
  const { logo } = useBrand();
  return (
    <Img
      src={staticFile(logo[variant])}
      style={{ position: "absolute", right: logo.right, top: logo.top, width: logo.width }}
    />
  );
};
