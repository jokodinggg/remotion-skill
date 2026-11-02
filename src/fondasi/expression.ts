export type JoksExpression =
  | "netral" | "halo" | "senang" | "kaget" | "sedih" | "marah" | "bingung" | "jempol" | "nunjuk";
export type PersonMood = "netral" | "panik" | "senang" | "bingung" | "sedih" | "kagum";

const MAP: Record<string, { joks: JoksExpression; person: PersonMood }> = {
  excited: { joks: "senang", person: "senang" },
  happy: { joks: "senang", person: "senang" },
  panicked: { joks: "kaget", person: "panik" },
  surprised: { joks: "kaget", person: "kagum" },
  sighs: { joks: "sedih", person: "sedih" },
  sad: { joks: "sedih", person: "sedih" },
  curious: { joks: "bingung", person: "bingung" },
  confused: { joks: "bingung", person: "bingung" },
  angry: { joks: "marah", person: "panik" },
  frustrated: { joks: "marah", person: "panik" },
  calm: { joks: "netral", person: "netral" },
  whispers: { joks: "netral", person: "netral" },
};

export function defaultExpression(tag: string): { joks: JoksExpression; person: PersonMood } {
  return MAP[tag] ?? { joks: "netral", person: "netral" };
}
