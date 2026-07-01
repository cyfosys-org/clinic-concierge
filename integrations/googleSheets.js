// integrations/googleSheets.js
const { google } = require("googleapis");

let sheetsClient = null;

function getSheetsClient() {
  if (sheetsClient) return sheetsClient;
  const auth = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    ["https://www.googleapis.com/auth/spreadsheets"]
  );
  sheetsClient = google.sheets({ version: "v4", auth });
  return sheetsClient;
}

async function appendToSheet(sheetId, range, row) {
  if (!sheetId) {
    console.log("No sheet ID configured for this clinic, skipping Sheets sync");
    return;
  }
  try {
    const sheets = getSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });
    console.log(`Sheets sync OK → ${range}`);
  } catch (err) {
    console.error("Google Sheets sync failed:", err.message);
  }
}

async function appendAppointment(sheetId, appt) {
    console.log("Range:", "Appointments!A:H");

    const row = [
        appt.clinic_name,
        appt.patient_name,
        appt.dob || "",
        appt.phone,
        appt.reason,
        appt.date,
        appt.time,
        new Date().toISOString(),
    ];

  

    await appendToSheet(sheetId, "Appointments!A:H", row);

    console.log("Done");
}

async function appendIntake(sheetId, intake) {
  await appendToSheet(sheetId, "Intake!A:F", [
    intake.clinic_name,
    intake.patient_name,
    intake.phone,
    intake.symptoms,
    intake.current_medications,
    intake.insurance_provider,
  ]);
}

module.exports = { appendAppointment, appendIntake };
