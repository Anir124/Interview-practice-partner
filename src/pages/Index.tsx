import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Volume2, Sparkles, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import WaveformVisualizer from "@/components/WaveformVisualizer";
import FloatingMicButton from "@/components/FloatingMicButton";
import QuestionNumberCard from "@/components/QuestionNumberCard";

type Message = {
  role: "user" | "assistant";
  text: string;
};

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userName = location.state?.name || "Guest";
  const difficulty = location.state?.difficulty || "Medium";
  const interviewType = location.state?.interviewType || "Sales";

  const [chatLog, setChatLog] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [isFollowUpMode, setIsFollowUpMode] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (!location.state?.name) {
      navigate("/");
      return;
    }

    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        setInput(prev => prev + " " + transcript);
        
        // Reset silence timer
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
        
        // Auto-stop after 3s of silence
        silenceTimeoutRef.current = setTimeout(() => {
          handleStopRecording();
        }, 3000);
      };

      recognitionRef.current.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          toast.error("Speech recognition error. Please try again.");
        }
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    // Start interview automatically
    setTimeout(() => {
      startInterview();
    }, 500);

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, [location.state]);

  // Auto-start recording when AI stops speaking
  useEffect(() => {
    if (!isSpeaking && interviewStarted && chatLog.length > 0 && !isLoading) {
      const lastMessage = chatLog[chatLog.length - 1];
      if (lastMessage.role === "assistant") {
        setTimeout(() => {
          handleStartRecording();
        }, 500);
      }
    }
  }, [isSpeaking, interviewStarted, chatLog.length]);

  const startInterview = async () => {
    setInterviewStarted(true);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: { 
          text: `START_INTERVIEW:${userName}:${difficulty}:${interviewType}`,
          userName,
          difficulty,
          interviewType
        },
      });

      if (error) throw error;

      const aiText = data?.text || "Hello, I'm ready to begin your interview.";
      const aiMsg: Message = { role: "assistant", text: aiText };
      setChatLog([aiMsg]);
      speak(aiText);
    } catch (error: any) {
      console.error("Start interview error:", error);
      toast.error("Failed to start interview. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartRecording = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }
    if (isRecording) return;
    
    setInput("");
    setIsRecording(true);
    
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    
    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error("Recognition start error:", error);
    }
  };

  const handleStopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      
      // Auto-submit if there's input
      setTimeout(() => {
        if (input.trim()) {
          handleSubmit();
        }
      }, 100);
    }
  };

  const speak = (text: string) => {
    if (!synthRef.current) return;

    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    const voices = synthRef.current.getVoices();
    if (voices.length > 0) utterance.voice = voices[0];

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: "user", text: input.trim() };
    setChatLog(prev => [...prev, userMsg]);
    const currentInput = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: { 
          text: currentInput,
          userName,
          difficulty,
          interviewType,
          questionNumber: isFollowUpMode ? questionNumber : questionNumber + 1,
          conversationHistory: chatLog,
          isFollowUp: isFollowUpMode
        },
      });

      if (error) throw error;

      const aiText = data?.text || "Thank you for your response.";
      const isGoodbye = data?.isGoodbye || false;
      const isFollowUp = data?.isFollowUp || false;
      const shouldIncrementQuestion = data?.shouldIncrementQuestion !== false;
      
      const aiMsg: Message = { role: "assistant", text: aiText };
      setChatLog(prev => [...prev, aiMsg]);

      speak(aiText);
      
      // If it's a goodbye message, wait for TTS to finish then get feedback
      if (isGoodbye) {
        setTimeout(async () => {
          try {
            const { data: feedbackData, error: feedbackError } = await supabase.functions.invoke("chat", {
              body: { 
                text: "END_INTERVIEW",
                userName,
                difficulty,
                interviewType,
                conversationHistory: [...chatLog, userMsg, aiMsg]
              },
            });

            if (feedbackError) throw feedbackError;

            const feedback = feedbackData?.text || "Thank you for participating in this interview.";
            navigate("/feedback", { state: { feedback } });
          } catch (error) {
            console.error("Feedback error:", error);
            navigate("/feedback", { state: { feedback: "Thank you for participating in this interview." } });
          }
        }, 3000); // Wait for goodbye message to be spoken
        return;
      }
      
      // Update question number and follow-up mode
      setIsFollowUpMode(isFollowUp);
      if (shouldIncrementQuestion && !isFollowUp) {
        setQuestionNumber(prev => prev + 1);
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      if (error.message?.includes("429")) {
        toast.error("Rate limit exceeded. Please try again in a moment.");
      } else if (error.message?.includes("402")) {
        toast.error("AI usage limit reached. Please add credits to your workspace.");
      } else {
        toast.error("Failed to get response. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndInterview = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: { 
          text: "END_INTERVIEW",
          userName,
          difficulty,
          interviewType,
          questionNumber,
          conversationHistory: chatLog
        },
      });

      if (error) throw error;

      const feedback = data?.text || "Thank you for participating in this interview.";
      navigate("/feedback", { state: { feedback } });
    } catch (error: any) {
      console.error("End interview error:", error);
      toast.error("Failed to end interview properly.");
      navigate("/feedback", { state: { feedback: "Thank you for participating in this interview." } });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px] -z-10" />

      {/* Header */}
      <header className="pt-8 pb-6 px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Interview Session
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  {userName} • {interviewType} • {difficulty} Level
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="px-6 py-2 rounded-full bg-primary/20 text-primary hover:bg-primary/30 font-medium transition-all"
              >
                {showTranscript ? "Hide" : "Show"} Transcript
              </button>
              <button
                onClick={handleEndInterview}
                className="px-6 py-2 rounded-full bg-destructive/20 text-destructive hover:bg-destructive/30 font-medium transition-all flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                End Interview
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Live Transcript */}
      {showTranscript && (
        <div className="fixed right-8 top-24 w-80 max-h-[calc(100vh-200px)] z-50">
          <Card className="glass-panel-strong rounded-3xl p-6 border-none overflow-hidden">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-primary" />
              Live Transcript
            </h3>
            <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
              {chatLog.map((msg, idx) => (
                <div key={idx} className="text-sm">
                  <div className={`font-semibold mb-1 ${msg.role === "user" ? "text-accent" : "text-primary"}`}>
                    {msg.role === "user" ? "You" : "AI"}:
                  </div>
                  <div className="text-foreground/80 leading-relaxed">{msg.text}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-8 pb-8 space-y-6">

        {/* Chat Messages with Question Number */}
        <div className="flex gap-6">
          {/* Question Number - Left Side */}
          {questionNumber > 0 && (
            <div className="flex-shrink-0">
              <QuestionNumberCard questionNumber={questionNumber} interviewType={interviewType} />
            </div>
          )}
          
          {/* Chat Messages */}
          <Card className="glass-panel-strong rounded-3xl p-8 min-h-[400px] max-h-[500px] overflow-y-auto border-none flex-1">
          <div className="space-y-4">
            {chatLog.length === 0 && !isLoading && (
              <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Volume2 className="w-10 h-10 text-primary" />
                </div>
                <p className="text-xl font-semibold mb-2">Starting your interview...</p>
              </div>
            )}
            {chatLog.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-6 py-4 rounded-3xl ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow"
                      : "glass-panel text-foreground"
                  }`}
                >
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        </div>

        {/* Input Area */}
        <Card className="glass-panel-strong rounded-3xl p-6 border-none">
          <div className="space-y-4">
            {/* Recording Indicator */}
            {isRecording && (
              <div>
                <WaveformVisualizer />
                <p className="text-center text-sm text-primary font-medium mt-2">
                  Listening...
                </p>
              </div>
            )}

            {/* Text Input */}
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your answer or use the microphone..."
              className="min-h-[100px] bg-background/50 border-border/50 rounded-2xl resize-none text-base focus:ring-2 focus:ring-primary/50"
              disabled={isLoading || isRecording}
            />

            {/* Bottom Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FloatingMicButton
                  isRecording={isRecording}
                  onStart={handleStartRecording}
                  onStop={handleStopRecording}
                  disabled={isLoading}
                />
                
                {isSpeaking && (
                  <div className="flex items-center gap-2 text-primary">
                    <Volume2 className="w-5 h-5 animate-pulse" />
                    <span className="text-sm font-medium">AI Speaking...</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={!input.trim() || isLoading}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold shadow-glow hover:shadow-glow-strong transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? "Thinking..." : "Submit Answer"}
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;
