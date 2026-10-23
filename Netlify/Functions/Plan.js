// Runs on the server so your API key stays secret.
exports.handler = async (event) => {
  try {
    const { prompt } = JSON.parse(event.body || "{}");
    if (!prompt) return { statusCode: 400, body: "Missing prompt" };
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-5-5",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }]
      })
    });
    const d = await r.json();
    const text = (d.content || []).map(c => c.text || "").join("");
    return { statusCode: r.ok ? 200 : 500, body: JSON.stringify({ text }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "server error" }) };
  }
};
