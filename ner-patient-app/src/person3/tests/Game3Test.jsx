import { useState } from "react";
import { voiceLanguages } from "../config/voiceLanguages";
import DailyRoutineRecall from "../game3/DailyRoutineRecall";

const testLanguageCodes = ["en", "hi", "as"];

export default function Game3Test() {
  const [languageCode, setLanguageCode] = useState("en");

  const patient = {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Rina Devi",
    language_pref: languageCode,
    region_village: "Demo Village",
    difficulty_tiers: {
      memory: 2,
      attention: 2,
      recall: 2,
      pattern: 2,
    },
    created_at: new Date().toISOString(),
  };

  const testedLanguages = voiceLanguages.filter((language) =>
    testLanguageCodes.includes(language.patientCode),
  );

  return (
    <>
      <section>
        <label htmlFor="game-language">
          Test patient language:
        </label>

        <select
          id="game-language"
          value={languageCode}
          onChange={(event) =>
            setLanguageCode(event.target.value)
          }
        >
          {testedLanguages.map((language) => (
            <option
              key={language.patientCode}
              value={language.patientCode}
            >
              {language.label}
            </option>
          ))}
        </select>
      </section>

      <DailyRoutineRecall
        key={languageCode}
        patient={patient}
      />
    </>
  );
}