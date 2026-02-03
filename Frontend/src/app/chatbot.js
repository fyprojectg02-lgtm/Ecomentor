import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Get current user ID to send to API for context
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Prepare history for API (excluding system prompt which is handled by server)
      const history = messages.map(msg => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }]
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          history: history,
          userId: userId
        })
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      let botReply = "Sorry, I'm having trouble connecting right now.";
      if (data.reply) {
        botReply = data.reply;
      }

      setMessages((prev) => [...prev, { text: botReply, sender: "bot" }]);
    } catch (error) {
      console.error("Error fetching response:", error);
      setMessages((prev) => [...prev, { text: "Error fetching response.", sender: "bot" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div>
      {open && (
        <div className="fixed bottom-5 right-5 w-80 bg-black/90 border-2 border-green-500 rounded-xl shadow-lg shadow-green-500/40 backdrop-blur-md p-3 flex flex-col z-50">
          {/* Header with Close Button */}
          <h2 className="text-green-500 font-bold text-center text-lg mb-2 relative">
            <svg
              className="w-6 h-6 inline-block mr-2"
              fill="#4ade80"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              stroke="#4ade80"
            >
              <g id="SVGRepo_iconCarrier">
                <path d="M21 10.975V8a2 2 0 0 0-2-2h-6V4.688c.305-.274.5-.668.5-1.11a1.5 1.5 0 0 0-3 0c0 .442.195.836.5 1.11V6H5a2 2 0 0 0-2 2v2.998l-.072.005A.999.999 0 0 0 2 12v2a1 1 0 0 0 1 1v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a1 1 0 0 0 1-1v-1.938a1.004 1.004 0 0 0-.072-.455c-.202-.488-.635-.605-.928-.632zM7 12c0-1.104.672-2 1.5-2s1.5.896 1.5 2-.672 2-1.5 2S7 13.104 7 12zm8.998 6c-1.001-.003-7.997 0-7.998 0v-2s7.001-.002 8.002 0l-.004 2zm-.498-4c-.828 0-1.5-.896-1.5-2s.672-2 1.5-2 1.5.896 1.5 2-.672 2-1.5 2z"></path>
              </g>
            </svg>
            EcoBot
            <button
              className="absolute top-0 right-0 text-green-500 hover:text-white"
              onClick={() => setOpen(false)}
            >
              ❌
            </button>
          </h2>

          {/* Messages Section */}
          <div className="h-64 overflow-y-auto p-2 border-b border-gray-700 flex-grow space-y-2">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`max-w-4/5 p-2 rounded-lg text-sm ${msg.sender === "user"
                    ? "bg-gradient-to-r from-green-600 to-green-400 text-black font-medium ml-auto"
                    : "bg-gray-800 text-white"
                  }`}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="bg-gray-800 text-white p-2 rounded-lg text-sm">EcoBot is typing...</div>
            )}
          </div>

          {/* Input and Send Button */}
          <div className="flex mt-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your progress..."
              disabled={loading}
              onKeyDown={handleKeyPress}
              className="flex-grow p-2 bg-gray-800/70 text-white border border-green-500 rounded-l-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="bg-green-500 text-black p-2 rounded-r-lg hover:bg-green-400 transition-colors"
            >
              ➡
            </button>
          </div>
        </div>
      )}

      {/* Toggle Chatbot Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-5 right-5 bg-gray-900 border-2 border-green-500 text-green-500 p-3 rounded-full shadow-md shadow-green-500/30 z-40 transition-all duration-300 hover:scale-110 ${open ? "opacity-0 pointer-events-none" : ""
          }`}
      >
        <svg
          className="w-8 h-8"
          fill="#4ade80"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          stroke="#4ade80"
        >
          <g id="SVGRepo_iconCarrier">
            <path d="M21 10.975V8a2 2 0 0 0-2-2h-6V4.688c.305-.274.5-.668.5-1.11a1.5 1.5 0 0 0-3 0c0 .442.195.836.5 1.11V6H5a2 2 0 0 0-2 2v2.998l-.072.005A.999.999 0 0 0 2 12v2a1 1 0 0 0 1 1v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a1 1 0 0 0 1-1v-1.938a1.004 1.004 0 0 0-.072-.455c-.202-.488-.635-.605-.928-.632zM7 12c0-1.104.672-2 1.5-2s1.5.896 1.5 2-.672 2-1.5 2S7 13.104 7 12zm8.998 6c-1.001-.003-7.997 0-7.998 0v-2s7.001-.002 8.002 0l-.004 2zm-.498-4c-.828 0-1.5-.896-1.5-2s.672-2 1.5-2 1.5.896 1.5 2-.672 2-1.5 2z"></path>
          </g>
        </svg>
      </button>
    </div>
  );
};

export default Chatbot;
