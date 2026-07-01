// handlers/reminders.js

async function sendReminderCall(phoneNumber, patientName, date, time, clinicName) {
  const VAPI_API_KEY     = process.env.VAPI_API_KEY;
  const PHONE_NUMBER_ID  = process.env.VAPI_PHONE_NUMBER_ID;
  // Use clinic-specific assistant if available, else fall back to default
  const ASSISTANT_ID     = process.env.VAPI_ASSISTANT_ID;

  if (!VAPI_API_KEY || !PHONE_NUMBER_ID || !ASSISTANT_ID) {
    throw new Error("VAPI outbound calling not fully configured — check VAPI_API_KEY, VAPI_PHONE_NUMBER_ID, VAPI_ASSISTANT_ID env vars");
  }

  const response = await fetch("https://api.vapi.ai/call", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      assistantId: ASSISTANT_ID,
      phoneNumberId: PHONE_NUMBER_ID,
      customer: { number: phoneNumber },
      assistantOverrides: {
        firstMessage: `Hello ${patientName}, this is a reminder call from ${clinicName} confirming your appointment on ${date} at ${time}. Say "confirm" to keep it, or "reschedule" if you need a different time.`,
      },
    }),
  });

  return response.json();
}

module.exports = { sendReminderCall };
