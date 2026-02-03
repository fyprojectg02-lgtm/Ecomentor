"use client";
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { MessageSquare } from 'lucide-react';

export default function RealtimeChat() {
    const timer = useRef(null);
    const socket = useRef(null);
    const messagesEndRef = useRef(null);

    const [userName, setUserName] = useState('');
    const [showNamePopup, setShowNamePopup] = useState(true);
    const [inputName, setInputName] = useState('');
    const [typers, setTypers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');

    useEffect(() => {
        if (userName) {
            socket.current = io('https://ecomentor-2.onrender.com');

            socket.current.on('connect', () => {
                console.log('Connected to chat server');
                socket.current.emit('joinRoom', userName);
            });

            socket.current.on('roomNotice', (joinedUserName) => {
                const systemMsg = {
                    id: Date.now() + Math.random(),
                    sender: 'system',
                    text: `${joinedUserName} joined the chat`,
                    ts: Date.now()
                };
                setMessages((prev) => [...prev, systemMsg]);
            });

            socket.current.on('chatMessage', (msg) => {
                setMessages((prev) => [...prev, msg]);
            });

            socket.current.on('typing', (typingUserName) => {
                setTypers((prev) => {
                    const isExist = prev.find((typer) => typer === typingUserName);
                    if (!isExist) {
                        return [...prev, typingUserName];
                    }
                    return prev;
                });
            });

            socket.current.on('stopTyping', (typingUserName) => {
                setTypers((prev) => prev.filter((typer) => typer !== typingUserName));
            });

            return () => {
                if (socket.current) {
                    socket.current.off('roomNotice');
                    socket.current.off('chatMessage');
                    socket.current.off('typing');
                    socket.current.off('stopTyping');
                    socket.current.disconnect();
                }
            };
        }
    }, [userName]);

    useEffect(() => {
        if (text && socket.current && userName) {
            socket.current.emit('typing', userName);
            clearTimeout(timer.current);

            timer.current = setTimeout(() => {
                socket.current.emit('stopTyping', userName);
            }, 1000);
        }

        return () => {
            clearTimeout(timer.current);
        };
    }, [text, userName]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    function formatTime(ts) {
        const d = new Date(ts);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
    }

    function handleNameSubmit(e) {
        e.preventDefault();
        const trimmed = inputName.trim();
        if (!trimmed) return;
        setUserName(trimmed);
        setShowNamePopup(false);
    }

    function sendMessage() {
        const t = text.trim();
        if (!t || !socket.current) return;

        const msg = {
            id: Date.now(),
            sender: userName,
            text: t,
            ts: Date.now(),
        };

        setMessages((m) => [...m, msg]);
        socket.current.emit('chatMessage', msg);
        setText('');
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    return (
        <div className="space-y-6">
            {/* NAME ENTRY POPUP */}
            {showNamePopup && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0b0b0b] border border-[#1a1a1a] rounded-xl shadow-2xl max-w-md p-8 w-full mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <MessageSquare className="text-emerald-500" size={24} />
                            </div>
                            <h1 className="text-xl font-semibold text-white">Community Chat</h1>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                            Enter a name to join the global eco-conversation and connect with others.
                        </p>
                        <form onSubmit={handleNameSubmit} className="mt-6">
                            <input
                                autoFocus
                                value={inputName}
                                onChange={(e) => setInputName(e.target.value)}
                                className="bg-[#0f0f0f] text-white w-full border border-[#1a1a1a] rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder-gray-600"
                                placeholder="Your chat name (e.g. Eco Warrior)"
                            />
                            <button
                                type="submit"
                                className="w-full mt-4 px-4 py-3 rounded-lg bg-emerald-600 text-white font-semibold cursor-pointer hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/20">
                                Join Chat
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* CHAT WINDOW */}
            <div className="bg-[#0b0b0b] border border-[#111] rounded-xl shadow-2xl overflow-hidden flex flex-col h-[600px]">
                {/* CHAT HEADER */}
                <div className="flex items-center gap-4 px-6 py-4 border-b border-[#1a1a1a] bg-[#0f0f0f]">
                    <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                        <MessageSquare size={24} />
                    </div>
                    <div className="flex-1">
                        <div className="text-base font-semibold text-white">
                            EcoMentor Community Chat
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs text-gray-400 font-medium">Live Discussion</span>
                        </div>
                        {typers.length > 0 && (
                            <div className="text-xs text-emerald-400 mt-1 italic animate-pulse">
                                {typers.join(', ')} {typers.length === 1 ? 'is' : 'are'} typing...
                            </div>
                        )}
                    </div>
                    {userName && (
                        <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-[#111] rounded-full border border-[#1a1a1a]">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-xs font-medium text-gray-300">
                                Joined as <span className="text-white">{userName}</span>
                            </span>
                        </div>
                    )}
                </div>

                {/* MESSAGES LIST */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#060606] custom-scrollbar">
                    {messages.map((m) => {
                        if (m.sender === 'system') {
                            return (
                                <div key={m.id} className="flex justify-center my-2">
                                    <span className="text-[11px] font-medium text-gray-500 bg-[#111] border border-[#1a1a1a] px-4 py-1 rounded-full uppercase tracking-wider">
                                        {m.text}
                                    </span>
                                </div>
                            );
                        }

                        const mine = m.sender === userName;
                        return (
                            <div
                                key={m.id}
                                className={`flex ${mine ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'} max-w-[80%]`}>
                                    {!mine && (
                                        <span className="text-[11px] font-bold text-gray-500 mb-1 ml-1 uppercase tracking-tight">
                                            {m.sender}
                                        </span>
                                    )}
                                    <div
                                        className={`p-4 rounded-2xl shadow-sm ${mine
                                                ? 'bg-emerald-600 text-white rounded-tr-none'
                                                : 'bg-[#111] text-gray-200 border border-[#1a1a1a] rounded-tl-none'
                                            }`}>
                                        <div className="break-words whitespace-pre-wrap text-[14px] leading-relaxed">
                                            {m.text}
                                        </div>
                                        <div className={`text-[10px] mt-2 flex items-center ${mine ? 'text-emerald-200 justify-end' : 'text-gray-500'}`}>
                                            {formatTime(m.ts)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* MESSAGE INPUT */}
                <div className="p-4 bg-[#0f0f0f] border-t border-[#1a1a1a]">
                    <div className="flex items-end gap-3 bg-[#060606] border border-[#1a1a1a] rounded-xl p-2 focus-within:border-emerald-500/50 transition-colors">
                        <textarea
                            rows={1}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Share your eco-thoughts..."
                            className="bg-transparent text-white flex-1 resize-none px-4 py-3 text-sm outline-none placeholder-gray-600 max-h-32"
                            disabled={!userName}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!userName || !text.trim()}
                            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-[#04210f] h-10 px-6 rounded-lg text-sm font-bold transition-all flex items-center justify-center shadow-lg shadow-emerald-900/20 active:scale-95">
                            Send
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #1a1a1a;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #252525;
                }
            `}</style>
        </div>
    );
}
