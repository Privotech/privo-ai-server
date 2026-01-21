const chatService = require('../Services/chatService');

exports.handleChat = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;
    const reply = await chatService.generateReply(message, history);
    res.json({ ok: true, reply });
  } catch (err) {
    next(err);
  }
};