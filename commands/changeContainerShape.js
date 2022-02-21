const { MessageActionRow, MessageSelectMenu } = require("discord.js");
const { changeProp } = require("../controllers/servers");
const tryCatchHelper = require("../utils/tryCatchHelper");

const changeContainerShape = async (interaction, client) => {
  return new Promise(async (resolve, reject) => {
    checkAndUpload = async (url, interaction) => {
      if (url.endsWith(".jpg") || url.endsWith(".png")) {
        interaction.followUp("Changing background, please wait...");
        try {
          await changeProp(interaction.guild.id, "containerShapeCustom", url);
          await changeProp(interaction.guild.id, "containerShape", "custom");
        } catch (error) {
          interaction.followUp("An error has occured.");
          reject(error);
        }
        interaction.followUp("Custom shape applied successfully!");
        resolve();
      } else {
        interaction.followUp(`No image detected, try again.`);
        resolve();
      }
    };

    const shapeMenu = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId("select-shape")
        .setPlaceholder("Pick a shape:")
        .addOptions([
          {
            label: "Square",
            description: "Square with sharp edges",
            value: "square",
            emoji: "<:square:939934844438347856>",
          },
          {
            label: "Square rounded",
            description: "Square with very rounded edges",
            value: "square-rounded",
            emoji: "<:squarerounded:939934820715360316>",
          },
          {
            label: "Circle",
            description: "A perfect cicrle",
            value: "circle",
            emoji: "<:circle:939934789887205409>",
          },
          {
            label: "Custom Shape",
            description: "Upload a .png shape of your choosing",
            value: "custom",
            emoji: "<:shapes:939868744363163688>",
          },
        ])
    );

    const optionFilter = (option) => option.user.id === interaction.user.id;
    const filter = (message) => interaction.user.id === message.author.id;

    const [menu, error] = await tryCatchHelper(
      interaction.reply({
        content: "Pick a shape from the list below:",
        embeds: [],
        components: [shapeMenu],
        fetchReply: true,
      })
    );

    if (error) reject(error);

    const [collector, error1] = await tryCatchHelper(
      interaction.channel.createMessageComponentCollector({
        optionFilter,
        componentType: "SELECT_MENU",
        time: 45000,
        max: 1,
      })
    );

    if (error1) reject(error1);

    client.once("interactionCreate", (newInteraction) => {
      if (newInteraction.user.id !== interaction.user.id) return;
      collector.stop();
    });

    collector.on("end", (collected, endReason) => {
      if (endReason === "time") {
        interaction.followUp(
          "You took too long to make a decision, going back to menu."
        );
        resolve();
      }
      if (!menu) return;
      menu.delete();
    });

    collector.on("collect", async (option) => {
      collector.stop();
      if (!option.values.includes("custom")) {
        await changeProp(interaction.guild.id, "containerShapeCustom", "");
        await changeProp(
          interaction.guild.id,
          "containerShape",
          option.values[0]
        );
        resolve();
      } else {
        option.reply({
          content: "Please upload a valid .png link or image:",
          components: [],
        });

        const [messages, error2] = await tryCatchHelper(
          interaction.channel.awaitMessages({
            filter,
            time: 45000,
            max: 1,
          })
        );

        if (error2) reject(error2);

        if (messages.first()) {
          if (messages.first().attachments.first()) {
            const imageURL = messages.first().attachments.first().url;
            await checkAndUpload(imageURL, interaction);
          } else if (messages.first().content) {
            const imageURL = messages.first().content;
            await checkAndUpload(imageURL, interaction);
          } else {
            interaction.followUp(`No message detected, try again.`);
            resolve();
          }
        } else {
          interaction.followUp(
            "You took too long to  make a decision, going back to menu."
          );
          resolve();
        }
      }
    });
  });
};

module.exports = changeContainerShape;
