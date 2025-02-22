import { REST, Routes } from 'discord.js'

import { askQuestion } from '../ai/sparkengine.js';
import { generateInteractionReply } from './discord_helpers.js';

export const commands = [
    {
        name: 'chat',
        description: 'Chat with the assistant',
        options: [
            {
                name: "message",
                description: "Your message",
                type: 3,
                required: true
            }
        ]
    },
    {
        name: 'video',
        description: 'Generate a 5s long video',
        options: [
            {
                name: "prompt",
                description: "Your prompt",
                type: 3,
                required: true
            }
        ]
    },
    {
        name: 'search',
        description: 'Perform a search query using Bing and AI models',
        options: [
            {
                name: "search",
                description: "Your search",
                type: 3,
                required: true
            }
        ]
    },
    {
        name: 'image',
        description: 'Generate an image using DALLE-3',
        options: [
            {
                name: "prompt",
                description: "Your prompt",
                type: 3,
                required: true
            }
        ]
    },
    {
        name: 'music',
        description: 'Generate up to 1m of audio using an .mp3 link and lyrics after it in the same message',
        options: [
            {
                name: "prompt",
                description: "Your prompt",
                type: 3,
                required: true
            }
        ]
    },
    {
        name: 'docs',
        description: 'Call our docs and find out how to use each of our nodes on Spark Engine',
        options: [
            {
                name: "prompt",
                description: "Your prompt",
                type: 3,
                required: true
            }
        ]
    }
];


export async function initDiscordCommands() {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: commands });
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
}

export async function handle_interaction_ask(interaction) {
    const user = interaction.user;
    const question = interaction.options.getString("message");
    await interaction.deferReply();

    try {
        askQuestion(question, async (content) => {
            // "chat" command – normal text embed
            generateInteractionReply(interaction, user, question, "chat", content);
        }, { commandType: "chat" });
    } catch (e) {
        console.error(e);
    }
}

export async function handle_interaction_video(interaction) {
    const user = interaction.user;
    const question = interaction.options.getString("prompt");
    await interaction.deferReply();

    try {
        askQuestion(question, async (content) => {
            // "video" command – will try to extract a video URL and embed it
            generateInteractionReply(interaction, user, question, "video", content);
        }, { commandType: "video" });
    } catch (e) {
        console.error(e);
    }
}

export async function handle_interaction_search(interaction) {
    const user = interaction.user;
    const question = interaction.options.getString("search");
    await interaction.deferReply();

    try {
        askQuestion(question, async (content) => {
            generateInteractionReply(interaction, user, question, "chat", content);
        }, { commandType: "search" });
    } catch (e) {
        console.error(e);
    }
}

export async function handle_interaction_image(interaction) {
    const user = interaction.user;
    const prompt = interaction.options.getString("prompt");
    await interaction.deferReply();

    try {
        askQuestion(prompt, async (content) => {
            // "image" command – will try to extract an image URL and embed it
            generateInteractionReply(interaction, user, prompt, "image", content);
        }, { commandType: "image" });
    } catch (e) {
        console.error(e);
    }
}

export async function handle_interaction_music(interaction) {
    const user = interaction.user;
    const prompt = interaction.options.getString("prompt");
    await interaction.deferReply();

    try {
        askQuestion(prompt, async (content) => {
            // "image" command – will try to extract a music URL and embed it
            generateInteractionReply(interaction, user, prompt, "music", content);
        }, { commandType: "music" });
    } catch (e) {
        console.error(e);
    }
}

export async function handle_interaction_docs(interaction) {
    const user = interaction.user;
    const question = interaction.options.getString("docs");
    await interaction.deferReply();

    try {
        askQuestion(question, async (content) => {
            generateInteractionReply(interaction, user, question, "chat", content);
        }, { commandType: "docs" });
    } catch (e) {
        console.error(e);
    }
}

export const commandExecuters = {
    chat: handle_interaction_ask,
    video: handle_interaction_video,
    search: handle_interaction_search,
    image: handle_interaction_image,
    docs: handle_interaction_docs,
    
    // music: handle_interaction_music,
};
