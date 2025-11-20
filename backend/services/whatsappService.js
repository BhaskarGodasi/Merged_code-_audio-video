const twilio = require("twilio");

// Create client only if credentials exist
let client = null;

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

const sendWhatsApp = async (to, message) => {
  if (!client) {
    console.log("⚠️ WhatsApp disabled (Twilio credentials missing)");
    return;
  }

  try {
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${to}`,
      body: message,
    });

    console.log(`📱 WhatsApp message sent to ${to}`);
  } catch (err) {
    console.error("❌ WhatsApp sending error:", err.message);
  }
};

module.exports = {
  sendWhatsApp,
};
