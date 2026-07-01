// config/clinics.js
// Add a new entry here for every clinic you onboard.
// assistantId maps to the VAPI assistant ID (found in your VAPI dashboard).
// sheetId is the Google Sheet ID for that clinic's data.

const clinics = {
  // CyfoSys demo / dev assistant
  "53e83369-ba2c-4e6d-b548-3cb0a1668734": {
    name: "CyfoSys Demo Clinic",
    sheetId: process.env.GOOGLE_SHEET_ID_DEMO || process.env.GOOGLE_SHEET_ID,
    transferNumber: process.env.TRANSFER_NUMBER_DEMO || null,
    timezone: "Asia/Kolkata",
  },

  // Janise Primary Care — Dr. Meenal Shukla
  [process.env.JANISE_ASSISTANT_ID || "JANISE_ASSISTANT_ID_PLACEHOLDER"]: {
    name: "Janise Primary Care",
    sheetId: process.env.GOOGLE_SHEET_ID_JANISE,
    transferNumber: "+15167087008",
    timezone: "America/New_York",
  },
};

// Fallback if assistantId isn't found — uses the default sheet
const defaultClinic = {
  name: "Unknown Clinic",
  sheetId: process.env.GOOGLE_SHEET_ID,
  transferNumber: null,
  timezone: "UTC",
};

function getClinic(assistantId) {
  return clinics[assistantId] || defaultClinic;
}

module.exports = { getClinic };
