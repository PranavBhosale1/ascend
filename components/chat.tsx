import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@radix-ui/react-tabs';
import { Input } from "@/components/ui/input";
import axios from 'axios';

interface ChatProps {
  activeVideoUrl: string;
}

const Chat: React.FC<ChatProps> = ({ activeVideoUrl }) => { 
  const [showChat, setShowChat] = useState<number>(() => Number(sessionStorage.getItem('showChat')) || 0);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>(() => JSON.parse(sessionStorage.getItem('chatMessages') || '[]'));
  const [input, setInput] = useState<string>("");
  const [transcript, setTranscript] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(() => sessionStorage.getItem('activeTab') || 'chat');

  useEffect(() => {
    sessionStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    sessionStorage.setItem('showChat', String(showChat));
  }, [showChat]);

  useEffect(() => {
    sessionStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  const fetchTranscriptAndStartChat = useCallback(async () => {
    setLoading(true);
    try {
      const transcriptResponse = await axios.post("/api/transcript", { videoUrl: activeVideoUrl });

      if (transcriptResponse.data.error) {
        setMessages([{ sender: "Geminni", text: "Error fetching transcript for the provided URL." }]);
        return;
      }

      const transcript = transcriptResponse.data.transcript || "Transcript not available.";
      setTranscript(transcript);
      setShowChat(1);
    } catch (error) {
      setMessages([{ sender: "Geminni", text: "Error: Failed to process the video and generate notes." }]);
    }
    setLoading(false);
  }, [activeVideoUrl]);

  const handleSend = useCallback(async () => {
    if (input.trim() !== "" && !loading) {
      const userMessage = input.trim();
      setMessages(prev => [...prev, { sender: "You", text: userMessage }]);
      setInput("");

      setLoading(true);

      try {
        const response = await axios.post("/api/gemini_normal", { 
          transcript,
          question: userMessage
        });

        if (response.data.answer) {
          setMessages(prev => [...prev, { sender: "Geminni", text: response.data.answer }]);
        } else {
          setMessages(prev => [...prev, { sender: "Geminni", text: "Failed to generate response." }]);
        }
      } catch (error) {
        setMessages(prev => [...prev, { sender: "Geminni", text: "Error processing your message." }]);
      }

      setLoading(false);
    }
  }, [input, loading, transcript]);

  const handleNewChat = () => {
    setShowChat(0);
    setMessages([]);
    setTranscript(null);
    sessionStorage.removeItem('chatMessages');
    sessionStorage.setItem('showChat', '0');
  };

  const ChatContent = useMemo(() => (
    showChat !== 1 ? (
      <div className="space-y-4">
        <button
          onClick={fetchTranscriptAndStartChat}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          Start chat with Geminni
        </button>
      </div>
    ) : (
      <div className="flex flex-col gap-4 h-full">
        <div className="flex-1 overflow-y-auto space-y-2 bg-gray-800 p-4 rounded-lg">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`p-2 rounded-lg shadow-sm ${message.sender === "You" ? "bg-blue-500 text-white" : "bg-gray-700 text-white"}`}
            >
              <strong>{message.sender}: </strong>{message.text}
            </div>
          ))}
          {loading && <div className="text-gray-400">Geminni is generating a response...</div>}
        </div>
        <div className="flex gap-2 mt-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 text-white"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className={`bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 ${loading && "opacity-50 cursor-not-allowed"}`}
          >
            Send
          </button>
        </div>
      </div>
    )
  ), [showChat, messages, loading, input, fetchTranscriptAndStartChat, handleSend]);

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)} className="w-full h-full text-white bg-gray-900 rounded-xl p-4">
      <TabsList className="flex mb-4 border-b border-gray-700">
        <TabsTrigger value="chat" className="text-gray-400 px-4 py-2 hover:text-white">Chat</TabsTrigger>
        <TabsTrigger value="settings" className="text-gray-400 px-4 py-2 hover:text-white">Settings</TabsTrigger>
        <button
          onClick={handleNewChat}
          className="ml-auto bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
        >
          New Chat
        </button>
      </TabsList>

      <TabsContent value="chat">{ChatContent}</TabsContent>

      <TabsContent value="settings">
        <div className="text-gray-300">Settings content here...</div>
      </TabsContent>
    </Tabs>
  );
};

export default Chat;
