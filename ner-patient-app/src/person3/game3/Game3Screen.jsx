import { useEffect, useState } from "react";
import { getPatientData } from "../../lib/localStorage";
import DailyRoutineRecall from "./DailyRoutineRecall";

export default function Game3Screen({ onBack }) {
  const [patient, setPatient] = useState(undefined);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isActive = true;

    getPatientData()
      .then((patientData) => {
        if (isActive) {
          setPatient(patientData);
        }
      })
      .catch((error) => {
        console.error("Unable to load patient data:", error);

        if (isActive) {
          setLoadError("Patient information could not be loaded.");
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  if (loadError) {
    return (
      <main className="game3-screen">
        <button
          className="game3-back-button"
          type="button"
          onClick={onBack}
        >
          ← Back
        </button>

        <p className="game3-status" role="alert">
          {loadError}
        </p>
      </main>
    );
  }

  if (patient === undefined) {
    return (
      <main className="game3-screen">
        <p className="game3-status">
          Loading patient information...
        </p>
      </main>
    );
  }

  if (patient === null) {
    return (
      <main className="game3-screen">
        <button
          className="game3-back-button"
          type="button"
          onClick={onBack}
        >
          ← Back
        </button>

        <p className="game3-status">
          No patient information is available on this device.
        </p>
      </main>
    );
  }

  return (
    <main className="game3-screen">
      <button
        className="game3-back-button"
        type="button"
        onClick={onBack}
      >
        ← Back
      </button>

      <DailyRoutineRecall patient={patient} />
    </main>
  );
}