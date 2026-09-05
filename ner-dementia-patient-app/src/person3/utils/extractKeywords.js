const stopWordsByLanguage = {
  en: new Set([
    "a",
    "an",
    "and",
    "at",
    "for",
    "i",
    "in",
    "is",
    "it",
    "my",
    "of",
    "on",
    "or",
    "the",
    "then",
    "to",
    "today",
    "was",
    "we",
    "were",
  ]),

  hi: new Set([
    "आज",
    "और",
    "का",
    "की",
    "के",
    "को",
    "था",
    "थी",
    "थे",
    "पर",
    "मैं",
    "में",
    "से",
    "हम",
    "है",
    "हूँ",
  ]),

  as: new Set([
    "আজি",
    "আৰু",
    "আমি",
    "আপুনি",
    "আছিল",
    "এই",
    "এটা",
    "কি",
    "মই",
    "সেই",
  ]),
};

export default function extractKeywords(
  text,
  languageCode,
  maximumKeywords = 8,
) {
  if (!text?.trim()) {
    return [];
  }

  const normalizedLanguage =
    languageCode?.toLowerCase().split("-")[0] || "en";

  const stopWords =
    stopWordsByLanguage[normalizedLanguage] ||
    stopWordsByLanguage.en;

  const words =
    text.toLocaleLowerCase(normalizedLanguage).match(
      /[\p{L}\p{N}]+/gu,
    ) || [];

  const uniqueKeywords = [];

  for (const word of words) {
    if (
      word.length > 1 &&
      !stopWords.has(word) &&
      !uniqueKeywords.includes(word)
    ) {
      uniqueKeywords.push(word);
    }

    if (uniqueKeywords.length === maximumKeywords) {
      break;
    }
  }

  return uniqueKeywords;
}