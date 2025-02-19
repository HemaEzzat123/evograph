const { EmbedBuilder } = require("discord.js");
const canvacord = require("canvacord"); // Ensure this is imported correctly

module.exports = (client) => {
  client.on("guildMemberAdd", async (member) => {
    const channelId = "1229417339976417372"; // Replace with your channel ID
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    try {
      // Generate a welcome image using Canvacord
      const welcomeImage = await canvacord.Canvas.welcome()
        .setUsername(member.user.username) // Set the username
        .setDiscriminator(member.user.discriminator) // Set the discriminator
        .setAvatar(
          member.user.displayAvatarURL({ extension: "png", size: 512 })
        ) // Set the user's avatar
        .setMemberCount(member.guild.memberCount) // Optional: Set the server member count
        .setBackground(
          "https://cdn.discordapp.com/attachments/1024348162820935680/1340810996050169907/welcome.gif"
        ) // Set the background image (GIF)
        .setColor("border", "#ffffff") // Optional: Border color
        .setColor("usernamebox", "#000000") // Optional: Username box color
        .setColor("discriminatorbox", "#ffffff") // Optional: Discriminator box color
        .setColor("messagebox", "#ffffff") // Optional: Message box color
        .setColor("title", "#ff0000") // Optional: Title color
        .build(); // Build the image

      // Send the welcome message with the generated image
      const welcomeEmbed = new EmbedBuilder()
        .setTitle(`🎉 Welcome ${member.user.username}!`)
        .setDescription(
          `Hey <@${member.id}>, welcome to **${member.guild.name}**! We hope you have a great time here. 😊`
        )
        .setColor("#00ff00")
        .setImage("attachment://welcome-image.png"); // Attach the generated image

      // Send the embed with the attached image
      channel.send({
        embeds: [welcomeEmbed],
        files: [{ attachment: welcomeImage, name: "welcome-image.png" }],
      });

      // Optionally, send a direct message to the new member
      try {
        await member.send(
          `👋 Hey **${member.user.username}**, welcome to **${member.guild.name}**! 🎉\n\n📜 **Rules:**\n1️⃣ Be respectful\n2️⃣ No spam\n3️⃣ Follow Discord's ToS\n\nEnjoy your stay! 😊`
        );
      } catch (err) {
        console.log(`❌ Failed to send a direct message to ${member.user.tag}`);
      }
    } catch (error) {
      console.error(`❌ Error generating welcome image:`, error);
    }
  });
};
