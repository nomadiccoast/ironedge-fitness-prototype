import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // 1. Handle CORS
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // 2. Check API Key
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      throw new Error("Missing Groq API Key inside Supabase.");
    }

    // 3. BULLETPROOF DATA EXTRACTION
    // If the frontend sends missing or weird data, this catches it instead of crashing.
    let activeMembers = 0, alumniCount = 0, totalRevenue = 0, totalLeads = 0;
    
    try {
      const body = await req.json();
      activeMembers = Number(body.activeMembers) || 0;
      alumniCount = Number(body.alumniCount) || 0;
      totalRevenue = Number(body.totalRevenue) || 0;
      totalLeads = Number(body.totalLeads) || 0;
    } catch (parseError) {
      console.warn("Warning: Could not read data from dashboard. Defaulting to zeroes.");
    }

    // 4. Ask Groq for the Report
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
            - Total Active Members: ${activeMembers}
            - Alumni (Members who left): ${alumniCount}
            - Total Revenue Logged: ₹${totalRevenue.toLocaleString("en-IN")}
            - Total Web Leads Captured: ${totalLeads}
            
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

    // 5. Safely handle Groq rejections
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Groq rejected the request: ${errorData}`);
    }

    // 6. Success! Send it back to the dashboard
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Failed to generate report text.";

    return new Response(JSON.stringify({ content }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    // 7. If anything fails, send the EXACT error text back to the browser so we can read it.
    const errorMessage = e instanceof Error ? e.message : "Unknown Server Error";
    console.error("CRITICAL CRASH:", errorMessage);
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});