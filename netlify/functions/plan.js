exports.handler = async (event) => {
  try {
    const { prompt } = JSON.parse(event.body || "{}");
    if (!prompt) return { statusCode: 400, body: "Missing prompt" };
    
    // Updated to the current active Gemini 3.x model
    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
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
    
    if (!r.ok) {
      return { 
        statusCode: r.status, 
        body: JSON.stringify({ error: "Gemini API Error", details: d }) 
      };
    }

    const parts = (d.candidates && d.candidates[0] && d.candidates[0].content.parts) || [];
    const text = parts.map(p => p.text || "").join("");
    return { statusCode: 200, body: JSON.stringify({ text }) };
    
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
