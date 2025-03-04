// Code Nexus => https://discord.gg/Tpwgkj9gzj

const fs = require("fs");
const path = require("path");

module.exports = {
  name: "hosna",
  execute(client) {
    const dikrRoomId = process.env.HOSNA_ROOM;
    if (!dikrRoomId) {
      console.warn("[Warning] DIKR_ROOM is not set in .env");
      return;
    }

    const hosnaPath = path.join(__dirname, "data", "hosna.json");
    if (!fs.existsSync(hosnaPath)) {
      console.error(`[Error] File not found: ${hosnaPath}`);
      return;
    }

    const hosnaData = JSON.parse(fs.readFileSync(hosnaPath, "utf-8"));

    if (!Array.isArray(hosnaData) || hosnaData.length === 0) {
      console.error("[Error] hosna.json is empty or invalid.");
      return;
    }

    setInterval(() => {
      try {
        const randomHosna =
          hosnaData[Math.floor(Math.random() * hosnaData.length)];

        const messageText = `✨ **اسم من أسماء الله الحسنى** ✨\n\n📜 **${randomHosna.name}**\n🔹 _${randomHosna.meaning}_`;

        const channel = client.channels.cache.get(dikrRoomId);
        if (channel) {
          channel
            .send(messageText)
            .catch((err) =>
              console.error("[Error] Failed to send message:", err)
            );
        } else {
          console.warn(
            `[Warning] Could not find channel with ID: ${dikrRoomId}`
          );
        }
      } catch (error) {
        console.error("[Error] Failed to select or send Allah's name:", error);
      }
    }, 300000); // 10min
  },
};

// Code Nexus => https://discord.gg/Tpwgkj9gzj
