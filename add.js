const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ApplicationCommandOptionType,
  AttachmentBuilder,
} = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");
const axios = require("axios");
const QRCode = require("qrcode");
const cron = require("node-cron");
const mongoose = require("mongoose");
require("dotenv").config();

// MongoDB Models
const Invoice = mongoose.model("Invoice", {
  invoiceId: String,
  amount: Number,
  currency: String,
  username: String,
  email: String,
  description: String,
  status: String,
  createdAt: Date,
  dueDate: Date,
  userId: String,
  guildId: String,
  recurring: Boolean,
  recurringInterval: String,
});

const User = mongoose.model("User", {
  userId: String,
  isAdmin: Boolean,
  blacklisted: Boolean,
  totalTransactions: Number,
  totalAmount: Number,
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Create the client instance
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// Command definitions
const commands = [
  {
    name: "invoice",
    description: "Create a PayPal invoice",
    options: [
      {
        name: "amount",
        description: "Amount to be paid",
        type: ApplicationCommandOptionType.Number,
        required: true,
      },
      {
        name: "user",
        description: "User to invoice",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "email",
        description: "Email of the payer",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
      {
        name: "currency",
        description: "Currency code (USD, EUR, GBP)",
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
          { name: "USD", value: "USD" },
          { name: "EUR", value: "EUR" },
          { name: "GBP", value: "GBP" },
        ],
      },
      {
        name: "description",
        description: "Description of the invoice",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
      {
        name: "recurring",
        description: "Set up recurring billing",
        type: ApplicationCommandOptionType.Boolean,
        required: false,
      },
    ],
  },
  {
    name: "cancel",
    description: "Cancel an invoice",
    options: [
      {
        name: "invoice_id",
        description: "ID of the invoice to cancel",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },
  {
    name: "list",
    description: "List all pending invoices",
  },
  {
    name: "stats",
    description: "View payment statistics",
    options: [
      {
        name: "period",
        description: "Time period for statistics",
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: [
          { name: "Daily", value: "daily" },
          { name: "Weekly", value: "weekly" },
          { name: "Monthly", value: "monthly" },
        ],
      },
    ],
  },
  {
    name: "blacklist",
    description: "Manage blacklisted users",
    options: [
      {
        name: "action",
        description: "Action to perform",
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: [
          { name: "Add", value: "add" },
          { name: "Remove", value: "remove" },
          { name: "List", value: "list" },
        ],
      },
      {
        name: "user",
        description: "User to blacklist/unblacklist",
        type: ApplicationCommandOptionType.User,
        required: false,
      },
    ],
  },
];

// Register commands
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );
    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error("Error refreshing commands:", error);
  }
})();

// Utility functions
async function convertCurrency(amount, fromCurrency, toCurrency) {
  try {
    const response = await axios.get(
      `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`
    );
    return amount * response.data.rates[toCurrency];
  } catch (error) {
    console.error(`Error converting currency: ${error.message}`);
    throw error;
  }
}

async function getPayPalAccessToken() {
  try {
    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString("base64");

    const response = await axios.post(
      "https://api-m.paypal.com/v1/oauth2/token",
      "grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error(`Error getting PayPal token: ${error.message}`);
    throw error;
  }
}

async function createPayPalInvoice(
  amount,
  email,
  description = "Service Payment",
  currency = "USD"
) {
  try {
    const token = await getPayPalAccessToken();

    const invoiceData = {
      detail: {
        invoice_number: `INV-${Date.now()}`,
        currency_code: currency,
        payment_term: {
          term_type: "DUE_ON_RECEIPT",
        },
      },
      invoicer: {
        business_name: process.env.BUSINESS_NAME || "Your Business Name",
        email_address: process.env.BUSINESS_EMAIL,
        logo_url: process.env.BUSINESS_LOGO_URL,
      },
      primary_recipients: [
        {
          billing_info: {
            email_address: email,
          },
        },
      ],
      items: [
        {
          name: description,
          description: description,
          quantity: "1",
          unit_amount: {
            currency_code: currency,
            value: amount.toString(),
          },
        },
      ],
      configuration: {
        allow_tip: true,
        tax_calculated_after_discount: true,
        tax_inclusive: false,
      },
    };

    const createResponse = await axios.post(
      "https://api-m.paypal.com/v2/invoicing/invoices",
      invoiceData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
      }
    );

    const invoiceId = createResponse.data.id;

    await axios.post(
      `https://api-m.paypal.com/v2/invoicing/invoices/${invoiceId}/send`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      id: invoiceId,
      status: createResponse.data.status,
      url: `https://www.paypal.com/invoice/p/#${invoiceId}`,
    };
  } catch (error) {
    console.error(`Error in createPayPalInvoice: ${error.message}`);
    throw error;
  }
}

async function cancelPayPalInvoice(invoiceId) {
  try {
    const token = await getPayPalAccessToken();

    const getInvoiceResponse = await axios.get(
      `https://api-m.paypal.com/v2/invoicing/invoices/${invoiceId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (getInvoiceResponse.data.status === "CANCELLED") {
      return { success: false, message: "Invoice is already cancelled" };
    }

    if (getInvoiceResponse.data.status === "PAID") {
      return { success: false, message: "Cannot cancel a paid invoice" };
    }

    const cancelRequest = {
      subject: "Invoice Cancelled",
      note: "This invoice has been cancelled by the merchant.",
      send_to_invoicer: true,
      send_to_recipient: true,
    };

    await axios.post(
      `https://api-m.paypal.com/v2/invoicing/invoices/${invoiceId}/cancel`,
      cancelRequest,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    await Invoice.findOneAndUpdate(
      { invoiceId },
      {
        status: "CANCELLED",
        updatedAt: new Date(),
      }
    );

    return { success: true, message: "Invoice cancelled successfully" };
  } catch (error) {
    console.error("Error cancelling PayPal invoice:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error cancelling invoice",
    };
  }
}

// Command handlers
async function handleInvoiceCreation(interaction) {
  const amount = interaction.options.getNumber("amount");
  const targetUser = interaction.options.getUser("user");
  const email = interaction.options.getString("email") || "";
  const currency = interaction.options.getString("currency") || "USD";
  const description = interaction.options.getString("description") || "Payment";
  const recurring = interaction.options.getBoolean("recurring") || false;

  try {
    const invoice = await createPayPalInvoice(
      amount,
      email || "no-email@provided.com",
      description,
      currency
    );

    const newInvoice = new Invoice({
      invoiceId: invoice.id,
      amount,
      currency,
      email,
      description,
      status: invoice.status,
      createdAt: new Date(),
      dueDate: new Date(),
      userId: targetUser.id,
      guildId: interaction.guild.id,
      recurring,
    });

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle("فاتورة PayPal")
      .addFields(
        { name: "إجمالي المبلغ المستحق:", value: `$${amount}`, inline: true },
        { name: "Invoice Number", value: invoice.id, inline: true },
        {
          name: "Website",
          value: `[Visit Website](${process.env.BUSINESS_WEBSITE})`,
        },
        { name: "Status", value: "SENT", inline: true },
        { name: "User", value: `<@${targetUser.id}>`, inline: true },
        { name: "Description", value: description, inline: false }
      )
      .setTimestamp();

    const image = new AttachmentBuilder("./evo.jpg");
    embed.setImage("attachment://evo.jpg");
    const viewButton = new ButtonBuilder()
      .setLabel("عرض الفاتورة")
      .setStyle(ButtonStyle.Link)
      .setURL(invoice.url);

    const cancelButton = new ButtonBuilder()
      .setLabel("الغاء الفاتورة")
      .setStyle(ButtonStyle.Danger)
      .setCustomId("cancel_invoice");

    const row = new ActionRowBuilder().addComponents(viewButton, cancelButton);

    await interaction.reply({
      content: `${targetUser}`,
      embeds: [embed],
      components: [row],
      files: [image],
    });

    await newInvoice.save();
  } catch (error) {
    console.error("Error in handleInvoiceCreation:", error);
    await interaction.reply({
      content: "An error occurred while creating the invoice.",
      ephemeral: true,
    });
  }
}

async function handleInvoiceListing(interaction) {
  try {
    const invoices = await Invoice.find({
      status: { $nin: ["PAID", "CANCELLED"] },
    });

    const embed = new EmbedBuilder()
      .setTitle("Pending Invoices")
      .setDescription("List of all pending invoices for your guild.")
      .setColor("#ffcc00");

    if (!invoices.length) {
      embed.setDescription("No pending invoices found.");
    } else {
      invoices.forEach((invoice) => {
        embed.addFields({
          name: invoice.invoiceId,
          value: `${invoice.amount} ${invoice.currency}`,
        });
      });
    }

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    await interaction.reply({
      content: "An error occurred while fetching invoices.",
      ephemeral: true,
    });
  }
}

async function handleStats(interaction) {
  const period = interaction.options.getString("period");

  try {
    const stats = await generateStatistics(period);
    const embed = new EmbedBuilder()
      .setTitle(`Statistics (${period})`)
      .setDescription(`Total Amount: $${stats.totalAmount}`)
      .addFields(
        { name: "Invoices", value: stats.count.toString() },
        { name: "Conversion Rate", value: `${stats.conversionRate}%` }
      );

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    await interaction.reply({
      content: "An error occurred while fetching statistics.",
      ephemeral: true,
    });
  }
}

async function handleBlacklist(interaction) {
  const action = interaction.options.getString("action");
  const user = interaction.options.getUser("user");

  try {
    if (action === "add") {
      const foundUser = await User.findOne({ userId: user.id });
      if (foundUser && foundUser.blacklisted) {
        return await interaction.reply({
          content: "User is already blacklisted.",
          ephemeral: true,
        });
      }

      await User.updateOne(
        { userId: user.id },
        { $set: { blacklisted: true } },
        { upsert: true }
      );
      return await interaction.reply({
        content: `User ${user.tag} has been blacklisted.`,
      });
    }

    if (action === "remove") {
      const foundUser = await User.findOne({ userId: user.id });
      if (!foundUser || !foundUser.blacklisted) {
        return await interaction.reply({
          content: "User is not blacklisted.",
          ephemeral: true,
        });
      }

      await User.updateOne(
        { userId: user.id },
        { $set: { blacklisted: false } }
      );
      return await interaction.reply({
        content: `User ${user.tag} has been removed from the blacklist.`,
      });
    }

    if (action === "list") {
      const blacklistedUsers = await User.find({ blacklisted: true });
      if (blacklistedUsers.length === 0) {
        return await interaction.reply({
          content: "No blacklisted users found.",
          ephemeral: true,
        });
      }

      const userList = blacklistedUsers
        .map((user) => `<@${user.userId}>`)
        .join("\n");
      return await interaction.reply({
        content: `Blacklisted users:\n${userList}`,
      });
    }
  } catch (error) {
    console.error("Error in handleBlacklist:", error);
    await interaction.reply({
      content: "An error occurred while managing blacklisted users.",
      ephemeral: true,
    });
  }
}

// Statistics generation
async function generateStatistics(period) {
  try {
    const now = new Date();
    let startDate;

    switch (period) {
      case "daily":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "weekly":
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case "monthly":
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
    }

    const invoices = await Invoice.find({
      createdAt: { $gte: startDate },
      status: "PAID",
    });

    return {
      totalAmount: invoices.reduce((sum, inv) => sum + inv.amount, 0),
      count: invoices.length,
      conversionRate: await calculateConversionRate(startDate),
    };
  } catch (error) {
    console.error(`Error generating statistics: ${error.message}`);
    throw error;
  }
}

async function calculateConversionRate(startDate) {
  try {
    const totalInvoices = await Invoice.countDocuments({
      createdAt: { $gte: startDate },
    });
    const paidInvoices = await Invoice.countDocuments({
      createdAt: { $gte: startDate },
      status: "PAID",
    });

    return totalInvoices ? (paidInvoices / totalInvoices) * 100 : 0;
  } catch (error) {
    console.error(`Error calculating conversion rate: ${error.message}`);
    throw error;
  }
}

// Event handlers
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Command handler
client.on("interactionCreate", async (interaction) => {
  if (interaction.isCommand()) {
    const { commandName } = interaction;

    switch (commandName) {
      case "invoice":
        await handleInvoiceCreation(interaction);
        break;
      case "list":
        await handleInvoiceListing(interaction);
        break;
      case "stats":
        await handleStats(interaction);
        break;
      case "blacklist":
        await handleBlacklist(interaction);
        break;
    }
  }

  // Handle button interactions
  if (interaction.isButton() && interaction.customId === "cancel_invoice") {
    try {
      // Extract invoice ID from the message embed
      const invoiceId = interaction.message.embeds[0].fields.find(
        (field) => field.name === "Invoice Number"
      )?.value;

      if (!invoiceId) {
        await interaction.reply({
          content: "خطأ: لم يتم العثور على رقم الفاتورة.",
          ephemeral: true,
        });
        return;
      }

      // Call the cancel function
      const cancelResult = await cancelPayPalInvoice(invoiceId);

      if (cancelResult.success) {
        const successEmbed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle("تم إلغاء الفاتورة")
          .addFields(
            { name: "رقم الفاتورة", value: invoiceId },
            { name: "الحالة", value: "ملغاة" }
          )
          .setTimestamp();

        await interaction.update({
          embeds: [successEmbed],
          components: [],
        });
      } else {
        await interaction.reply({
          content: `خطأ في إلغاء الفاتورة: ${cancelResult.message}`,
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error("Error when handling cancel button:", error);
      await interaction.reply({
        content: "حدث خطأ أثناء إلغاء الفاتورة. الرجاء المحاولة مرة أخرى.",
        ephemeral: true,
      });
    }
  }
});

// Recurring invoice scheduler
cron.schedule("0 0 * * *", async () => {
  try {
    const recurringInvoices = await Invoice.find({ recurring: true });
    for (const invoice of recurringInvoices) {
      await createPayPalInvoice(
        invoice.amount,
        invoice.email,
        invoice.description,
        invoice.currency
      );
    }
  } catch (error) {
    console.error(`Error scheduling recurring invoices: ${error.message}`);
  }
});

// Client login
client.login(process.env.TOKEN);
