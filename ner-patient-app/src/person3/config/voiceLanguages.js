export const voiceLanguages = [
  {
    patientCode: "en",
    speechCode: "en-IN",
    label: "English",
  },
  {
    patientCode: "hi",
    speechCode: "hi-IN",
    label: "Hindi",
  },
  {
    patientCode: "as",
    speechCode: "as-IN",
    label: "Assamese",
  },
  {
    patientCode: "bn",
    speechCode: "bn-IN",
    label: "Bengali",
  },
  {
    patientCode: "ne",
    speechCode: "ne-IN",
    label: "Nepali",
  },
  {
    patientCode: "mni",
    speechCode: "mni-IN",
    label: "Manipuri",
  },
  {
    patientCode: "brx",
    speechCode: "brx-IN",
    label: "Bodo",
  },
  {
    patientCode: "lus",
    speechCode: "lus-IN",
    label: "Mizo",
  },
  {
    patientCode: "kha",
    speechCode: "kha-IN",
    label: "Khasi",
  },
];

export function resolveSpeechLanguage(patientLanguageCode) {
  const aliases = {
    assamese: "as",
    hindi: "hi",
    english: "en",
    bengali: "bn",
  };
  const normalizedCode = aliases[patientLanguageCode?.toLowerCase()] || patientLanguageCode?.toLowerCase();

  const selectedLanguage = voiceLanguages.find(
    ({ patientCode, speechCode }) =>
      patientCode.toLowerCase() === normalizedCode?.split("-")[0] ||
      speechCode.toLowerCase() === normalizedCode,
  );

  return selectedLanguage?.speechCode || "en-IN";
}