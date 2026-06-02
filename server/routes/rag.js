const express = require('express');
const auth = require('../middleware/auth');
const OAQIssue = require('../models/OAQIssue');
const User = require('../models/User');

const router = express.Router();

async function buildContext(messages) {
  const lastUserMsg = messages.filter(m => m.role === 'user').pop()?.content || '';
  const words = lastUserMsg.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  const textResults = await OAQIssue.find({
    status: 'Resolved',
    isBaseline: true,
    $or: [
      { queryText: { $regex: words.slice(0, 5).join('|'), $options: 'i' } },
      { answer: { $regex: words.slice(0, 5).join('|'), $options: 'i' } },
    ]
  })
    .sort({ upvoteCount: -1 })
    .limit(6)
    .select('queryText answer categoryTag raisedBy');

  if (textResults.length === 0) return null;

  const sections = {
    '01': 'ViBe', '02': 'NOC', '03': 'Teams', '04': 'Onboarding',
    '05': 'Reports', '06': 'Finance', '07': 'Schedule', '08': 'Lab',
    '09': 'Eval', '10': 'SP', '11': 'Yaksha', '12': 'Tracker', '13': 'General'
  };

  const ctx = textResults.map((r, i) => {
    const section = sections[r.categoryTag] || r.categoryTag;
    return `[${i + 1}] Section: ${section}\nQ: ${r.queryText}\nA: ${r.answer}`;
  }).join('\n\n');

  return `You are a helpful intern onboarding assistant. Answer based ONLY on the knowledge base below. If the answer isn't in the KB, say "I don't have that information yet — try asking in the Tracker."\n\n=== KNOWLEDGE BASE ===\n${ctx}\n=== END KB ===\n\n`;
}

router.post('/chat', auth, async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ message: 'messages array required' });

  const context = await buildContext(messages);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || !apiKey.startsWith('sk-')) {
    return res.json({ done: true, text: noGptResponse(context, messages) });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const systemMsg = context
    ? { role: 'system', content: context }
    : { role: 'system', content: 'You are a helpful intern onboarding assistant. Answer based on the available knowledge base.' };

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        stream: true,
        messages: [systemMsg, ...messages.slice(-6)],
        max_tokens: 600,
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      res.write(`data: ${JSON.stringify({ done: true, text: noGptResponse(context, messages) })}\n\n`);
      return res.end();
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, chunk } = await reader.read();
      if (done) break;

      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          break;
        }
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            res.write(`data: ${JSON.stringify({ done: false, text: content })}\n\n`);
          }
        } catch {}
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error('[RAG] stream error:', err.message);
    res.write(`data: ${JSON.stringify({ done: true, text: noGptResponse(context, messages) })}\n\n`);
    res.end();
  }
});

function noGptResponse(context, messages) {
  if (!context) return "I don't have enough information in the knowledge base to answer that. Try asking in the Tracker!";
  const lastUser = messages.filter(m => m.role === 'user').pop()?.content || '';
  const lines = context.split('\n\n').filter(l => l.startsWith('[1]') || l.startsWith('[2]') || l.startsWith('[3]'));

  if (lines.length === 0) return "I couldn't find a matching answer. Try asking in the Tracker!";

  const answerLines = lines.map(l => {
    const parts = l.split('\n');
    const q = parts[1]?.replace('Q: ', '') || '';
    const a = parts[2]?.replace('A: ', '') || '';
    return `Based on the FAQ section:\n\n**${q}**\n${a}`;
  });

  return answerLines.slice(0, 2).join('\n\n') + `\n\n_This answer is from the FAQ knowledge base. If you need more help, ask in the Tracker!_`;
}

module.exports = router;