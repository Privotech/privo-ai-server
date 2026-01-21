const OpenAI = require('openai');

let client = null;

function getOpenAIClient() {
  if (client) return client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  client = new OpenAI({ apiKey });
  return client;
}

module.exports = { getOpenAIClient };