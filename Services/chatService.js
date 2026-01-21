const { getOpenAIClient } = require('../Configs/openai');

const DEFAULT_SYSTEM_PROMPT = 'You are PrivoAI, a helpful assistant. Keep responses concise and helpful for a general audience. Use bullet points where clarity improves.';

exports.generateReply = async (message, history = []) => {
  const openai = getOpenAIClient();

  // If OpenAI is not configured, fall back to a deterministic echo
  if (!openai) {
    return `I received: "${message}". Configure OPENAI_API_KEY in server/.env for real AI responses.`;
  }

  // Build messages array from history
  const messages = [
    { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
    ...history.map((h) => ({ role: h.sender === 'user' ? 'user' : 'assistant', content: h.text })),
    { role: 'user', content: message },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
    });

    const reply = completion?.choices?.[0]?.message?.content?.trim();
    return reply || 'Sorry, I could not generate a response.';
  } catch (err) {
    // Graceful fallback
    console.error('OpenAI error:', err?.message || err);
    return 'There was an issue generating the response. Please try again in a moment.';
  }
};