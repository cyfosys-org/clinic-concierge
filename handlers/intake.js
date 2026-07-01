// handlers/intake.js
const { appendIntake } = require("../integrations/googleSheets");

const intakeRecords = [];

async function recordIntake({ patient_name, phone, symptoms, current_medications, insurance_provider }, clinic) {
  const record = {
    clinic_name: clinic.name,
    patient_name,
    phone,
    symptoms,
    current_medications: current_medications || "none reported",
    insurance_provider: insurance_provider || "not provided",
    createdAt: new Date(),
  };
  intakeRecords.push(record);
  console.log(`[${clinic.name}] Intake recorded:`, record);

  // Push to this clinic's Google Sheet (non-blocking)
  appendIntake(clinic.sheetId, record)
    .catch((e) => console.error("Sheets intake error:", e.message));

  return {
    success: true,
    message: "Got it, I've noted that down for the doctor ahead of your visit.",
  };
}

function getAllIntake(clinicName) {
  if (!clinicName) return intakeRecords;
  return intakeRecords.filter((r) => r.clinic_name === clinicName);
}

module.exports = { recordIntake, getAllIntake };
