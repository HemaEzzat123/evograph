const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  EmbedBuilder,
  Collection,
  Colors,
} = require("discord.js");

const fs = require("fs");

// Ticket transcripts storage
const transcripts = new Collection();

// Cooldown system
const ticketCooldowns = new Collection();
const COOLDOWN_TIME = 3 * 60 * 1000; // 3 دقائق

module.exports = (client) => {
  // Initialize ticket tracking
  client.ticketStats = {
    totalTickets: 0,
    activeTickets: 0,
    resolvedTickets: 0,
    ticketHistory: [], // Array to store individual ticket data
  };

  // Load stats from file if exists
  try {
    const stats = require("../data/ticketStats.json");
    client.ticketStats = stats;
  } catch (err) {
    console.log("No existing ticket stats found. Creating new stats file...");
    saveStats(client.ticketStats);
  }

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isStringSelectMenu() && !interaction.isButton()) return;

    const guild = interaction.guild;
    const user = interaction.user;
    const categoryID = "1338619897634361424";
    const supportRoleId = "1229411562985492556";

    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === "ticket_menu"
    ) {
      // Cooldown check
      if (ticketCooldowns.has(user.id)) {
        const timeLeft = ticketCooldowns.get(user.id) - Date.now();
        if (timeLeft > 0) {
          return interaction.reply({
            content: `⏰ يرجى الانتظار ${Math.ceil(
              timeLeft / (60 * 1000) // تحويل الوقت إلى دقائق
            )} دقائق قبل إنشاء تذكرة جديدة.`,
            ephemeral: true,
          });
        }
      }

      const existingChannel = guild.channels.cache.find(
        (channel) =>
          channel.name.startsWith("ticket-") && channel.topic === user.id
      );

      if (existingChannel) {
        return interaction.reply({
          content: "⚠️ لديك بالفعل تذكرة مفتوحة!",
          ephemeral: true,
        });
      }

      const selectedOption = interaction.values[0];

      // Create new ticket entry
      const ticketData = {
        ticketId: `TICKET-${Date.now()}`,
        userId: user.id,
        username: user.tag,
        type: selectedOption,
        status: "active",
        createdAt: new Date().toISOString(),
        closedAt: null,
        channelId: null,
        claimedBy: null,
      };

      const ticketEmbed = new EmbedBuilder()
        .setColor(Colors.Blue)
        .setTitle(`🎫 تذكرة جديدة - ${ticketData.ticketId}`)
        .setDescription(`تم إنشاء تذكرة جديدة من قبل ${user}`)
        .addFields(
          { name: "📋 التصنيف", value: selectedOption },
          { name: "🕒 وقت الإنشاء", value: new Date().toLocaleString("ar-SA") }
        )
        .setFooter({ text: "نظام التذاكر المتطور" });

      const ticketNumber = client.ticketStats.totalTickets + 1;
      const ticketChannel = await guild.channels.create({
        name: `ticket-${ticketNumber}`,
        type: 0,
        parent: categoryID,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.AttachFiles,
            ],
          },
          {
            id: supportRoleId,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.AttachFiles,
            ],
          },
          {
            id: client.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ManageChannels,
            ],
          },
        ],
      });

      // Update ticket data with channel ID
      ticketData.channelId = ticketChannel.id;

      // Add ticket to history
      client.ticketStats.ticketHistory.push(ticketData);

      // Update statistics
      client.ticketStats.totalTickets = ticketNumber;
      client.ticketStats.activeTickets++;

      // Save updated stats
      saveStats(client.ticketStats);

      const closeButton = new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("اغلاق التذكرة")
        .setStyle(ButtonStyle.Danger);

      const claimButton = new ButtonBuilder()
        .setCustomId("claim_ticket")
        .setLabel("استلام التذكرة")
        .setStyle(ButtonStyle.Success);

      const transcriptButton = new ButtonBuilder()
        .setCustomId("save_transcript")
        .setLabel("حفظ المحادثة")
        .setStyle(ButtonStyle.Primary);

      const buttonRow = new ActionRowBuilder().addComponents(
        claimButton,
        transcriptButton,
        closeButton
      );

      await ticketChannel.send({
        embeds: [ticketEmbed],
        components: [buttonRow],
      });

      // Set cooldown
      ticketCooldowns.set(user.id, Date.now() + COOLDOWN_TIME);

      await interaction.reply({
        content: `✅ تم إنشاء التذكرة الخاصة بك! [${ticketChannel}] (التذكرة رقم ${ticketNumber})`,
        ephemeral: true,
      });
    }

    if (interaction.isButton()) {
      const ticketChannel = interaction.channel;
      const ticketData = client.ticketStats.ticketHistory.find(
        (t) => t.channelId === ticketChannel.id
      );

      if (!ticketData) return;

      switch (interaction.customId) {
        case "close_ticket":
          const closeEmbed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setDescription("🔒 جارِ إغلاق التذكرة خلال 5 ثوانٍ...");

          // Update ticket data
          ticketData.status = "closed";
          ticketData.closedAt = new Date().toISOString();

          // Update statistics
          client.ticketStats.activeTickets--;
          client.ticketStats.resolvedTickets++;

          // Save updated stats
          saveStats(client.ticketStats);

          await interaction.reply({ embeds: [closeEmbed] });
          setTimeout(() => ticketChannel.delete(), 5000);
          break;

        case "claim_ticket":
          const supporter = interaction.member;

          // Update ticket data
          ticketData.claimedBy = supporter.user.tag;
          saveStats(client.ticketStats);

          const claimEmbed = new EmbedBuilder()
            .setColor(Colors.Green)
            .setDescription(`✅ تم استلام التذكرة من قبل ${supporter}`);

          await interaction.reply({ embeds: [claimEmbed] });
          break;

        case "save_transcript":
          const messages = await ticketChannel.messages.fetch();
          const transcript = messages
            .map(
              (m) =>
                `${m.author.tag} (${m.createdAt.toLocaleString("ar-SA")}): ${
                  m.content
                }`
            )
            .reverse()
            .join("\n");

          transcripts.set(ticketChannel.id, transcript);

          // Save transcript to ticket data
          ticketData.transcript = transcript;
          saveStats(client.ticketStats);

          const transcriptEmbed = new EmbedBuilder()
            .setColor(Colors.Blue)
            .setDescription("📝 تم حفظ نسخة من المحادثة");

          await interaction.reply({ embeds: [transcriptEmbed] });
          break;
      }
    }
  });

  client.on("ready", async () => {
    const ticketChannel = await client.channels.fetch("1338644980998344765");
    if (!ticketChannel) return;

    // تحقق إذا كانت الرسالة قد أُرسلت من قبل
    const messages = await ticketChannel.messages.fetch({ limit: 100 });
    const existingMessage = messages.find(
      (msg) =>
        msg.embeds.length > 0 && msg.embeds[0].title === "🎫 نظام التذاكر"
    );

    // إذا كانت الرسالة موجودة، لا نقوم بإرسالها مرة أخرى
    if (existingMessage) return;

    const menuEmbed = new EmbedBuilder()
      .setColor(Colors.Blue)
      .setTitle("🎫 نظام التذاكر")
      .setDescription(
        `
        🔸 | لفتح تذكرة أضغط على الزر أدناه | 🔸
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

「🎨」• تذكرة تصميم شعار
「📦」• تذكرة تصميم بكج
「🔮」• تذكرة تصميم اخرى
「📩」• تذكرة الدعم الفني

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
        `
      );

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("ticket_menu")
      .setPlaceholder("اختر نوع التذكرة")
      .addOptions([
        {
          label: "تصميم شعار",
          value: "تصميم شعار",
          emoji: "🎨",
          description: "طلب تصميم شعار خاص",
        },
        {
          label: "تصميم بكج",
          value: "تصميم بكج",
          emoji: "📦",
          description: "طلب تصميم حزمة متكاملة",
        },
        {
          label: "تصميم أخرى",
          value: "تصميم أخرى",
          emoji: "🖌",
          description: "طلبات تصميم متنوعة",
        },
        {
          label: "الدعم الفني",
          value: "الدعم الفني",
          emoji: "📩",
          description: "مساعدة فنية وحل المشاكل",
        },
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await ticketChannel.bulkDelete(100).catch(console.error);
    await ticketChannel.send({
      embeds: [menuEmbed],
      components: [row],
    });
  });

  function saveStats(stats) {
    try {
      // Ensure data directory exists
      if (!fs.existsSync("./data")) {
        fs.mkdirSync("./data");
      }

      fs.writeFileSync(
        "./data/ticketStats.json",
        JSON.stringify(stats, null, 2)
      );
    } catch (error) {
      console.error("Error saving ticket stats:", error);
    }
  }
};
