export const dailyRecallPrompts = {
  en: "Good evening. What did you see today?",
  hi: "शुभ संध्या। आज आपने क्या देखा?",
  as: "শুভ সন্ধিয়া। আজি আপুনি কি দেখিলে?",
};

export function getDailyRecallPrompt(languageCode) {
  return dailyRecallPrompts[languageCode] || dailyRecallPrompts.en;
}