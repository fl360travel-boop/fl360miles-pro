
import React, { useState, useEffect, useRef } from 'react';
import { AIAdvisorService, Opportunity } from '../services/ai_advisor';
import { getClients } from '../services/api'; // Assuming we can fetch clients to analyze

const AIConciergeWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ id: string, text: string, sender: 'user' | 'ai', type?: 'opportunity', data?: Opportunity }[]>([]);
    const [input, setInput] = useState('');
    const [hasUnread, setHasUnread] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial Greeting & Analysis
    useEffect(() => {
        const init = async () => {
            // Add greeting
            setMessages([
                { id: '1', text: 'Olá! Sou a Altitude AI. 🏔️\nEstou analisando sua carteira em tempo real em busca de oportunidades.', sender: 'ai' }
            ]);

            // Simulate analysis delay
            setTimeout(async () => {
                const clients = await getClients(); // Fetch current clients
                const opps = AIAdvisorService.analyzePortfolio(clients);
                const insight = await AIAdvisorService.getStrategicInsight();

                // Add Insight
                setMessages(prev => [...prev, { id: '2', text: `💡 **Insight de Mercado:**\n${insight}`, sender: 'ai' }]);

                // Add Opportunities one by one
                opps.forEach((opp, index) => {
                    setTimeout(() => {
                        setMessages(prev => [...prev, {
                            id: `opp-${index}`,
                            text: `Encontrei uma oportunidade de ${opp.priority.toUpperCase()} prioridade!`,
                            sender: 'ai',
                            type: 'opportunity',
                            data: opp
                        }]);
                        if (!isOpen) setHasUnread(true);
                    }, 3000 + (index * 2000));
                });
            }, 1500);
        };

        if (isOpen) {
            setHasUnread(false);
        }

        // Only run once on mount (simulated for now)
        // In a real app, this would subscribe to a websocket or poll
        init();
    }, []);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { id: Date.now().toString(), text: userMsg, sender: 'user' }]);
        setInput('');

        // Fake response
        setTimeout(() => {
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: 'Ainda estou em fase de aprendizado (BETA), mas já registrei seu pedido! Em breve poderei buscar passagens em tempo real para você.', sender: 'ai' }]);
        }, 1000);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-96 h-[500px] bg-slate-900 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300 backdrop-blur-md bg-opacity-95">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-900 to-slate-900 p-4 border-b border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                                <span className="material-symbols-outlined text-emerald-400">smart_toy</span>
                            </div>
                            <div>
                                <h3 className="font-black text-white text-sm tracking-wider uppercase italic">Altitude AI</h3>
                                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Online
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${msg.sender === 'user'
                                        ? 'bg-emerald-600 text-white rounded-tr-none'
                                        : 'bg-white/5 text-slate-200 rounded-tl-none border border-white/5'
                                    }`}>
                                    <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

                                    {/* Validar se é Opportunity */}
                                    {msg.type === 'opportunity' && msg.data && (
                                        <div className="mt-3 bg-black/20 rounded-xl p-3 border-l-2 border-emerald-500">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${msg.data.priority === 'alta' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                                                    }`}>
                                                    {msg.data.priority}
                                                </span>
                                                <span className="text-[9px] text-slate-500 font-bold">{msg.data.type.toUpperCase()}</span>
                                            </div>
                                            <h4 className="font-bold text-white text-xs mb-1">{msg.data.title}</h4>
                                            <p className="text-[10px] text-slate-400 mb-2">{msg.data.description}</p>
                                            {msg.data.actionUrl && (
                                                <a href={msg.data.actionUrl} className="block w-full text-center bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase py-2 rounded transition-colors">
                                                    {msg.data.actionLabel || 'Ver Detalhes'}
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-black/20 border-t border-white/5">
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Pergunte algo à Altitude..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
                            />
                            <button
                                onClick={handleSend}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-400 p-1.5 transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">send</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Toggle Button */}
            <button
                onClick={() => { setIsOpen(!isOpen); setHasUnread(false); }}
                className={`group relative size-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-slate-700 rotate-90 scale-90' : 'bg-gradient-to-tr from-emerald-600 to-emerald-400 hover:scale-110 hover:shadow-emerald-500/30'
                    }`}
            >
                {hasUnread && !isOpen && (
                    <span className="absolute -top-1 -right-1 size-4 bg-red-500 border-2 border-slate-900 rounded-full animate-bounce"></span>
                )}
                <span className="material-symbols-outlined text-white text-2xl">
                    {isOpen ? 'close' : 'smart_toy'}
                </span>

                {/* Tooltip */}
                {!isOpen && (
                    <div className="absolute right-16 bg-white text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl pointer-events-none">
                        Falar com Altitude AI
                    </div>
                )}
            </button>
        </div>
    );
};

export default AIConciergeWidget;
