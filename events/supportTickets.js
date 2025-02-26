require("dotenv");
const {
  ActionRowBuilder,
  ButtonBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  ChannelType,
  ButtonStyle,
  PermissionsBitField,
  AttachmentBuilder,
} = require("discord.js");

module.exports = (client) => {
  // Configuration
  const ticketCategory =
    process.env.TICKET_CATEGORY_ID || "1339250794419191828"; // Category ID where tickets will be created
  const staffRole = "1341856671173181522"; // Staff role ID

  const productsData = {
    لوجو: {
      price: "50 ريال",
      description: "تصميم لوجو احترافي مع تعديلات مجانية",
      image: "test.jpg",
    },
    بوستر: {
      price: "75 ريال",
      description: "تصميم بوستر إعلاني مميز",
      image: "test.jpg",
    },
    "هوية بصرية": {
      price: "200 ريال",
      description: "تصميم هوية بصرية متكاملة للعلامة التجارية",
      image: "test.jpg",
    },
    "موشن جرافيك": {
      price: "150 ريال",
      description: "تصميم فيديو موشن جرافيك مدته 30 ثانية",
      image: "test.jpg",
    },
  };

  // Create ticket button in specified channel
  client.on("ready", async () => {
    try {
      const channel = await client.channels.fetch(
        process.env.TICKET_CHANNEL_ID || "1341514865138995285"
      );
      const ticketEmbed = new EmbedBuilder()
        .setTitle("🎫 نظام التذاكر")
        .setDescription("اضغط على الزر أدناه لفتح تذكرة")
        .setColor("#3498db")
        .setFooter({
          text: "خدمة العملاء",
          iconURL: client.user.displayAvatarURL(),
        });

      const button = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("create_ticket")
          .setLabel("فتح تذكرة")
          .setEmoji("🎫")
          .setStyle(ButtonStyle.Primary)
      );

      // Fetch last 10 messages to check if button already exists
      const messages = await channel.messages.fetch({ limit: 10 });
      const botMessages = messages.filter(
        (m) => m.author.id === client.user.id
      );

      if (botMessages.size === 0) {
        await channel.send({ embeds: [ticketEmbed], components: [button] });
      }
    } catch (error) {
      console.error("Error setting up ticket button:", error);
    }
  });

  // Handle ticket button click
  client.on("interactionCreate", async (interaction) => {
    try {
      if (!interaction.isButton()) return;

      // First handle create ticket button
      if (interaction.customId === "create_ticket") {
        // Immediately defer the reply to prevent timeout
        await interaction.deferReply({ ephemeral: true });

        const ticketTypeRow = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("ticket_type")
            .setPlaceholder("اختر نوع التذكرة")
            .addOptions([
              {
                label: "سعر تصميم",
                description: "استفسار عن أسعار التصاميم المختلفة",
                value: "design_price",
                emoji: "💰",
              },
              {
                label: "دعم فني",
                description: "الحصول على مساعدة فنية",
                value: "technical_support",
                emoji: "🛠️",
              },
              {
                label: "رؤية المنتجات",
                description: "استعراض المنتجات المتاحة",
                value: "view_products",
                emoji: "👁️",
              },
            ])
        );

        await interaction.editReply({
          content: "الرجاء اختيار نوع التذكرة:",
          components: [ticketTypeRow],
          ephemeral: true,
        });
        return;
      }

      // Handle ticket close button
      if (interaction.customId === "close_ticket_button") {
        // Immediately defer the reply to prevent timeout
        await interaction.deferReply();

        // Create confirmation buttons
        const confirmRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("confirm_close")
            .setLabel("تأكيد الإغلاق")
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId("cancel_close")
            .setLabel("إلغاء")
            .setStyle(ButtonStyle.Secondary)
        );

        await interaction.editReply({
          content: "هل أنت متأكد من إغلاق هذه التذكرة؟",
          components: [confirmRow],
        });
        return;
      }

      // Handle confirmation buttons
      if (interaction.customId === "confirm_close") {
        await interaction.deferReply();
        const ticketChannel = interaction.channel;

        await interaction.editReply({ content: "جاري إغلاق التذكرة..." });

        // Save transcript if needed
        // ...

        setTimeout(async () => {
          try {
            await ticketChannel.delete();
          } catch (error) {
            console.error("Error deleting ticket channel:", error);
          }
        }, 5000);
        return;
      }

      if (interaction.customId === "cancel_close") {
        await interaction.deferUpdate();
        await interaction.editReply({
          content: "تم إلغاء إغلاق التذكرة.",
          components: [],
        });
        return;
      }
    } catch (error) {
      console.error("Error handling button interaction:", error);
      // Try to notify the user if possible
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: "حدث خطأ أثناء معالجة الطلب.",
            ephemeral: true,
          });
        } else if (interaction.deferred) {
          await interaction.editReply({
            content: "حدث خطأ أثناء معالجة الطلب.",
          });
        }
      } catch (replyError) {
        console.error("Error sending error message:", replyError);
      }
    }
  });

  // Handle selection menu interactions
  client.on("interactionCreate", async (interaction) => {
    try {
      if (!interaction.isStringSelectMenu()) return;

      if (interaction.customId === "ticket_type") {
        // Immediately defer the update to prevent timeout
        await interaction.deferUpdate();

        const ticketType = interaction.values[0];
        const userId = interaction.user.id;
        const guild = interaction.guild;

        // Create ticket channel
        try {
          // Check if user already has an open ticket
          const existingTicket = guild.channels.cache.find(
            (channel) =>
              channel.name ===
                `ticket-${interaction.user.username}-${Date.now().toString(
                  36
                )} ` && channel.parentId === ticketCategory
          );

          if (existingTicket) {
            await interaction.followUp({
              content: `لديك بالفعل تذكرة مفتوحة: <#${existingTicket.id}>`,
              ephemeral: true,
            });
            return;
          }
          const role = await guild.roles.fetch(staffRole);
          if (!role) {
            throw new Error("Staff role not found");
          }
          // Create the ticket channel
          const ticketChannel = await guild.channels.create({
            name: `ticket-${interaction.user.username}-${Date.now().toString(
              36
            )}`,
            type: ChannelType.GuildText,
            parent: ticketCategory,
            permissionOverwrites: [
              {
                id: guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel],
              },
              {
                id: userId,
                allow: [
                  PermissionsBitField.Flags.ViewChannel,
                  PermissionsBitField.Flags.SendMessages,
                  PermissionsBitField.Flags.ReadMessageHistory,
                ],
              },
              {
                id: role.id,
                allow: [
                  PermissionsBitField.Flags.ViewChannel,
                  PermissionsBitField.Flags.SendMessages,
                  PermissionsBitField.Flags.ReadMessageHistory,
                ],
              },
            ],
          });

          const closeButton = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("close_ticket_button")
              .setLabel("إغلاق التذكرة")
              .setStyle(ButtonStyle.Danger)
              .setEmoji("🔒")
          );

          // Create welcome message based on ticket type
          let welcomeEmbed;
          let components = [closeButton];

          if (ticketType === "design_price") {
            welcomeEmbed = new EmbedBuilder()
              .setTitle("🎨 استفسار عن أسعار التصميم")
              .setDescription(
                "مرحباً بك! يرجى اختيار نوع التصميم من القائمة أدناه:"
              )
              .setColor("#f1c40f")
              .setTimestamp();

            const productSelect = new ActionRowBuilder().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId("select_product")
                .setPlaceholder("اختر نوع التصميم")
                .addOptions(
                  Object.keys(productsData).map((product) => ({
                    label: product,
                    value: product,
                    description: productsData[product].description.substring(
                      0,
                      100
                    ),
                  }))
                )
            );

            components.push(productSelect);
          } else if (ticketType === "technical_support") {
            welcomeEmbed = new EmbedBuilder()
              .setTitle("🛠️ الدعم الفني")
              .setDescription(
                "مرحباً بك في قسم الدعم الفني! يرجى وصف المشكلة التي تواجهك بالتفصيل وسيقوم فريقنا بالرد عليك في أقرب وقت ممكن."
              )
              .addFields(
                {
                  name: "ساعات العمل",
                  value: "من الأحد إلى الخميس: 9 صباحاً - 5 مساءً",
                },
                {
                  name: "وقت الاستجابة",
                  value: "عادةً ما نرد خلال 24 ساعة من فتح التذكرة",
                }
              )
              .setColor("#3498db")
              .setTimestamp();
          } else if (ticketType === "view_products") {
            welcomeEmbed = new EmbedBuilder()
              .setTitle("👁️ عرض المنتجات")
              .setDescription(
                "مرحباً بك! يمكنك الاطلاع على منتجاتنا من خلال اختيار المنتج من القائمة أدناه:"
              )
              .setColor("#2ecc71")
              .setTimestamp();

            const productSelect = new ActionRowBuilder().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId("view_product")
                .setPlaceholder("اختر منتج لعرضه")
                .addOptions(
                  Object.keys(productsData).map((product) => ({
                    label: product,
                    value: product,
                    description: productsData[product].description.substring(
                      0,
                      100
                    ),
                  }))
                )
            );

            components.push(productSelect);
          }

          await ticketChannel.send({
            content: `<@${userId}> <@&${staffRole}>`,
            embeds: [welcomeEmbed],
            components: components,
          });

          await interaction.followUp({
            content: `تم إنشاء التذكرة: <#${ticketChannel.id}>`,
            ephemeral: true,
          });
        } catch (error) {
          console.error("Error creating ticket:", error);
          await interaction.followUp({
            content:
              "حدث خطأ أثناء إنشاء التذكرة، يرجى المحاولة مرة أخرى لاحقاً.",
            ephemeral: true,
          });
        }
        return;
      }

      // Handle product selection for price inquiry
      if (interaction.customId === "select_product") {
        // Immediately defer to prevent timeout
        await interaction.deferReply();

        const selectedProduct = interaction.values[0];
        const productData = productsData[selectedProduct];

        const productEmbed = new EmbedBuilder()
          .setTitle(`معلومات عن ${selectedProduct}`)
          .setDescription(productData.description)
          .addFields({ name: "السعر", value: productData.price, inline: true })
          .setColor("#e74c3c")
          .setTimestamp();

        if (productData.image) {
          try {
            const attachment = new AttachmentBuilder(
              `./assets/images/${productData.image}`
            );
            productEmbed.setImage(`attachment://${productData.image}`);
            await interaction.editReply({
              embeds: [productEmbed],
              files: [attachment],
            });
          } catch (error) {
            console.error(
              `Error attaching image for ${selectedProduct}:`,
              error
            );
            await interaction.editReply({ embeds: [productEmbed] });
          }
        } else {
          await interaction.editReply({ embeds: [productEmbed] });
        }
        return;
      }

      // Handle product viewing
      if (interaction.customId === "view_product") {
        // Immediately defer to prevent timeout
        await interaction.deferReply();

        const selectedProduct = interaction.values[0];
        const productData = productsData[selectedProduct];

        const productEmbed = new EmbedBuilder()
          .setTitle(`${selectedProduct}`)
          .setDescription(productData.description)
          .addFields({ name: "السعر", value: productData.price, inline: true })
          .setColor("#9b59b6")
          .setTimestamp();

        if (productData.image) {
          try {
            const attachment = new AttachmentBuilder(
              `./assets/images/${productData.image}`
            );
            productEmbed.setImage(`attachment://${productData.image}`);
            await interaction.editReply({
              embeds: [productEmbed],
              files: [attachment],
            });
          } catch (error) {
            console.error(
              `Error attaching image for ${selectedProduct}:`,
              error
            );
            await interaction.editReply({
              content: `عذراً، لا يمكن عرض صورة ${selectedProduct}. يرجى التواصل مع الإدارة.`,
              embeds: [productEmbed],
            });
          }
        } else {
          await interaction.editReply({ embeds: [productEmbed] });
        }
        return;
      }
    } catch (error) {
      console.error("Error handling select menu interaction:", error);
      // Try to notify the user if possible
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: "حدث خطأ أثناء معالجة الطلب.",
            ephemeral: true,
          });
        } else if (interaction.deferred) {
          await interaction.editReply({
            content: "حدث خطأ أثناء معالجة الطلب.",
          });
        }
      } catch (replyError) {
        console.error("Error sending error message:", replyError);
      }
    }
  });

  // Log for successful loading
  console.log("✅ Tickets system loaded successfully");
};
