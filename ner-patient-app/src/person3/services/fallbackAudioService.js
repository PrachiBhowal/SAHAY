const fallbackPromptPaths = {
  as: "/audio/as/daily-recall-prompt.mp3",
};

export function hasFallbackPrompt(languageCode) {
  return Boolean(fallbackPromptPaths[languageCode]);
}

export async function playFallbackPrompt(languageCode) {
  const audioPath = fallbackPromptPaths[languageCode];

  if (!audioPath) {
    throw new Error(
      `No fallback prompt is available for language: ${languageCode}`,
    );
  }

  const audio = new Audio(audioPath);

  await audio.play();

  return audio;
}