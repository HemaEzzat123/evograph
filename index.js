require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const axios = require("axios");

const {
  Client,
  Collection,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
  ],
  shardCount: 1,
});

client.dikr = new Collection();
client.systems = new Collection();
client.words = [];
client.buttons = new Collection();
client.modals = new Collection();

// Gemini AI Config
const API_KEY = process.env.GEMINI_API_KEY;
const CHANNEL_ID = "1340794366570266664";
const predefinedResponses = {};

const loadFiles = (directory, callback) => {
  const dirPath = path.join(__dirname, directory);
  console.log(`Looking for files in: ${dirPath}`);
  if (!fs.existsSync(dirPath)) {
    console.warn(`[Warning] Directory not found: ${directory}`);
    return;
  }

  const files = fs.readdirSync(dirPath).filter((file) => file.endsWith(".js"));
  console.log(`[Info] Loading files from ${directory}:`, files);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    try {
      const loadedFile = require(filePath);
      callback(file, loadedFile);
      console.log(`[Loaded] File: ${file}`);
    } catch (err) {
      console.error(`[Error] Failed to load file: ${filePath}`);
      console.error(err);
    }
  }
};

const loadSlashCommands = async () => {
  const commands = [];
  loadFiles("dikr", (file, command) => {
    if (command.data && typeof command.execute === "function") {
      commands.push(command.data.toJSON());
      client.dikr.set(command.data.name, command);
      console.log(`[Command] Loaded: ${command.data.name}`);
    } else {
      console.warn(
        `[Command] Skipped: ${file} (missing data or execute function)`
      );
    }
  });

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  try {
    console.log("🚀 Refreshing application (/) commands...");
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });
    console.log("✅ Successfully reloaded application (/) commands.");
  } catch (err) {
    console.error("❌ Failed to reload commands:", err);
  }
};

loadFiles("Systems", (file, system) => {
  if (system.name && typeof system.execute === "function") {
    system.execute(client);
    client.systems.set(system.name, system);
    console.log(`[System] Loaded: ${system.name}`);
  } else {
    console.warn(
      `[System] Skipped: ${file} (missing name or execute function)`
    );
  }
});

loadFiles("Buttons", (file, button) => {
  if (button.name && typeof button.execute === "function") {
    client.buttons.set(button.name, button);
    console.log(`[Button] Loaded: ${button.name}`);
  } else {
    console.warn(
      `[Button] Skipped: ${file} (missing name or execute function)`
    );
  }
});

loadFiles("Modals", (file, modal) => {
  if (modal.name && typeof modal.execute === "function") {
    client.modals.set(modal.name, modal);
    console.log(`[Modal] Loaded: ${modal.name}`);
  } else {
    console.warn(`[Modal] Skipped: ${file} (missing name or execute function)`);
  }
});

loadFiles("auto", (file, autoHandler) => {
  try {
    if (typeof autoHandler.execute === "function") {
      client.on("messageCreate", autoHandler.execute);
      console.log(`[Auto] Loaded: ${file}`);
    } else {
      console.warn(`[Auto] Skipped: ${file} (missing execute function)`);
    }
  } catch (error) {
    console.error(`[Auto] Error loading ${file}:`, error);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isCommand()) {
    const command = client.dikr.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(client, interaction);
    } catch (error) {
      console.error(`[Error] Failed to execute command:`, error);
      await interaction.reply({
        content: "❌ حدث خطأ أثناء تنفيذ الأمر.",
        ephemeral: true,
      });
    }
  } else if (interaction.isButton()) {
    const button = client.buttons.get(interaction.customId);
    if (button) {
      await button.execute(interaction);
    }
  } else if (interaction.isModalSubmit()) {
    const modal = client.modals.get(interaction.customId);
    if (modal) {
      await modal.execute(interaction);
    }
  }
});

process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled Promise Rejection:", error);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
});

// Event: Bot Ready
client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  const guildId = process.env.GUILD_ID;
  const guild = client.guilds.cache.get(guildId);

  if (guild) {
    try {
      await guild.commands.create(
        new SlashCommandBuilder()
          .setName("sendembed")
          .setDescription("📢 أرسل رسالة إيمبيد إلى أي قناة")
          .addChannelOption((option) =>
            option
              .setName("channel")
              .setDescription("📌 اختر القناة التي تريد الإرسال إليها")
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName("title")
              .setDescription("📝 عنوان الإيمبيد")
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName("color")
              .setDescription("🎨 لون الإيمبيد (Hex مثل #f1645f)")
              .setRequired(false)
          )
          .addStringOption((option) =>
            option
              .setName("thumbnail")
              .setDescription("🖼 رابط صورة مصغرة")
              .setRequired(false)
          )
          .addStringOption((option) =>
            option
              .setName("image")
              .setDescription("📸 رابط صورة رئيسية")
              .setRequired(false)
          )
          .addStringOption((option) =>
            option
              .setName("footer")
              .setDescription("📌 نص الفوتر (الأسفل)")
              .setRequired(false)
          )
          .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
      );
      console.log("✅ Successfully registered application commands.");
    } catch (error) {
      console.error("❌ Failed to register application commands:", error);
    }
  }

  loadSlashCommands().then(() => {
    client
      .login(process.env.TOKEN)
      .then(() => {
        console.log(`
    ────────────────────────────────────
    ✅ Logged in as ${client.user.tag}!
    `);
      })
      .catch((err) => {
        console.error("❌ Failed to login:", err);
      });
  });
});

