import { useState } from "react";
import { Languages, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LanguageToggleProps {
  text: string;
  onTranslated: (translated: string, lang: string) => void;
}

export function LanguageToggle({ text, onTranslated }: LanguageToggleProps) {
  const [loading, setLoading] = useState(false);
  const [currentLang, setCurrentLang] = useState<"en" | "ur">("en");

  const handleToggle = async () => {
    const targetLang = currentLang === "en" ? "ur" : "en";

    if (targetLang === "en") {
      onTranslated(text, "en");
      setCurrentLang("en");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-paper", {
        body: {
          paperText: text,
          action: "translate",
          targetLanguage: "Urdu",
        },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      onTranslated(data.translation, "ur");
      setCurrentLang("ur");
    } catch {
      toast.error("Translation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
      title={currentLang === "en" ? "Translate to Urdu" : "Switch to English"}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Languages className="h-3.5 w-3.5" />}
      {currentLang === "en" ? "اردو" : "English"}
    </button>
  );
}
