const Chat = require('../Models/Chat');
const chatService = require('../Services/chatService');

exports.createChat = async (req, res, next) => {
  try {
    const { title = 'New Chat' } = req.body || {};
    const chat = await Chat.create({ title, user: req.user.id, messages: [] });
    res.json({ ok: true, chat });
  } catch (err) { next(err); }
};

exports.listChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({ user: req.user.id }).sort({ updatedAt: -1 }).select('_id title updatedAt');
    res.json({ ok: true, chats });
  } catch (err) { next(err); }
};

exports.getChat = async (req, res, next) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, user: req.user.id });
    if (!chat) return res.status(404).json({ ok: false, error: 'Chat not found' });
    res.json({ ok: true, chat });
  } catch (err) { next(err); }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    const chat = await Chat.findOne({ _id: req.params.id, user: req.user.id });
    if (!chat) return res.status(404).json({ ok: false, error: 'Chat not found' });

    // Append user message
    chat.messages.push({ role: 'user', content: message });

    // Build history for service
    const history = chat.messages.map((m) => ({ sender: m.role === 'user' ? 'user' : 'ai', text: m.content }));
    const reply = await chatService.generateReply(message, history);

    // Append assistant reply
    chat.messages.push({ role: 'assistant', content: reply });
    await chat.save();

    res.json({ ok: true, reply, chat });
  } catch (err) { next(err); }
};

exports.deleteChat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const chat = await Chat.findOneAndDelete({ _id: id, user: req.user.id });
    if (!chat) return res.status(404).json({ ok: false, error: 'Chat not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
};