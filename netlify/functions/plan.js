// Runs on the server so your API key stays secret.
exports.handler = async (event) => {
  try {
    const { prompt } = JSON.parse(event.body || "{}");
    if (!prompt) return { statusCode: 400, body: "Missing prompt" };
    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
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
    const parts = (d.candidates && d.candidates[0] && d.candidates[0].content.parts) || [];
    const text = parts.map(p => p.text || "").join("");
    return { statusCode: r.ok ? 200 : 500, body: JSON.stringify({ text }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "server error" }) };
  }
};
exports.handler = async (event, context) => {
  try {
    // 1. Validate input
    const { prompt } = JSON.parse(event.body);
    
    // 2. Perform the logic (e.g., calling an LLM)
    // const result = await callYourAI(prompt);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Your result here" }),
    };
  } catch (error) {
    console.error(error); // This shows up in Netlify logs
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate plan" }),
    };
  }
};
