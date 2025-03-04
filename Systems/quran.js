
const fs = require("fs");
const path = require("path");

// قائمة بأسماء السور حسب ترتيبها في القرآن
const surahNames = [
  "الفاتحة",
  "البقرة",
  "آل عمران",
  "النساء",
  "المائدة",
  "الأنعام",
  "الأعراف",
  "الأنفال",
  "التوبة",
  "يونس",
  "هود",
  "يوسف",
  "الرعد",
  "إبراهيم",
  "الحجر",
  "النحل",
  "الإسراء",
  "الكهف",
  "مريم",
  "طه",
  "الأنبياء",
  "الحج",
  "المؤمنون",
  "النور",
  "الفرقان",
  "الشعراء",
  "النمل",
  "القصص",
  "العنكبوت",
  "الروم",
  "لقمان",
  "السجدة",
  "الأحزاب",
  "سبأ",
  "فاطر",
  "يس",
  "الصافات",
  "ص",
  "الزمر",
  "غافر",
  "فصلت",
  "الشورى",
  "الزخرف",
  "الدخان",
  "الجاثية",
  "الأحقاف",
  "محمد",
  "الفتح",
  "الحجرات",
  "ق",
  "الذاريات",
  "الطور",
  "النجم",
  "القمر",
  "الرحمن",
  "الواقعة",
  "الحديد",
  "المجادلة",
  "الحشر",
  "الممتحنة",
  "الصف",
  "الجمعة",
  "المنافقون",
  "التغابن",
  "الطلاق",
  "التحريم",
  "الملك",
  "القلم",
  "الحاقة",
  "المعارج",
  "نوح",
  "الجن",
  "المزمل",
  "المدثر",
  "القيامة",
  "الإنسان",
  "المرسلات",
  "النبأ",
  "النازعات",
  "عبس",
  "التكوير",
  "الانفطار",
  "المطففين",
  "الانشقاق",
  "البروج",
  "الطارق",
  "الأعلى",
  "الغاشية",
  "الفجر",
  "البلد",
  "الشمس",
  "الليل",
  "الضحى",
  "الشرح",
  "التين",
  "العلق",
  "القدر",
  "البينة",
  "الزلزلة",
  "العاديات",
  "القارعة",
  "التكاثر",
  "العصر",
  "الهمزة",
  "الفيل",
  "قريش",
  "الماعون",
  "الكوثر",
  "الكافرون",
  "النصر",
  "المسد",
  "الإخلاص",
  "الفلق",
  "الناس",
];

module.exports = {
  name: "quran",
  execute(client) {
    const dikrRoomId = process.env.QURAN_ROOM;
    if (!dikrRoomId) {
      console.warn("[Warning] DIKR_ROOM is not set in .env");
      return;
    }

    const quranPath = path.join(__dirname, "data", "quran-uthmani.txt");
    if (!fs.existsSync(quranPath)) {
      console.error(`[Error] Quran file not found: ${quranPath}`);
      return;
    }

    const quranData = fs
      .readFileSync(quranPath, "utf-8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (quranData.length === 0) {
      console.error("[Error] Quran file is empty or unreadable.");
      return;
    }

    setInterval(() => {
      try {
        const randomLine =
          quranData[Math.floor(Math.random() * quranData.length)];
        let [surahNumber, ayahNumber, text] = randomLine.split("|");

        surahNumber = parseInt(surahNumber, 10);
        ayahNumber = parseInt(ayahNumber, 10);

        const surahName = surahNames[surahNumber - 1] || `سورة ${surahNumber}`;

        const ayahText = `📖 **${surahName} - الآية ${ayahNumber}**\n\n_${text}_`;

        const channel = client.channels.cache.get(dikrRoomId);
        if (channel) {
          channel
            .send(ayahText)
            .catch((err) =>
              console.error("[Error] Failed to send Quran verse:", err)
            );
        } else {
          console.warn(
            `[Warning] Could not find channel with ID: ${dikrRoomId}`
          );
        }
      } catch (error) {
        console.error("[Error] Failed to select or send Quran verse:", error);
      }
    }, 3600000); // 2h
  },
};

