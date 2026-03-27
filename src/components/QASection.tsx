import { useState } from "react";
import { Send, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { askQuestion } from "@/lib/api";

interface QASectionProps {
  paperText: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function QASection({ paperText }: QASectionProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const question = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);

    try {
      const answer = await askQuestion(paperText, question);
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${err instanceof Error ? err.message : "Failed to get answer"}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "What is the main contribution of this paper?",
    "What methodology was used?",
    "What are the limitations?",
    "How does this compare to prior work?",
  ];

  return (
    <div className="glass-card rounded-xl overflow-hidden animate-slide-up">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg text-foreground">Ask About This Paper</h3>
        </div>
      </div>

      <div className="h-80 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-xs px-3 py-1.5 rounded-full bg-accent text-accent-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                msg.role === "user"
                  ? "gradient-gold text-primary-foreground"
                  : "bg-accent text-accent-foreground"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-accent rounded-xl px-4 py-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask a question about the paper..."
          className="flex-1 bg-accent rounded-lg px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          size="icon"
          className="gradient-gold text-primary-foreground shadow-gold"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
