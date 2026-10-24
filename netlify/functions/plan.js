// Runs on the server so your API key stays secret.
exports.handler = async (event) => {
  try {
    const { prompt } = JSON.parse(event.body || "{}");
    if (!prompt) return { statusCode: 400, body: "Missing prompt" };
    
    // Fixed: Updated model version to gemini-1.5-flash
    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      }
    );
    
    const d = await r.json();
    
    // Fixed: Catch API-level errors and log them to the Netlify console
    if (!r.ok) {
      console.error("Gemini API Error:", JSON.stringify(d, null, 2));
      return { 
        statusCode: r.status, 
        body: JSON.stringify({ error: "Gemini API Error", details: d }) 
      };
    }

    const parts = (d.candidates && d.candidates[0] && d.candidates[0].content.parts) || [];
    const text = parts.map(p => p.text || "").join("");
    return { statusCode: 200, body: JSON.stringify({ text }) };
    
  } catch (e) {
    // Fixed: Log server/network errors to the Netlify console
    console.error("Netlify Function Exception:", e);
    return { statusCode: 500, body: JSON.stringify({ error: "server error" }) };
  }
};
