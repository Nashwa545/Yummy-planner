exports.handler = async (event) => {
  try {
    const payload = JSON.parse(event.body || "{}");
    const { mode, profiles, preferences, days, midnightSnacks, requestType } = payload;
    
    if (!profiles || profiles.length === 0) return { statusCode: 400, body: "Missing profiles" };

    // Construct the intelligent prompt based on mode
    let systemInstruction = `You are a culinary and nutrition AI assistant. DO NOT diagnose medical conditions or claim to cure diseases. Treat allergies as severe safety constraints. Avoid cross-contamination in recipes. `;
    
    let promptContext = "";
    if (mode === "individual") {
      const p = profiles[0];
      systemInstruction += `Generate a personalized meal plan for an individual based on their specific health profile, goals, and budget.`;
      promptContext = `Profile: ${p.name}, Age: ${p.age}, Goals: ${p.goals.join(',')}, Medical: ${p.medical.join(',')}, Allergies: ${p.allergies.join(',')}, Diet: ${p.dietary.join(',')}, Dislikes: ${p.dislikes.join(',')}. Budget: ${preferences.budget}.`;
    } else {
      systemInstruction += `Generate a family meal plan. CRITICAL INSTRUCTION: Do NOT apply one person's restrictions to everyone. Design shared base meals, but provide specific, separate ingredient modifications for members with allergies or medical needs. Ensure vegetarian members get protein alternatives, and diabetic members get appropriate portions without forcing the whole family into a specialized diet.`;
      promptContext = `Family Profiles:\n` + profiles.map(p => 
        `- ${p.name}: Medical: ${p.medical.length ? p.medical.join(',') : 'None'}, Allergies: ${p.allergies.length ? p.allergies.join(',') : 'None'}, Diet: ${p.dietary.join(',')}, Dislikes: ${p.dislikes.join(',')}`
      ).join('\n');
    }

    const taskInstruction = requestType === "midnight_snack" 
      ? `Provide 3 midnight snack options based on the profiles. Focus on quick preparation.`
      : `Provide a ${days}-day meal plan (Breakfast, Lunch, Dinner). Output strictly as JSON.`;

    const finalPrompt = `${systemInstruction}\n\n${promptContext}\n\nTask: ${taskInstruction}\n\nReturn ONLY a JSON object matching this structure:
    {
      "summary": "Brief explanation of how the plan accommodates the profiles",
      "meals": [
        { 
          "day": 1, 
          "type": "Dinner", 
          "name": "Meal Name", 
          "baseRecipe": "Ingredients and steps for the shared family meal",
          "individualModifications": { "MemberName": "Specific changes (e.g. swap cheese for avocado to avoid dairy allergy)" },
          "prepTime": "20 mins",
          "warnings": "Any cross-contamination or medical notes"
        }
      ]
    }`;

    // Using gemini-1.5-flash for complex JSON structuring
    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: finalPrompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      }
    );
    
    const d = await r.json();
    if (!r.ok) return { statusCode: r.status, body: JSON.stringify({ error: "API Error", details: d }) };

    const text = d.candidates[0].content.parts[0].text;
    return { statusCode: 200, body: text }; // Text is already JSON formatted by Gemini
    
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
