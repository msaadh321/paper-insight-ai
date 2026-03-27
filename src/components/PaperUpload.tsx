import { useState, useCallback } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaperUploadProps {
  onTextReady: (text: string) => void;
}

export function PaperUpload({ onTextReady }: PaperUploadProps) {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name);
    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      const content = await file.text();
      setText(content);
    } else if (file.type === "application/pdf") {
      // For PDF, we read as text (basic extraction)
      const content = await file.text();
      // If PDF text extraction doesn't work well, fallback message
      if (content.length < 100) {
        setText("PDF text extraction is limited in the browser. Please paste the paper text directly for best results.");
      } else {
        setText(content);
      }
    } else {
      const content = await file.text();
      setText(content);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const clear = () => {
    setText("");
    setFileName(null);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
          dragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-accent/50"
        }`}
      >
        <input
          type="file"
          accept=".txt,.pdf,.md,.tex"
          onChange={handleFileInput}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
        <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-foreground font-medium">
          Drop your research paper here
        </p>
        <p className="text-muted-foreground text-sm mt-1">
          Supports TXT, PDF, MD, TEX files
        </p>
      </div>

      {fileName && (
        <div className="flex items-center gap-2 glass-card rounded-lg px-4 py-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-sm text-foreground flex-1 truncate">{fileName}</span>
          <button onClick={clear} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Or paste your research paper text here..."
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
