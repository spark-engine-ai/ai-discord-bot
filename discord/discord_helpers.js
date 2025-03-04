import { EmbedBuilder, AttachmentBuilder } from 'discord.js'
import config from '../config/config.js';

export const MAX_RESPONSE_CHUNK_LENGTH = 1500

export function createEmbedForAskCommand(user, prompt, response) {

    response = typeof response === "string" ? response : JSON.stringify(response);

    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setAuthor({ name: user.username })
        .setTitle(prompt)
        .setDescription((response && typeof response.slice === 'function') 
        ? response.slice(0, Math.min(response.length, 4096)) 
        : "No valid response received.")
    
    if (response.length > 4096) {
        response = response.slice(4096, response.length)
        for (let i = 0; i < 10 && response.length > 0; i++) {
            embed.addFields({
                name: "",
                value: response.slice(0, Math.min(response.length, 1024))
            })
            response = response.slice(Math.min(response.length, 1024), response.length)
        }
    }

    return embed
}

export function createEmbedsForImageCommand(user, prompt, images) {
    let embeds = []
    let files = []

    if (!images || images.length === 0) {
        embeds.push(
            new EmbedBuilder()
                .setColor(0x0099FF)
                .setAuthor({ name: user.username })
                .setTitle(prompt)
                .setDescription("Image didn't generate for this prompt 😔")
        );
        return { embeds, files };
    }
    

    for (let i = 0; i < images.length; i++) {
        
        const image = images[i];
        let embed = new EmbedBuilder().setURL("https://onuryildiz.dev")

        if (i == 0) {
            embed.setColor(0x0099FF)
                .setAuthor({ name: user.username })
                .setTitle(prompt)
        }

        if (!image || typeof image !== "string" || !image.includes(",")) {
            embeds.push(
                new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setAuthor({ name: user.username })
                    .setTitle(prompt)
                    .setDescription("Invalid image format, skipping this image.")
            );
            continue;
        }        
        
        let data = image.split(",")[1]
        const buffer = Buffer.from(data, "base64")

        let attachment = new AttachmentBuilder(buffer, { name: `result${i}.jpg` })
        embed.setImage(`attachment://result${i}.jpg`)

        embeds.push(embed)
        files.push(attachment)
    }

    return {
        embeds,
        files
    }
}

export function createEmbedForRemixCommand(user, userRemix, prompt, image) {

    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setAuthor({ name: `${user.username} remixed ${userRemix.username}` })
        .setTitle(prompt)
    
    let data = image.split(",")[1]
    const buffer = Buffer.from(data, "base64")
    let attachment = new AttachmentBuilder(buffer, { name: "result0.jpg" })
    embed.setImage("attachment://result0.jpg")

    return {
        embeds:[embed],
        files:[attachment]
    }
}

export async function splitAndSendResponse(resp, user) {
    let tryCount = 3;
    if (!resp || typeof resp !== "string") {
        console.error("Invalid response received, aborting message sending.");
        return;
    }
    
    while (resp.length > 0 && tryCount > 0) {
        try {
            let end = Math.min(MAX_RESPONSE_CHUNK_LENGTH, resp.length)
            await user.send(resp.slice(0, end))
            resp = resp.slice(end, resp.length)
        } catch (e) {
            tryCount--
            console.error("splitAndSendResponse Error : " + e + " | Counter " + tryCount)
        }
    }

    if (tryCount <= 0) {
        throw "Failed to send dm."
    }
}

// This function now accepts a commandType ("chat", "image", or "video")
// and, if the response contains a URL, embeds that media in the Discord message.
export async function generateInteractionReply(interaction, user, question, commandType, content) {
    if (config.get("USE_EMBED")) {
        let embed;
        // Helper: extract the first URL found in the text
        function extractURL(text) {
            const urlRegex = /(https?:\/\/[^\s]+)/;
            const match = text.match(urlRegex);
            return match ? match[0] : null;
        }
        
        if (commandType === "image") {
            const url = extractURL(content);
            embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setAuthor({ name: user.username })
                .setTitle(question)
                .setDescription(content.replace(url ? url : "", "").trim() || "Image generated");
            if (url) {
                embed.setImage(url);
            }
        } else if (commandType === "video") {
            const url = extractURL(content);
            embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setAuthor({ name: user.username })
                .setTitle(question)
                .setDescription(content.replace(url ? url : "", "").trim() || "Video generated");
            if (url) {
                embed.setURL(url);;
            }
        } else {
            // Default for chat/search commands
            embed = createEmbedForAskCommand(user, question, content);
        }
        await interaction.editReply({ embeds: [embed] }).catch(() => {});
    } else {
        if (content.length >= MAX_RESPONSE_CHUNK_LENGTH) {
            const attachment = new AttachmentBuilder(Buffer.from(content, 'utf-8'), { name: 'response.txt' });
            await interaction.editReply({ files: [attachment] }).catch(() => {});
        } else {
            await interaction.editReply({ content }).catch(() => {});
        }
    }
}
