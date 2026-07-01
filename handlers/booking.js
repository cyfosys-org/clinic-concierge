// handlers/booking.js
const { appendAppointment } = require("../integrations/googleSheets");
const { sendWhatsAppMessage } = require("../integrations/whatsapp");

// In-memory store — keyed by clinic name so slots don't clash across clinics
// Replace with a real DB (Postgres/MongoDB) for production
const bookedSlots = {}; // { "ClinicName_YYYY-MM-DD_HH:MM": true }
const appointments = []; // flat list, filtered by clinic on dashboard

function checkAvailability({ date, time }, clinic) {
  const key = `${clinic.name}_${date}_${time}`;
  const isBooked = !!bookedSlots[key];
  return {
    available: !isBooked,
    message: isBooked
      ? `Sorry, ${date} at ${time} is already booked at ${clinic.name}. Please suggest another time.`
      : `${date} at ${time} is available.`,
  };
}

async function bookAppointment({ patient_name, dob, phone, reason, date, time }, clinic) {
  const key = `${clinic.name}_${date}_${time}`;
  if (bookedSlots[key]) {
    return { success: false, message: "That slot was just taken. Please pick another time." };
  }

  bookedSlots[key] = true;
  const appointment = {
    clinic_name: clinic.name,
    patient_name, dob, phone, reason, date, time,
    createdAt: new Date(),
  };
  appointments.push(appointment);
  console.log(`[${clinic.name}] New appointment:`, appointment);

  // Push to this clinic's Google Sheet (non-blocking)
  appendAppointment(clinic.sheetId, appointment)
    .catch((e) => console.error("Sheets error:", e.message));

  // WhatsApp confirmation (non-blocking)
  sendWhatsAppMessage(
    phone,
    `Hi ${patient_name}, your appointment at ${clinic.name} is confirmed for ${date} at ${time}. Reply here to reschedule.`
  ).catch((e) => console.error("WhatsApp error:", e.message));

  return {
    success: true,
    message: `Appointment confirmed for ${patient_name} on ${date} at ${time}.`,
  };
}

function getAllAppointments(clinicName) {
  if (!clinicName) return appointments;
  return appointments.filter((a) => a.clinic_name === clinicName);
}

module.exports = { checkAvailability, bookAppointment, getAllAppointments };
