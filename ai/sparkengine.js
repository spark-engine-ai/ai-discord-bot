// sparkEngine.js

import config from '../config/config.js';
import tokenCount from './tokenCount.js';

const sparkEngine = {
  sendMessage: null,
};

sparkEngine.sendMessage = async function (prompt) {
  // Count tokens in the prompt and validate input
  const tokens = tokenCount(prompt);
  const MAX_TOKENS = config.get("MAX_TOKEN");

  if (tokens > MAX_TOKENS / 2) {
    return {
      text: `Please limit your prompt to a maximum of ${parseInt(MAX_TOKENS / 2)} tokens. Thank you.`,
      usage: {},
      tokens,
    };
  }

  // Prepare system prompt
  const systemPrompt = config.get("CONVERSATION_START_PROMPT") || "You are a helpful assistant";
  const combinedPrompt = `${systemPrompt}\n\n${prompt}`;

  // Prepare the API request payload
  const data = {
    api_key: process.env.SPARK_ENGINE_API_KEY,
    project_id: process.env.PROJECT_ID, // Ensure this environment variable is set
    prompt: combinedPrompt,
  };

  try {
    let res = await fetch("https://sparkengine.ai/api/engine/completion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    res = await res.json();

    if (res.error) {
      console.error("Spark Engine API Error:", res);
      return { text: "⚠️ Error: Unable to process request.", usage: {}, tokens };
    }

    // Parse response correctly
    let text = "";
    if (Array.isArray(res.data) && res.data.length > 0) {
      text = res.data.length === 1 ? res.data[0].output : res.data.map(item => `${item.name}\n${item.output}`).join("\n\n");
    } else if (typeof res.data === "string") {
      text = res.data.trim();
    } else {
      text = "⚠️ Error: Invalid response from Spark Engine.";
    }

    return {
      text,
      usage: res.usage || {},
      tokens,
    };
  } catch (e) {
    console.error("Spark Engine Request Failed:", e);
    return { text: "⚠️ Error: Unable to connect to Spark Engine.", usage: {}, tokens };
  }
};

export async function askQuestion(question, cb, opts = {}) {
  try {
    // Extract command type if provided in opts
    const commandType = opts.commandType || "chat"; // Default to "chat"
    const modifiedQuestion = `{{${commandType}}} ${question}`;

    // Send request to Spark Engine
    const response = await sparkEngine.sendMessage(modifiedQuestion);

    if (!response.text) {
      throw new Error("No response from Spark Engine!");
    }

    cb(response.text);
  } catch (e) {
    console.error("Spark Engine error:", e);
    cb("⚠️ Oops, something went wrong!");
  }
}

export default sparkEngine;