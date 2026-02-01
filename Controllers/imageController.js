const Image = require('../Models/Image');
const { getOpenAIClient } = require('../Configs/openai');

exports.list = async (req, res, next) => {
  try {
    const images = await Image.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ ok: true, images });
  } catch (err) {
    next(err);
  }
};

exports.generate = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ ok: false, error: 'Prompt is required' });
    }

    const openai = getOpenAIClient();
    if (!openai) {
      return res.status(500).json({ ok: false, error: 'OpenAI API not configured' });
    }

    const result = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      size: '1024x1024',
      response_format: 'b64_json',
      n: 1,
    });

    const b64 = result?.data?.[0]?.b64_json;
    if (!b64) {
      return res.status(500).json({ ok: false, error: 'Image generation failed' });
    }

    const imageDoc = await Image.create({ user: req.user.id, prompt, data: b64 });
    res.status(201).json({ ok: true, image: imageDoc });
  } catch (err) {
    next(err);
  }
};