// Command: Send Embed
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === "sendembed") {
    if (
      !interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)
    ) {
      return interaction.reply({
        content: "❌ ليس لديك إذن لاستخدام هذا الأمر!",
        ephemeral: true,
      });
    }

    const channel = interaction.options.getChannel("channel");
    const title = interaction.options.getString("title");
    const color = interaction.options.getString("color") || "#f1645f";
    const thumbnail = interaction.options.getString("thumbnail");
    const image = interaction.options.getString("image");
    const footer =
      interaction.options.getString("footer") ||
      `by: ${interaction.user.username}`;

    const modal = new ModalBuilder()
      .setCustomId(`embedModal-${interaction.id}`)
      .setTitle("📝 وصف الإيمبيد");

    const descriptionInput = new TextInputBuilder()
      .setCustomId("embedDescription")
      .setLabel("اكتب الوصف هنا:")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const actionRow = new ActionRowBuilder().addComponents(descriptionInput);
    modal.addComponents(actionRow);

    try {
      await interaction.showModal(modal);

      const filter = (i) =>
        i.customId === `embedModal-${interaction.id}` &&
        i.user.id === interaction.user.id;
      interaction
        .awaitModalSubmit({ filter, time: 60000 })
        .then(async (modalInteraction) => {
          const description =
            modalInteraction.fields.getTextInputValue("embedDescription");

          const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color)
            .setTimestamp();

          if (thumbnail) embed.setThumbnail(thumbnail);
          if (image) embed.setImage(image);
          if (footer)
            embed.setFooter({
              text: footer,
              iconURL: interaction.user.displayAvatarURL(),
            });

          await channel.send({ embeds: [embed] });
          await modalInteraction.reply({
            content: `✅ تم إرسال الإيمبيد إلى ${channel}!`,
            ephemeral: true,
          });
        })
        .catch(async (err) => {
          console.error(err);
          await interaction.followUp({
            content: "❌ لم يتم إدخال الوصف في الوقت المحدد!",
            ephemeral: true,
          });
        });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "❌ حدث خطأ أثناء فتح المودال!",
        ephemeral: true,
      });
    }
  }
});

// Gemini AI Message Handler
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== CHANNEL_ID) return;

  const userMessage = message.content.trim().toLowerCase();

  if (predefinedResponses[userMessage]) {
    return message.reply(predefinedResponses[userMessage]);
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${API_KEY}`,
      { contents: [{ parts: [{ text: userMessage }] }] }
    );

    const botReply = response.data.candidates[0].content.parts[0].text;
    message.reply(botReply);
  } catch (error) {
    console.error("❌ خطأ في استدعاء الذكاء الاصطناعي:", error);
    message.reply("🚫 آسف، حدث خطأ أثناء معالجة طلبك.");
  }
});

// Load Handlers and Events
require("./handlers/antiSpam")(client);
require("./handlers/antiLinks")(client);
require("./handlers/antiNuke")(client);
require("./handlers/raidProtection")(client);
require("./handlers/botProtection")(client);
require("./handlers/ownerProtection")(client);
require("./handlers/restoreRoles")(client);
require("./handlers/restoreChannels")(client);
require("./events/autoReactMessages")(client);
require("./events/allMemberMessage")(client);
require("./events/welcome")(client);
require("./events/verify")(client);
require("./events/tickets")(client);
require("./events/channelMessage")(client);
require("./events/sendMessageInChannel")(client);
require("./events/supportTickets")(client);
require("./events/help")(client);
require("./events/dmLogger")(client);
require("./events/updateChannelName")(client);
require("./commands/clearMessages")(client);
require("./voice")(client);

// Express Server for Uptime Monitoring
const app = express();
const PORT = process.env.PORT || 2000;
app.get("/", (req, res) => {
  res.send("✅ Bot is running...");
});
app.listen(PORT, () => {
  console.log(`🌍 Server is running on port ${PORT}`);
});

client.login(process.env.TOKEN);

module.exports = client;
