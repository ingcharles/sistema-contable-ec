'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, HelpCircle, TrendingUp } from 'lucide-react';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}

// Base de conocimiento SRI simplificada
const SRI_KNOWLEDGE_BASE = [
    { keywords: ['honorarios', 'profesional'], respuesta: 'Para honorarios profesionales la retención de IR es del **10%** (código 303). Si es persona natural no lleva contabilidad aplica 8%.' },
    { keywords: ['arriendo', 'alquiler'], respuesta: 'Arriendo de inmuebles: retención IR **8%** (código 320) a personas naturales.' },
    { keywords: ['iva', 'retencion iva'], respuesta: 'Retenciones de IVA: 30% (bienes), 70% (servicios), 100% (profesionales o contribuyentes especiales).' },
];

export const AsistenteFloating = ({ empresaId: _empresaId }: { empresaId: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: '¡Hola! Soy tu Asistente Contable Tributario. 🤖\n\nPuedes preguntarme sobre porcentajes de retención, códigos del SRI, o datos de tu contabilidad.', sender: 'bot', timestamp: new Date() }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const processQuery = async (query: string): Promise<string> => {
        const lowerQuery = query.toLowerCase();

        // Consultas normativas
        const matchedRule = SRI_KNOWLEDGE_BASE.find(rule =>
            rule.keywords.some(keyword => lowerQuery.includes(keyword))
        );

        if (matchedRule) {
            return matchedRule.respuesta;
        }

        return "Lo siento, no tengo información específica sobre eso. Intenta con palabras clave como 'Honorarios', 'Arriendo' o 'IVA'.";
    };

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), text: inputValue, sender: 'user', timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        setTimeout(async () => {
            const responseText = await processQuery(userMsg.text);
            const botMsg: Message = { id: (Date.now() + 1).toString(), text: responseText, sender: 'bot', timestamp: new Date() };
            setMessages(prev => [...prev, botMsg]);
            setIsTyping(false);
        }, 1000);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <>
            {/* Botón Flotante */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 flex items-center gap-2 ${isOpen ? 'bg-slate-800 rotate-90 scale-0 opacity-0' : 'bg-gradient-to-r from-sri-blue to-indigo-600 hover:scale-110'}`}
            >
                <Sparkles className="text-white animate-pulse" size={24} />
            </button>

            {/* Ventana de Chat */}
            <div className={`fixed bottom-6 right-6 z-50 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`} style={{ height: '500px' }}>

                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 rounded-t-2xl flex justify-between items-center text-white shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                            <Bot size={20} className="text-sky-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Asistente Tributario</h3>
                            <p className="text-[10px] text-slate-300 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> En línea
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === 'user'
                                ? 'bg-sri-blue text-white rounded-br-none'
                                : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
                                }`}>
                                <p dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                                <span className={`text-[10px] block mt-1 ${msg.sender === 'user' ? 'text-blue-200 text-right' : 'text-slate-400'}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-white p-3 rounded-2xl rounded-bl-none border border-slate-200 shadow-sm flex gap-1">
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Suggestions */}
                {messages.length < 3 && (
                    <div className="px-4 py-2 bg-slate-50 flex gap-2 overflow-x-auto">
                        <button onClick={() => setInputValue('¿Retención honorarios?')} className="whitespace-nowrap px-3 py-1.5 bg-white border border-indigo-100 text-indigo-600 rounded-full text-xs font-medium hover:bg-indigo-50 transition-colors shadow-sm flex items-center gap-1">
                            <HelpCircle size={12} /> Ret. Honorarios
                        </button>
                        <button onClick={() => setInputValue('¿Ventas del mes?')} className="whitespace-nowrap px-3 py-1.5 bg-white border border-blue-100 text-blue-600 rounded-full text-xs font-medium hover:bg-blue-50 transition-colors shadow-sm flex items-center gap-1">
                            <TrendingUp size={12} /> Ventas
                        </button>
                    </div>
                )}

                {/* Input Area */}
                <div className="p-3 bg-white border-t border-slate-100 rounded-b-2xl">
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Escribe tu consulta tributaria..."
                            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sri-blue/20 focus:border-sri-blue outline-none transition-all"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!inputValue.trim() || isTyping}
                            className="absolute right-2 p-2 bg-sri-blue text-white rounded-lg hover:bg-sri-light disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                    <div className="text-center mt-2">
                        <p className="text-[10px] text-slate-400">
                            IA entrenada con normativa SRI Ecuador
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};
