// Code Nexus => https://discord.gg/Tpwgkj9gzj

const axios = require("axios");

module.exports = {
  name: "hadith",
  execute(client) {
    const dikrRoomId = process.env.HADITH_ROOM;
    if (!dikrRoomId) {
      console.warn("[Warning] HADITH_ROOM is not set in .env");
      return;
    }

    setInterval(async () => {
      try {
        const response = await axios.get(
          "https://api.hadith.gading.dev/books/muslim?range=1-300"
        );
        const hadiths = response.data.data.hadiths;

        if (!hadiths || hadiths.length === 0) {
          console.error("[Error] No hadiths found from API.");
          return;
        }

        const randomHadith =
          hadiths[Math.floor(Math.random() * hadiths.length)];

        let hadithText = `📜 **حديث نبوي شريف**\n\n"${randomHadith.arab}"\n\n📖 **المصدر:** صحيح مسلم`;

        if (hadithText.length > 2000) {
          hadithText = hadithText.substring(0, 1997) + "...";
        }

        const channel = client.channels.cache.get(dikrRoomId);
        if (channel) {
          channel
            .send(hadithText)
            .catch((err) =>
              console.error("[Error] Failed to send Hadith:", err)
            );
        } else {
          console.warn(
            `[Warning] Could not find channel with ID: ${dikrRoomId}`
          );
        }
      } catch (error) {
        console.error("[Error] Failed to fetch Hadith:", error.message);
      }
    }, 3600000); // 2h
  },
};

// Code Nexus => https://discord.gg/Tpwgkj9gzj
