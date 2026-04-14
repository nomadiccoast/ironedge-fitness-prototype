import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("Groq API key not configured");

    const { activeMembers, alumniCount, totalRevenue, totalLeads } = await req.json();

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are a world-class business analyst for Shapefit Gym in Naini, Prayagraj. Generate a concise, professional business performance report. 
            
            USE THIS REAL DATA:
            - Total Active Members: ${activeMembers || 0}
            - Alumni (Members who left): ${alumniCount || 0}
            - Total Revenue Logged: ₹${(totalRevenue || 0).toLocaleString("en-IN")}
            - Total Web Leads Captured: ${totalLeads || 0}
            
            Format the report cleanly with these exact sections: 
            1. Executive Summary 
            2. Key Wins 
            3. Areas of Concern 
            4. Recommendations for Growth. 
            
            Keep it under 300 words, do not use markdown asterisks (**), and use ALL CAPS for the section headers. Speak directly to Prashant, the owner.`,
          },
          { role: "user", content: "Generate the business report." },
        ],
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Groq API Error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Failed to generate report.";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});