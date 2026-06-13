"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Mic, MicOff, Volume2, VolumeX, Send, RefreshCw, 
  HelpCircle, MessageSquare, Info, ShieldAlert, BookOpen
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";

interface Message {
  sender: "user" | "bot";
  text: string;
}

export default function CivilianChat() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  
  // Chat configuration
  const [language, setLanguage] = useState<"en" | "ta" | "hi" | "te">("ta");
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [input, setInput] = useState("");

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "வணக்கம்! நான் உங்கள் சாலையின் குரல் உதவி ரோபோ. தமிழ்நாடு நெடுஞ்சாலைச் சட்டம், புகார் செயல்முறை மற்றும் பரிசுத் திட்டம் பற்றி நீங்கள் கேட்கலாம். (Hello! I am your சாலையின் குரல் AI assistant. Ask me about PWD guidelines, SLA timelines, or rewards.)"
    }
  ]);

  const [loadingResponse, setLoadingResponse] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Web Speech API recognition instances
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const sess = localStorage.getItem("roadguard_session");
    if (!sess) {
      router.push("/login");
      return;
    }
    setSession(JSON.parse(sess));

    // Scroll to bottom on mount
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [router]);

  // Scroll to bottom when messages list updates
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize Speech Recognition client side
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      
      // Set language code based on state
      const langCodeMap = { en: "en-IN", ta: "ta-IN", hi: "hi-IN", te: "te-IN" };
      rec.lang = langCodeMap[language];

      rec.onstart = () => setIsRecording(true);
      rec.onend = () => setIsRecording(false);
      rec.onerror = () => setIsRecording(false);
      
      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setInput(transcript);
      };

      recognitionRef.current = rec;
    }
  }, [language]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Voice speech recognition is not supported on this browser version.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      // Configure lang
      const langCodeMap = { en: "en-IN", ta: "ta-IN", hi: "hi-IN", te: "te-IN" };
      recognitionRef.current.lang = langCodeMap[language];
      recognitionRef.current.start();
    }
  };

  // Speaks response aloud using Web Speech Synthesis
  const speakText = (text: string) => {
    if (!voiceOutputEnabled || typeof window === "undefined" || !window.speechSynthesis) return;

    // stop any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const langCodeMap = { en: "en-IN", ta: "ta-IN", hi: "hi-IN", te: "te-IN" };
    utterance.lang = langCodeMap[language];
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Append user message
    const newMsg: Message = { sender: "user", text: textToSend };
    setMessages(prev => [...prev, newMsg]);
    setInput("");
    setLoadingResponse(true);

    try {
      const res = await fetch("http://localhost:8000/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend }),
      });
      
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      
      const replyText = data.success && data.reply ? data.reply : "Sorry, I could not process that.";
      setMessages(prev => [...prev, { sender: "bot", text: replyText }]);
      speakText(replyText);
    } catch (err) {
      const errorMsg = "I'm having trouble connecting to the server. Please try again.";
      setMessages(prev => [...prev, { sender: "bot", text: errorMsg }]);
      speakText(errorMsg);
    } finally {
      setLoadingResponse(false);
    }
  };

  const handleChipClick = (chipText: string) => {
    handleSendMessage(chipText);
  };

  // Quick reply chips based on language
  const chips = language === "ta" 
    ? ["புகார் செய்வது எப்படி?", "எனது புள்ளிகள் என்ன?", "குழிகள் சரிசெய்ய எவ்வளவு நாள் ஆகும்?"]
    : ["How to report road damage?", "How does rewards work?", "What is the pothole repair SLA timeline?"];

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-slate-800 dark:text-slate-100 flex flex-col transition-colors pb-12">
      <Navbar portal="civilian" userName={session?.name} />

      <main className="flex-1 max-w-md md:max-w-2xl w-full mx-auto px-4 mt-6 flex flex-col justify-between h-[calc(100vh-140px)]">
        
        {/* Chat Header card */}
        <div className="p-4 rounded-2xl glass border border-slate-200 dark:border-slate-800 shadow-md flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary animate-pulse">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-black text-sm dark:text-white text-secondary leading-tight">
                சாலையின் குரல் Voice Bot
              </h2>
              <span className="text-[9.5px] font-mono text-slate-500 block uppercase">PWD Regulations Assistant</span>
            </div>
          </div>

          {/* Voice Output controls & Language selector */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setVoiceOutputEnabled(!voiceOutputEnabled)}
              className={`p-1.5 rounded-lg border ${
                voiceOutputEnabled 
                  ? "bg-primary/10 border-primary/20 text-primary" 
                  : "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-850 text-slate-400"
              } transition`}
              title="Toggle Read-Aloud"
            >
              {voiceOutputEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="py-1 px-2 rounded-lg text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none"
            >
              <option value="ta">தமிழ்</option>
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="te">తెలుగు</option>
            </select>
          </div>
        </div>

        {/* Message Bubble Feed */}
        <div className="flex-1 overflow-y-auto p-4 rounded-2xl glass border border-slate-200 dark:border-slate-800 shadow-lg my-4 space-y-4 max-h-[400px]">
          {messages.map((msg, index) => {
            const isBot = msg.sender === "bot";
            return (
              <div
                key={index}
                className={`flex w-full ${isBot ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`p-3 rounded-2xl text-xs max-w-[80%] leading-relaxed shadow-sm ${
                    isBot
                      ? "bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-850 rounded-tl-none text-slate-700 dark:text-slate-200"
                      : "bg-primary text-white rounded-tr-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            );
          })}
          {loadingResponse && (
            <div className="flex justify-start">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-850 rounded-tl-none flex items-center space-x-2 text-xs text-slate-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Quick reply chips */}
        <div className="flex overflow-x-auto space-x-2 pb-2 shrink-0 max-w-full">
          {chips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleChipClick(chip)}
              className="py-1.5 px-3 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-[10px] font-semibold text-slate-650 dark:text-slate-350 whitespace-nowrap transition"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input box */}
        <div className="p-2.5 rounded-2xl glass border border-slate-200 dark:border-slate-800 flex items-center space-x-2 shrink-0">
          <button
            onClick={toggleRecording}
            className={`p-2.5 rounded-xl border transition ${
              isRecording 
                ? "bg-danger text-white border-danger animate-pulse" 
                : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-450"
            }`}
            title="Voice Record (Web Speech)"
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <input
            type="text"
            placeholder={language === "ta" ? "இங்கு தட்டச்சு செய்யவும்..." : "Ask AI chatbot about road standards..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage(input);
            }}
            className="flex-grow py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none text-xs focus:border-primary transition"
          />
          <button
            onClick={() => handleSendMessage(input)}
            className="p-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white transition shadow-md shadow-primary/10"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </main>
    </div>
  );
}
