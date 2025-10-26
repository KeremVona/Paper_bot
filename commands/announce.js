import { SlashCommandBuilder } from "discord.js";
import axios from "axios";

const API_URL = process.env.API_URL;
const WEB_API_KEY = process.env.WEB_API_KEY;

if (!API_URL || !WEB_API_KEY) {
  console.error("FATAL ERROR: API_URL or WEB_API_KEY not defined in .env");
}

export default {
  data: new SlashCommandBuilder()
    .setName("announce_game")
    .setDescription(
      "Announce a new Hearts of Iron 4 multiplayer game to the web hub."
    )
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription(
          "A descriptive title for the game (e.g., Historical Allies vs Axis)"
        )
        .setRequired(true)
        .setMaxLength(100)
    )
    .addStringOption((option) =>
      option
        .setName("date_time")
        .setDescription("The start date and time (e.g., 2025-11-01 19:00 EST)")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("region")
        .setDescription("The primary region/timezone for the game.")
        .setRequired(true)
        .addChoices(
          { name: "Europe (EU)", value: "EU" },
          { name: "North America (NA)", value: "NA" },
          { name: "Asia/Pacific (ASIA)", value: "ASIA" },
          { name: "Global", value: "GLOBAL" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("modpack")
        .setDescription(
          "The mod or DLC required (e.g., Kaiserreich, Road to 56, Vanilla)"
        )
        .setRequired(true)
        .setMaxLength(50)
    )
    .addIntegerOption((option) =>
      option
        .setName("slots")
        .setDescription(
          "The total number of available player slots (excluding host)."
        )
        .setRequired(true)
        .setMinValue(2)
        .setMaxValue(30)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });

    const gameData = {
      title: interaction.options.getString("title"),
      date: interaction.options.getString("date_time"),
      region: interaction.options.getString("region"),
      modPack: interaction.options.getString("modpack"),
      slotsAvailable: interaction.options.getInteger("slots"),
      hostDiscordId: interaction.user.id,
      discordServer: interaction.guild.name,
      status: "Scheduled",
    };

    try {
      const apiResponse = await axios.post(
        `${API_URL}/api/v1/games/new`,
        gameData,
        {
          headers: {
            Authorization: `Bearer ${WEB_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 5000,
        }
      );

      if (apiResponse.status >= 200 && apiResponse.status < 300) {
        const gameLink =
          apiResponse.data.gameLink || "Check the website for details.";

        const embed = {
          color: 0x00ff00,
          title: `✅ HOI4 Game Announced: ${gameData.title}`,
          fields: [
            {
              name: "Host",
              value: `<@${gameData.hostDiscordId}>`,
              inline: true,
            },
            { name: "Starts", value: gameData.date, inline: true },
            {
              name: "Slots",
              value: `${gameData.slotsAvailable} total`,
              inline: true,
            },
            { name: "Mod/DLC", value: gameData.modPack, inline: true },
            { name: "Region", value: gameData.region, inline: true },
            {
              name: "View on Hub",
              value: `[Click Here to Join](${gameLink})`,
              inline: false,
            },
          ],
          footer: {
            text: `Listing added successfully on the Hub from ${gameData.discordServer}`,
          },
        };

        await interaction.editReply({ embeds: [embed] });
      } else {
        throw new Error(
          `Web API returned status ${apiResponse.status}: ${
            apiResponse.data.message || "Unknown error."
          }`
        );
      }
    } catch (error) {
      console.error("API POST FAILED:", error.message);
      const errorMessage = `❌ Failed to list game on the hub! Check logs. Error: ${
        error.response?.data?.message || error.message
      }`;
      await interaction.editReply({ content: errorMessage });
    }
  },
};
