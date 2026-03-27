import { supabase } from "@/integrations/supabase/client";
import type { PaperAnalysis } from "@/types/paper";

export async function analyzePaper(paperText: string): Promise<PaperAnalysis> {
  const { data, error } = await supabase.functions.invoke("analyze-paper", {
    body: { paperText, action: "analyze" },
  });

  if (error) throw new Error(error.message || "Analysis failed");
  if (data?.error) throw new Error(data.error);
  return data as PaperAnalysis;
}

export async function askQuestion(paperText: string, question: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("analyze-paper", {
    body: { paperText, action: "qa", question },
  });

  if (error) throw new Error(error.message || "Q&A failed");
  if (data?.error) throw new Error(data.error);
  return data.answer;
}
