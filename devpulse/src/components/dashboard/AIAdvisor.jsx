import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, RotateCcw } from 'lucide-react';
import { AI_ADVISOR_RESPONSES } from '../../data/demoData';
import api from '../../services/api';

const SUGGESTIONS = [
  "What's the biggest risk?",
  "Who needs help?",
  "Are we ready for demo day?",
  "Summarize project status",
];

export default function AIAdvisor() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: AI_ADVISOR_RESPONSES['default'].response,
      confidence: AI_ADVISOR_RESPONSES['default'].confidence,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text) => {
    const query = text || input;
    if (!query.trim()) return;

    const userMsg = { role: 'user', content: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const result = await api.askAdvisor(query);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: result.response,
          confidence: result.confidence,
        },
      ]);
    } catch {
      // Fallback to local matching
      const key = Object.keys(AI_ADVISOR_RESPONSES).find((k) =>
        query.toLowerCase().includes(k)
      ) || 'default';
      const response = AI_ADVISOR_RESPONSES[key];
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.response,
          confidence: response.confidence,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        role: 'assistant',
        content: AI_ADVISOR_RESPONSES['default'].response,
        confidence: AI_ADVISOR_RESPONSES['default'].confidence,
      },
    ]);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl bg-card border border-border p-5 flex items-center justify-between glow-blue">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/15 flex items-center justify-center">
            <Bot size={20} className="text-blue-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">AI Project Advisor</p>
            <p className="text-sm text-muted-foreground">Powered by structured analysis from all engines</p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground bg-secondary border border-border hover:border-border/80 transition-colors"
        >
          <RotateCcw size={12} />
          Reset
        </button>
      </div>

      {/* Chat Area */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden" style={{ height: '500px' }}>
        <div className="h-full flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
              >
                <div className={`max-w-[85%] ${
                  msg.role === 'user'
                    ? 'bg-blue-500/10 border border-blue-500/20 rounded-2xl rounded-br-sm'
                    : 'bg-secondary border border-border rounded-2xl rounded-bl-sm'
                } px-5 py-4`}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                      <Sparkles size={13} className="text-blue-400" />
                      <span className="text-sm text-blue-400 font-medium">DevPulse AI</span>
                      {msg.confidence && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400/80 font-medium">
                          {msg.confidence}% confidence
                        </span>
                      )}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {msg.content.split('\n').map((line, j) => {
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return <p key={j} className="font-bold text-foreground mb-1">{line.replace(/\*\*/g, '')}</p>;
                      }
                      if (line.startsWith('- ') || line.startsWith('• ')) {
                        return <p key={j} className="pl-3 text-muted-foreground">{line}</p>;
                      }
                      if (line.match(/^[✅⚠️❌🔴🟡]/)) {
                        return <p key={j} className="my-0.5">{line}</p>;
                      }
                      if (line.match(/^\d+\./)) {
                        return <p key={j} className="pl-2 my-0.5 text-foreground/80">{line}</p>;
                      }
                      return <p key={j} className={line === '' ? 'h-2' : 'my-0.5'}>{line}</p>;
                    })}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start animate-slide-up">
                <div className="bg-secondary border border-border rounded-2xl rounded-bl-sm px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Sparkles size={13} className="text-blue-400 animate-spin" />
                    <span className="text-sm text-muted-foreground">Analyzing project data...</span>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          <div className="px-5 py-3 border-t border-border">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="flex-shrink-0 text-xs px-4 py-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your project..."
                className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-blue-500/30 transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 hover:bg-blue-500/20 disabled:opacity-30 transition-all"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
