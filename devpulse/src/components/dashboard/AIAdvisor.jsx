import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Send, Sparkles, RotateCcw, AlertTriangle, Shield, Eye, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { AI_ADVISOR_RESPONSES } from '../../data/demoData';
import api from '../../services/api';

const SUGGESTIONS = [
  "What's the biggest risk?",
  "Who needs help?",
  "Are we ready for demo day?",
  "Summarize project status",
];

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: 'Welcome to DevPulse AI Advisor. Ask me anything about your project — risks, team status, blockers, or delivery readiness.',
  confidence: null,
};

const AGENT_SUGGESTIONS = [
  "What is Ravi working on?",
  "Who is working on backend?",
  "Is anyone working on auth?",
  "Show active branches",
];

const STATUS_COLORS = {
  OPEN: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  RESOLVED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  ESCALATED: 'text-red-400 bg-red-500/10 border-red-500/20',
  NEEDS_SUPPORT: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  CONTINUE_MONITORING: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
};

export default function AIAdvisor() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState('advisor'); // 'advisor' | 'alerts' | 'work'
  const [alerts, setAlerts] = useState([]);
  const [expandedAlert, setExpandedAlert] = useState(null);
  const [alertInput, setAlertInput] = useState('');
  const [alertsLoaded, setAlertsLoaded] = useState(false);
  const messagesEndRef = useRef(null);

  // Load conversations from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('agentConversations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.messages?.length) setMessages(parsed.messages);
      }
    } catch { /* ignore */ }
  }, []);

  // Save conversations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('agentConversations', JSON.stringify({ messages }));
    } catch { /* ignore */ }
  }, [messages]);

  // Save alerts to localStorage
  useEffect(() => {
    if (alerts.length > 0) {
      try {
        localStorage.setItem('agentAlerts', JSON.stringify(alerts));
      } catch { /* ignore */ }
    }
  }, [alerts]);

  // Load alerts from localStorage on mount, then detect fresh
  const loadAlerts = useCallback(async () => {
    try {
      // Load from localStorage first
      const saved = localStorage.getItem('agentAlerts');
      if (saved) {
        setAlerts(JSON.parse(saved));
      }
      // Then trigger server-side detection
      const result = await api.detectInactivity();
      if (result.alerts?.length) {
        setAlerts(result.alerts);
      }
    } catch {
      // If server is down, use localStorage data
      try {
        const saved = localStorage.getItem('agentAlerts');
        if (saved) setAlerts(JSON.parse(saved));
      } catch { /* ignore */ }
    }
    setAlertsLoaded(true);
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Advisor chat handler (existing logic preserved) ──
  const handleSend = async (text) => {
    const query = text || input;
    if (!query.trim()) return;

    const userMsg = { role: 'user', content: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Detect if this is a work visibility query
    const isWorkQuery = /who is working|what is .+ working|anyone working|show .* branch|active branch/i.test(query);

    try {
      let result;
      if (isWorkQuery) {
        result = await api.queryWork(query);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: result.response,
            confidence: result.source === 'ai' ? 92 : 75,
            isAgent: true,
          },
        ]);
      } else {
        result = await api.askAdvisor(query);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: result.response,
            confidence: result.confidence,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I could not reach the AI service right now. Please make sure the server is running and try again.',
          confidence: null,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // ── Alert response handler ──
  const handleAlertRespond = async (alertId) => {
    if (!alertInput.trim()) return;
    setIsTyping(true);

    try {
      const result = await api.respondToAlert(alertId, alertInput);
      // Update alert in local state
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? result.alert : a))
      );
      setAlertInput('');
    } catch (err) {
      console.error('Alert respond error:', err);
    } finally {
      setIsTyping(false);
    }
  };

  // ── Escalate handler ──
  const handleEscalate = async (alertId) => {
    try {
      const result = await api.escalateAlert(alertId);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? result.alert : a))
      );
    } catch (err) {
      console.error('Escalate error:', err);
    }
  };

  const handleReset = () => {
    setMessages([WELCOME_MESSAGE]);
    localStorage.removeItem('agentConversations');
  };

  const openAlertCount = alerts.filter((a) => a.status === 'OPEN').length;

  // ── Render message content (shared) ──
  const renderContent = (content) =>
    content.split('\n').map((line, j) => {
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
    });

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

      {/* Tab Switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('advisor')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'advisor'
            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
            : 'bg-secondary text-muted-foreground border border-border hover:text-foreground'
            }`}
        >
          <Sparkles size={14} />
          Advisor
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all relative ${activeTab === 'alerts'
            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
            : 'bg-secondary text-muted-foreground border border-border hover:text-foreground'
            }`}
        >
          <AlertTriangle size={14} />
          Inactivity Alerts
          {openAlertCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
              {openAlertCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('work')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'work'
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            : 'bg-secondary text-muted-foreground border border-border hover:text-foreground'
            }`}
        >
          <Eye size={14} />
          Work Visibility
        </button>
      </div>

      {/* ────────────── ADVISOR TAB (original) ────────────── */}
      {activeTab === 'advisor' && (
        <div className="rounded-2xl bg-card border border-border overflow-hidden" style={{ height: '500px' }}>
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
                >
                  <div className={`max-w-[85%] ${msg.role === 'user'
                    ? 'bg-blue-500/10 border border-blue-500/20 rounded-2xl rounded-br-sm'
                    : 'bg-secondary border border-border rounded-2xl rounded-bl-sm'
                    } px-5 py-4`}>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                        {msg.isAgent ? (
                          <Eye size={13} className="text-emerald-400" />
                        ) : (
                          <Sparkles size={13} className="text-blue-400" />
                        )}
                        <span className={`text-sm font-medium ${msg.isAgent ? 'text-emerald-400' : 'text-blue-400'}`}>
                          {msg.isAgent ? 'DevPulse Agent' : 'DevPulse AI'}
                        </span>
                        {msg.confidence && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400/80 font-medium">
                            {msg.confidence}% confidence
                          </span>
                        )}
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {renderContent(msg.content)}
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

            <div className="px-5 py-3 border-t border-border">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {[...SUGGESTIONS, ...AGENT_SUGGESTIONS].map((s) => (
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

            <div className="p-4 border-t border-border">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your project or team..."
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
      )}

      {/* ────────────── ALERTS TAB ────────────── */}
      {activeTab === 'alerts' && (
        <div className="rounded-2xl bg-card border border-border overflow-hidden" style={{ height: '500px' }}>
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {!alertsLoaded ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Sparkles size={14} className="animate-spin" />
                    <span className="text-sm">Scanning for inactive contributors...</span>
                  </div>
                </div>
              ) : alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Shield size={32} className="text-emerald-400 mb-3" />
                  <p className="text-sm font-medium text-foreground">All Clear</p>
                  <p className="text-xs text-muted-foreground mt-1">No inactivity alerts detected. All contributors are active.</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-xl border border-border bg-secondary/50 overflow-hidden"
                  >
                    {/* Alert Header */}
                    <button
                      onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-secondary/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle size={16} className="text-amber-400" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground">
                            {alert.member.name} — {alert.hoursInactive} hours inactive
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {alert.member.role} • Last: {alert.member.lastCommitMessage || 'No commits'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_COLORS[alert.status] || STATUS_COLORS.OPEN}`}>
                          {alert.status}
                        </span>
                        {expandedAlert === alert.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </button>

                    {/* Expanded Alert Detail */}
                    {expandedAlert === alert.id && (
                      <div className="border-t border-border p-4 space-y-3">
                        {/* Conversation history */}
                        {alert.conversations?.length > 0 && (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {alert.conversations.map((conv, ci) => (
                              <div
                                key={ci}
                                className={`flex ${conv.role === 'user' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div className={`max-w-[80%] px-3 py-2 rounded-lg text-xs ${conv.role === 'user'
                                  ? 'bg-blue-500/10 border border-blue-500/20 text-blue-300'
                                  : 'bg-secondary border border-border text-muted-foreground'
                                  }`}>
                                  <div className="whitespace-pre-wrap">{renderContent(conv.content)}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Response input (only if alert is OPEN) */}
                        {alert.status === 'OPEN' && (
                          <div className="space-y-2">
                            <form
                              onSubmit={(e) => { e.preventDefault(); handleAlertRespond(alert.id); }}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="text"
                                value={alertInput}
                                onChange={(e) => setAlertInput(e.target.value)}
                                placeholder="Respond to this alert..."
                                className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-amber-500/30 transition-colors"
                              />
                              <button
                                type="submit"
                                disabled={!alertInput.trim() || isTyping}
                                className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 disabled:opacity-30 text-xs font-medium transition-all"
                              >
                                <MessageCircle size={12} />
                              </button>
                            </form>
                            <button
                              onClick={() => handleEscalate(alert.id)}
                              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                            >
                              <AlertTriangle size={11} />
                              Escalate to team lead
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Refresh button */}
            <div className="p-4 border-t border-border">
              <button
                onClick={loadAlerts}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-sm text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-all"
              >
                <RotateCcw size={13} />
                Re-scan for inactivity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────── WORK VISIBILITY TAB ────────────── */}
      {activeTab === 'work' && (
        <div className="rounded-2xl bg-card border border-border overflow-hidden" style={{ height: '500px' }}>
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages
                .filter((m) => m.isAgent || m.role === 'user')
                .length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Eye size={32} className="text-emerald-400 mb-3" />
                    <p className="text-sm font-medium text-foreground">Work Visibility Agent</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                      Ask questions like "What is Ravi working on?" or "Who is working on backend?" to get real-time insights.
                    </p>
                  </div>
                )}
            </div>

            <div className="px-5 py-3 border-t border-border">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {AGENT_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setActiveTab('advisor');
                      setTimeout(() => handleSend(s), 100);
                    }}
                    className="flex-shrink-0 text-xs px-4 py-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-border">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setActiveTab('advisor');
                  setTimeout(() => handleSend(), 100);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about team work..."
                  className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-emerald-500/30 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-30 transition-all"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
