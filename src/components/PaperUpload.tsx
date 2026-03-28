import { useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaperUploadProps {
  onTextReady: (text: string) => void;
}

export function PaperUpload({ onTextReady }: PaperUploadProps) {
  const [text, setText] = useState("");

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your research paper text here..."
          className="w-full min-h-[200px] bg-card border border-border rounded-xl p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y font-body"
        />
      </div>

      <Button
        onClick={() => text.trim() && onTextReady(text.trim())}
        disabled={!text.trim()}
        className="w-full gradient-gold text-primary-foreground font-semibold shadow-gold hover:opacity-90 transition-opacity"
        size="lg"
      >
        <FileText className="mr-2 h-5 w-5" />
        Analyze Paper
      </Button>
    </div>
  );
}
