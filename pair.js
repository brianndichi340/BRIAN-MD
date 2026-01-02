const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");
const Pino = require("pino");
const fs = require("fs");

async function generateSession() {
  const { state, saveCreds } = await useMultiFileAuthState("./sessions");

  const sock = makeWASocket({
    logger: Pino({ level: "silent" }),
    auth: state,
    browser: ["BRIAN-MD", "Chrome", "1.0"],
    printQRInTerminal: false
  });

  // Request pairing code
  if (!sock.authState.creds.registered) {
    const phoneNumber = process.argv[2];
    if (!phoneNumber) {
      console.log("❌ Usage: node pair.js 2547XXXXXXXX");
      process.exit(1);
    }

    const code = await sock.requestPairingCode(phoneNumber);
    console.log("\n📲 PAIRING CODE:");
    console.log(code);
    console.log("\n➡ Enter this code in WhatsApp → Linked Devices\n");
  }

  sock.ev.on("creds.update", async () => {
    await saveCreds();

    const creds = fs.readFileSync("./sessions/creds.json", "utf-8");
    const sessionId = Buffer.from(creds).toString("base64");

    console.log("\n✅ SESSION_ID GENERATED (SAVE THIS):\n");
    console.log(sessionId);
    console.log("\n⚠️ Do NOT share this SESSION_ID\n");

    process.exit(0);
  });

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (
      connection === "close" &&
      lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
    ) {
      generateSession();
    }
  });
}

generateSession();
