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
            socket.current = io('http://localhost:4600');

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
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                    <div className=" rounded-xl shadow-lg max-w-md p-6">
                        <h1 className="text-xl font-semibold">Enter your chat name</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            This name will be visible to other participants in the community chat
                        </p>
                        <form onSubmit={handleNameSubmit} className="mt-4">
                            <input
                                autoFocus
                                value={inputName}
                                onChange={(e) => setInputName(e.target.value)}
                                className="text-black w-full border border-gray-200 rounded-md px-3 py-2 outline-green-500 placeholder-gray-400"
                                placeholder="Your chat name (e.g. John Doe)"
                            />
                            <button
                                type="submit"
                                className="block ml-auto mt-3 px-4 py-1.5 rounded-full bg-green-500 text-white font-medium cursor-pointer hover:bg-green-600">
                                Join Chat
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* CHAT WINDOW */}
            <div className=" rounded-lg shadow">
                {/* CHAT HEADER */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
                    <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold">
                        <MessageSquare size={20} />
                    </div>
                    <div className="flex-1">
                        <div className="text-sm font-medium text-gray-800">
                            EcoMentor Community Chat
                        </div>
                        {typers.length > 0 && (
                            <div className="text-xs text-green-600">
                                {typers.join(', ')} {typers.length === 1 ? 'is' : 'are'} typing...
                            </div>
                        )}
                    </div>
                    {userName && (
                        <div className="text-sm text-gray-500">
                            Signed in as{' '}
                            <span className="font-medium text-gray-800">
                                {userName}
                            </span>
                        </div>
                    )}
                </div>

                {/* MESSAGES LIST */}
                <div className="h-96 overflow-y-auto p-4 space-y-3 bg-gray-50">
                    {messages.map((m) => {
                        if (m.sender === 'system') {
                            return (
                                <div key={m.id} className="flex justify-center">
                                    <span className="text-xs text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                                        {m.text}
                                    </span>
                                </div>
                            );
                        }

                        const mine = m.sender === userName;
                        return (
                            <div
                                key={m.id}
                                className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-xs p-3 rounded-lg shadow-sm ${
                                        mine
                                            ? 'bg-green-600 text-white rounded-br-none'
                                            : ' text-gray-800 rounded-bl-none'
                                    }`}>
                                    <div className="break-words whitespace-pre-wrap text-sm">
                                        {m.text}
                                    </div>
                                    <div className="flex justify-between items-center mt-1 gap-8">
                                        <div className={`text-xs font-medium ${mine ? 'text-green-100' : 'text-gray-600'}`}>
                                            {m.sender}
                                        </div>
                                        <div className={`text-xs ${mine ? 'text-green-200' : 'text-gray-500'}`}>
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
                <div className="px-4 py-3 border-t border-gray-200 ">
                    <div className="flex items-center justify-between gap-3">
                        <textarea
                            rows={1}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message..."
                            className="text-black flex-1 resize-none px-4 py-3 text-sm outline-none border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            disabled={!userName}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!userName || !text.trim()}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors">
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}