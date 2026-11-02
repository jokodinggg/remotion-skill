import React, { createContext, useContext } from "react";
import type { BrandKit } from "./types";

const BrandContext = createContext<BrandKit | null>(null);

export const BrandProvider: React.FC<{ brand: BrandKit; children: React.ReactNode }> = ({ brand, children }) => (
  <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>
);

export const useBrand = (): BrandKit => {
  const brand = useContext(BrandContext);
  if (!brand) throw new Error("useBrand harus dipakai di dalam BrandProvider");
  return brand;
};
