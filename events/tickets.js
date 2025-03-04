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
    categories: {
      "تصميم شعار": 0,
      "تصميم بكج": 0,
      "تصميم أخرى": 0,
      "الدعم الفني": 0,
    },
  };

  // Load stats from file if exists
  try {
    const stats = require("../data/ticketStats.json");
    client.ticketStats = stats;
  } catch (err) {
    console.log("No existing ticket stats found. Creating new stats file...");
    saveStats(client.ticketStats);
  }
  const closedCategoryID = "1229478621169844244"; // استبدل هذا بالـ ID الخاص بالتصنيف الذي تريد نقل القنوات إليه عند إغلاقها

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isStringSelectMenu() && !interaction.isButton()) return;

    const guild = interaction.guild;
    const user = interaction.user;
    const categoryIDs = {
      "تصميم شعار": "1229477408420270203",
      "تصميم بكج": "1229477897358676089",
      "تصميم اخرى": "1229478088795230288",
      "الدعم الفني": "1229478152884060270",
    };

    const supportRoleId = "1341856671173181522";
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
              timeLeft / (60 * 1000)
            )} يرجى الانتظار دقيقه`,
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
      const selectedCategoryID =
        categoryIDs[selectedOption] || "1338619897634361424";

      // Increment ticket number for the selected category
      client.ticketStats.categories[selectedOption]++;
      const ticketNumber = client.ticketStats.categories[selectedOption];

      // Create new ticket entry
      const ticketData = {
        ticketId: `${selectedOption}-${ticketNumber}`, // Include category name in ticket ID
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
      const getTicketPrefix = (selectedOption) => {
        switch (selectedOption) {
          case "الدعم الفني":
            return "📩〢";
          case "تصميم بكج":
            return "📦〢";
          case "تصميم شعار":
            return "🎨〢";
          case "تصميم أخرى":
            return "🔮〢";
          default:
            return "";
        }
      };

      const ticketChannel = await guild.channels.create({
        name: `${getTicketPrefix(selectedOption)}ticket-${ticketNumber}`,
        type: 0,
        parent: selectedCategoryID,
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
      client.ticketStats.totalTickets++;
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

          await ticketChannel.setParent(closedCategoryID);
          await ticketChannel.permissionOverwrites.edit(guild.id, {
            [PermissionsBitField.Flags.SendMessages]: false, // تعطيل الكتابة
            [PermissionsBitField.Flags.ViewChannel]: false, // السماح بالمشاهدة
          });
          // Save updated stats
          saveStats(client.ticketStats);

          await interaction.reply({ embeds: [closeEmbed] });
          setTimeout(
            () => closeEmbed.setDescription("🔒 تم اغلاق التذكرة."),
            5000
          );

          break;

        case "claim_ticket":
          const supporter = interaction.member;
          if (!supporter.roles.cache.has(supportRoleId)) {
            return interaction.reply({
              content: "❌ أنت لا تملك صلاحية استلام هذه التذكرة.",
              ephemeral: true,
            });
          }
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
    const guild = client.guilds.cache.get(process.env.GUILD_ID);

    if (!ticketChannel) return;

    const menuEmbed = new EmbedBuilder()
      .setColor("#f1645f")
      .setTitle("🎫 نظام التذاكر")
      .setImage(
        "https://media.discordapp.net/attachments/1342144217111334912/1342155499751346237/9ba50bea6a418301.png?ex=67b89b37&is=67b749b7&hm=0f16b62b223ae17d8ce6d90126d27be10a1c16c7432d833a090c8500a50a42b9&=&format=webp&quality=lossless&width=1056&height=377"
      )
      .setThumbnail(guild?.iconURL({ dynamic: true }) || null)
      .setDescription(
        `
        💠 ━━━━━━ ⭑ ━━━━━━ 💠  
🔹 **| لفتح تذكرة اضغط على الزر أدناه |** 🔹  
💠 ━━━━━━ ⭑ ━━━━━━ 💠  

🎨 | **تذكرة تصميم شعار**  
📦 | **تذكرة تصميم بكج**  
🔮 | **تذكرة تصميم أخرى**  
📩 | **تذكرة الدعم الفني**  

💠 ━━━━━━ ⭑ ━━━━━━ 💠  

        `
      )
      .setFooter({
        text: "EVO GRAPH - الإبداع يبدأ هنا!",
        iconURL: guild?.iconURL({ dynamic: true }),
      });

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
    console.log(`${client.user.tag} جاهز للعمل!`);

    setInterval(async () => {
      console.log("🔔 يتم إرسال تنبيهات التذاكر المفتوحة...");

      for (const ticket of client.ticketStats.ticketHistory) {
        if (ticket.status === "active") {
          try {
            const user = await client.users.fetch(ticket.userId);
            await user.send(
              `🔔 تذكير: لديك تذكرة مفتوحة **(${ticket.ticketId})**. يرجى الرد أو إغلاقها إن لم تعد بحاجة إليها.`
            );
            console.log(`✅ تم إرسال تنبيه إلى ${user.tag}`);
          } catch (error) {
            console.log(
              `❌ فشل إرسال التنبيه إلى ${ticket.userId}: ${error.message}`
            );
          }
        }
      }
    }, 24 * 60 * 60 * 1000); // كل 24 ساعة

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
