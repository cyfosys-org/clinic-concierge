// server.js — Clinic Concierge by CyfoSys
// Multi-clinic VAPI webhook backend

const express = require("express");
const path    = require("path");
const XLSX    = require("xlsx");

const { getClinic }                       = require("./config/clinics");
const { checkAvailability, bookAppointment, getAllAppointments } = require("./handlers/booking");
const { recordIntake, getAllIntake }       = require("./handlers/intake");
const { triageSymptoms }                  = require("./handlers/triage");
const { sendReminderCall }                = require("./handlers/reminders");
const { sendWhatsAppMessage }             = require("./integrations/whatsapp");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ============================================================
// VAPI WEBHOOK — all tool calls come here
// VAPI sends: { message: { assistantId, toolCalls: [...] } }
// We respond: { results: [{ toolCallId, result }] }
// ============================================================
app.post("/webhook", async (req, res) => {
  try {
    const { assistantId, toolCalls = [] } = req.body?.message || {};

    // Identify which clinic this call is for
    const clinic = getClinic(assistantId);
    console.log(`[Webhook] Assistant: ${assistantId} → Clinic: ${clinic.name}`);

    const results = [];

    for (const call of toolCalls) {
      const { id, function: fn } = call;
      const args = fn.arguments || {};
      let result;

      try {
        switch (fn.name) {
          case "check_availability":
            result = checkAvailability(args, clinic);
            break;
          case "book_appointment":
            result = await bookAppointment(args, clinic);
            break;
          case "transfer_call":
            result = { action: "transfer", message: "Transferring you to the front desk now. Please hold." };
            break;
          case "record_intake":
            result = await recordIntake(args, clinic);
            break;
          case "triage_symptoms":
            result = triageSymptoms(args);
            break;
          default:
            result = { error: `Unknown function: ${fn.name}` };
        }
      } catch (fnErr) {
        console.error(`Error in ${fn.name}:`, fnErr.message);
        result = { error: `Failed to execute ${fn.name}` };
      }

      results.push({ toolCallId: id, result: JSON.stringify(result) });
    }

    res.json({ results });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ============================================================
// DOCTOR DASHBOARD API
// ============================================================

// All clinics combined (for admin view)
app.get("/api/dashboard-data", (req, res) => {
  const { clinic } = req.query; // optional filter: ?clinic=Janise+Primary+Care
  res.json({
    appointments: getAllAppointments(clinic),
    intakeRecords: getAllIntake(clinic),
  });
});

// Per-clinic data endpoints
app.get("/api/appointments", (req, res) => res.json(getAllAppointments(req.query.clinic)));
app.get("/api/intake",       (req, res) => res.json(getAllIntake(req.query.clinic)));

// Excel export — supports ?clinic= filter
app.get("/export-excel", (req, res) => {
  const clinicFilter = req.query.clinic;
  const wb = XLSX.utils.book_new();

  const apptRows = getAllAppointments(clinicFilter).map((a) => ({
    "Clinic":         a.clinic_name,
    "Patient Name":   a.patient_name,
    "DOB":            a.dob || "",
    "Phone":          a.phone,
    "Reason":         a.reason,
    "Date":           a.date,
    "Time":           a.time,
    "Booked At":      a.createdAt,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(apptRows), "Appointments");

  const intakeRows = getAllIntake(clinicFilter).map((i) => ({
    "Clinic":         i.clinic_name,
    "Patient Name":   i.patient_name,
    "Phone":          i.phone,
    "Symptoms":       i.symptoms,
    "Medications":    i.current_medications,
    "Insurance":      i.insurance_provider,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(intakeRows), "Intake Records");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const filename = clinicFilter ? `${clinicFilter.replace(/\s+/g, "_")}_data.xlsx` : "all_clinics_data.xlsx";
  res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.send(buffer);
});

// ============================================================
// OUTBOUND CALLS & WHATSAPP — manual trigger endpoints
// ============================================================
app.post("/trigger-reminder", async (req, res) => {
  try {
    const { phone, patientName, date, time, clinicName } = req.body;
    const result = await sendReminderCall(phone, patientName, date, time, clinicName || "the clinic");
    res.json({ success: true, result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/send-whatsapp", async (req, res) => {
  try {
    const { phone, message } = req.body;
    const result = await sendWhatsAppMessage(phone, message);
    res.json({ success: true, result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send WhatsApp message" });
  }
});

// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Clinic Concierge webhook running on port ${PORT}`));
