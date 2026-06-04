import { useState, useRef, useEffect, useCallback } from 'react';
import { rag } from '../services/api';
import { useAuth } from '../context/AuthContext';

const SECTION_LABELS = {
  '01': 'ViBe', '02': 'NOC', '03': 'Teams', '04': 'Onboarding',
  '05': 'Reports', '06': 'Finance', '07': 'Schedule', '08': 'Lab',
  '09': 'Eval', '10': 'SP', '11': 'Yaksha', '12': 'Resolver', '13': 'General'
};

const INITIAL_MSG = {
  role: 'assistant',
  text: "👋 Hi! I'm Yaksha Mini. Ask me anything about the Vicharanashala platform — onboarding, SP rules, workflow, tools, or anything in the FAQ knowledge base. I'm here to help!",
};

export default function RAGChatWidget() {
  const { user, token } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MSG]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [panelStream, setPanelStream] = useState('');
  const bottomRef = useRef(null);
  const topMaskRef = useRef(null);
  const inputRef = useRef(null);

  const scrollBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => { if (open) scrollBottom(); }, [messages, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || streaming) return;
    const userMsg = { role: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setStreaming(true);
    setPanelStream('');

    try {
      const res = await rag.chat([...messages, { role: 'user', content: userMsg.text }], token);
      if (!res.ok) throw new Error('Request failed');

      const reader = res.body.getReader();
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
          try {
            const parsed = JSON.parse(data);
            if (parsed.done) {
              setMessages(prev => [...prev, { role: 'assistant', text: panelStream }]);
              setPanelStream('');
            } else if (parsed.text) {
              setPanelStream(prev => prev + parsed.text);
              scrollBottom();
            }
          } catch {}
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I couldn't process that. Try again or ask in the Resolver!" }]);
    } finally {
      setStreaming(false);
    }
  }, [input, streaming, messages, token, panelStream]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(v => !v)}
        title={open ? 'Close AI Assistant' : 'Open AI Assistant'}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 999,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 24px rgba(99,102,241,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          transition: 'transform 0.2s, box-shadow 0.2s',
          transform: open ? 'scale(0.9)' : 'scale(1)',
        }}
      >
        {open ? '✕' : '🤖'}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: 90,
            right: 24,
            zIndex: 998,
            width: 380,
            height: 520,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 16,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🤖</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-mono)' }}>Yaksha Mini</div>
                <div style={{ fontSize: 10, opacity: 0.8, fontFamily: 'var(--font-mono)' }}>Knowledge Base Assistant</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18, opacity: 0.8, padding: 4 }}
            >✕</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', position: 'relative' }}>
            {/* Top fade mask */}
            <div ref={topMaskRef} style={{
              position: 'sticky',
              top: 0,
              left: 0,
              right: 0,
              height: 24,
              background: 'linear-gradient(to bottom, var(--color-surface), transparent)',
              zIndex: 1,
              pointerEvents: 'none',
              marginTop: -16,
              marginBottom: -8,
            }} />

            {messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              const displayText = i === messages.length - 1 && streaming && !isUser ? panelStream : (msg.text || '');

              return (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                  marginBottom: 10,
                }}>
                  {!isUser && (
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, marginRight: 6, alignSelf: 'flex-end' }}>🤖</div>
                  )}
                  <div style={{
                    maxWidth: '75%',
                    padding: '8px 12px',
                    borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: isUser ? 'var(--color-teal)' : 'var(--color-bg)',
                    color: isUser ? '#fff' : 'var(--color-text-primary)',
                    fontSize: 12,
                    lineHeight: 1.5,
                    fontFamily: 'var(--font-mono)',
                    border: `1px solid ${isUser ? 'var(--color-teal)' : 'var(--color-border)'}`,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {displayText}
                    {(streaming && i === messages.length - 1 && !isUser) && (
                      <span style={{ display: 'inline-block', width: 6, height: 12, background: 'var(--color-teal)', marginLeft: 4, animation: 'blink 0.8s infinite', verticalAlign: 'middle', borderRadius: 1 }} />
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div style={{ padding: '12px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 8, flexShrink: 0 }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything…"
              rows={1}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid var(--color-border)',
                borderRadius: 10,
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                background: 'var(--color-bg)',
                color: 'var(--color-text-primary)',
                resize: 'none',
                outline: 'none',
                maxHeight: 80,
                overflowY: 'auto',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || streaming}
              style={{
                padding: '8px 14px',
                background: input.trim() && !streaming ? 'var(--color-primary)' : 'var(--color-border)',
                color: input.trim() && !streaming ? 'var(--color-inv-text)' : 'var(--color-text-muted)',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                cursor: input.trim() && !streaming ? 'pointer' : 'not-allowed',
                flexShrink: 0,
                fontFamily: 'var(--font-mono)',
              }}
            >
              {streaming ? '…' : '➤'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </>
  );
}