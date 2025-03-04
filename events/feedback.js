const { EmbedBuilder } = require("discord.js");

module.exports = (client) => {
  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const feedbackChannelId = process.env.FEEDBACK_CHANNEL_ID;

    if (!feedbackChannelId) return;

    if (message.channel.id === feedbackChannelId) {
      try {
        const embed = new EmbedBuilder()
          .setColor("#f1645f")
          .setAuthor({
            name: message.author.tag,
            iconURL: message.author.displayAvatarURL({ dynamic: true }),
          })
          .setDescription(`**> ${message.content}\n **`)
          .setTimestamp()
          .setFooter({
            text: message.guild.name,
            iconURL: message.guild.iconURL({ dynamic: true }),
          })
          .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));
        const emojiIds = [
          "1247508701388996648",
          "1247509981088059423",
          "831080943078604850",
          "831134664906506270",
          "831134664457715723",
          "920568970090790963",
        ];

        // تطبيق ردود الفعل

        await message.delete();
        const feedbackMessage = await message.channel.send({
          content: `** شكرا لمشاركتنا رأيك <@${message.author.id}> :tulip:**`,
          embeds: [embed],
        });
        for (const emojiId of emojiIds) {
          const emoji = client.emojis.cache.get(emojiId);
          if (emoji) {
            await feedbackMessage.react(emoji);
          } else {
            console.warn(`⚠️ الإيموجي بمعرف ${emojiId} غير متاح.`);
          }
        }
      } catch (error) {
        console.error("Error handling feedback:", error);
        message.channel.send(
          "An error occurred while processing your feedback."
        );
      }
    }
  });
};
