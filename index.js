import Discord from "discord.js";
import dotenv from "dotenv";
dotenv.config();
/*
const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.MessageContent,
  ],
});

client.login(process.env.TOKEN);

client.on("clientReady", () => {
  console.log("READY!");
});

client.on("messageCreate", gotMessage);

function gotMessage(msg) {
  if (msg.author.bot) {
    return;
  }
  if (msg.content === "paper") {
    msg.reply("Hey! I am paper bot");
  }
}
*/

import { Client, GatewayIntentBits, Collection } from "discord.js";
import { readdirSync } from "fs";
import path from "path";

const DISCORD_TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!DISCORD_TOKEN) {
  console.error("FATAL ERROR: DISCORD_TOKEN is not defined in .env");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
const commands = [];

const commandsPath = path.join(__dirname, "commands");
const commandFiles = readdirSync(commandsPath).filter((file) =>
  file.endsWith(".js")
);

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  } else {
    console.warn(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Global Command Registration (Uncomment this block to register the commands)
  // Note: Global registration can take up to an hour to propagate.
  /*
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);
        const rest = new (require('@discordjs/rest')).REST({ version: '10' }).setToken(DISCORD_TOKEN);

        const data = await rest.put(
            require('discord-api-types/v10').Routes.applicationCommands(CLIENT_ID),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
    */
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});

client.login(DISCORD_TOKEN);
