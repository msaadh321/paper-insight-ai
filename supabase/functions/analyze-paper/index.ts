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

    const truncatedText = paperText.slice(0, 15000);

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "analyze") {
      systemPrompt = `You are an expert academic research paper analyst. You will analyze a research paper and return structured JSON output. Be thorough and accurate.`;
      userPrompt = `Analyze the following research paper and return a JSON object with these exact keys:
- "shortSummary": A concise 3-5 sentence summary
- "detailedSummary": A comprehensive summary covering all major points (2-3 paragraphs)
- "abstract": The paper's abstract or a generated one if not found
- "introduction": Key points from the introduction
- "methodology": Research methodology used
- "results": Key findings and results
- "conclusion": Main conclusions
- "keywords": Array of 8-12 important keywords/terms
- "entities": Array of objects with "name" and "type" (person/organization/concept/method) for named entities found
- "topicDistribution": Array of objects with "topic" and "percentage" (numbers summing to 100) for main topics covered

Paper text:
${truncatedText}`;
    } else if (action === "qa") {
      systemPrompt = `You are an expert academic research assistant. Answer questions about the given paper accurately and concisely, citing specific parts when possible.`;
      userPrompt = `Based on this research paper, answer the following question.

Paper text:
${truncatedText}

Question: ${question}`;
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
                    type: { type: "string", enum: ["person", "organization", "concept", "method"] }
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
