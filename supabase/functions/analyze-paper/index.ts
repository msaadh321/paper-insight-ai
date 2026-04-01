import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { paperText, action, question } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!paperText || !action) {
      return new Response(JSON.stringify({ error: "Missing paperText or action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const truncatedText = paperText.slice(0, 25000);

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "analyze") {
      systemPrompt = `You are a world-class academic research paper analyst with deep expertise across all scientific disciplines. Your analysis must be:
- **Thorough**: Extract every significant detail, don't generalize or skip nuances.
- **Structured**: Organize information logically with clear sections.
- **Accurate**: Only state what the paper actually claims; distinguish between findings and speculation.
- **Insightful**: Identify implications, novelty, and connections the paper makes.
- **Well-written**: Use clear, professional academic language.`;

      userPrompt = `Perform a comprehensive analysis of the following research paper. For each field, provide substantial, detailed content — not just a sentence or two.

Return a JSON object with these keys:
- "shortSummary": A clear, informative 4-6 sentence summary covering the paper's objective, methodology, key findings, and significance. Write it so someone unfamiliar with the field can understand.
- "detailedSummary": A thorough 3-4 paragraph summary that covers: (1) the research problem and motivation, (2) the approach/methodology in detail, (3) key results with specific data points or findings mentioned in the paper, (4) implications and contributions to the field.
- "abstract": The paper's original abstract if identifiable, otherwise generate a comprehensive abstract (150-250 words).
- "introduction": Summarize the introduction covering: research gap, motivation, objectives, and how the paper is organized. (2-3 detailed paragraphs)
- "methodology": Describe the research methodology in detail: study design, data collection, models/algorithms used, experimental setup, evaluation metrics. (2-3 detailed paragraphs)
- "results": Present key findings with specific numbers, comparisons, and statistical significance where available. Describe tables/figures findings. (2-3 detailed paragraphs)
- "conclusion": Main conclusions, limitations acknowledged by authors, and future work directions. (1-2 detailed paragraphs)
- "keywords": Array of 10-15 specific technical keywords and key phrases from the paper (not generic terms).
- "entities": Array of 10-20 objects with "name" and "type" (person/organization/concept/method/dataset/metric) for important named entities.
- "topicDistribution": Array of 5-8 objects with "topic" (specific topic name) and "percentage" (numbers summing to 100) representing the paper's thematic coverage.

Paper text:
${truncatedText}`;
    } else if (action === "qa") {
      systemPrompt = `You are an expert academic research assistant. When answering questions:
- Be precise and cite specific sections, findings, or data from the paper.
- If the paper doesn't contain enough information to answer, say so clearly.
- Use markdown formatting for clarity: **bold** for emphasis, bullet points for lists, and code blocks for formulas.
- Provide context and explain technical concepts when relevant.`;

      userPrompt = `Based on the research paper below, provide a thorough and well-structured answer to the question. Reference specific parts of the paper when possible.

Paper text:
${truncatedText}

Question: ${question}`;
    } else if (action === "translate") {
      const { targetLanguage } = await req.json().catch(() => ({ targetLanguage: "Urdu" }));
      const tLang = targetLanguage || "Urdu";
      systemPrompt = `You are a professional translator. Translate the following text to ${tLang}. Maintain the structure, meaning, and academic tone. Return ONLY the translated text.`;
      userPrompt = truncatedText;
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tools = action === "analyze" ? [
      {
        type: "function",
        function: {
          name: "return_analysis",
          description: "Return the structured analysis of the paper",
          parameters: {
            type: "object",
            properties: {
              shortSummary: { type: "string" },
              detailedSummary: { type: "string" },
              abstract: { type: "string" },
              introduction: { type: "string" },
              methodology: { type: "string" },
              results: { type: "string" },
              conclusion: { type: "string" },
              keywords: { type: "array", items: { type: "string" } },
              entities: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    type: { type: "string", enum: ["person", "organization", "concept", "method", "dataset", "metric"] }
                  },
                  required: ["name", "type"]
                }
              },
              topicDistribution: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    topic: { type: "string" },
                    percentage: { type: "number" }
                  },
                  required: ["topic", "percentage"]
                }
              }
            },
            required: ["shortSummary", "detailedSummary", "abstract", "introduction", "methodology", "results", "conclusion", "keywords", "entities", "topicDistribution"]
          }
        }
      }
    ] : undefined;

    const body: Record<string, unknown> = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    };

    if (tools) {
      body.tools = tools;
      body.tool_choice = { type: "function", function: { name: "return_analysis" } };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    if (action === "analyze") {
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        const analysis = JSON.parse(toolCall.function.arguments);
        return new Response(JSON.stringify(analysis), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Failed to parse analysis" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      const answer = data.choices?.[0]?.message?.content || "No answer generated.";
      return new Response(JSON.stringify({ answer }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
