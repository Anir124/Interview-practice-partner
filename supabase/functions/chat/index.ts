import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, userName, difficulty, interviewType, questionNumber, conversationHistory, isFollowUp } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Determine max questions based on difficulty
    const maxQuestions = difficulty === "Easy" ? 3 : difficulty === "Hard" ? 7 : 5;

    // Handle special commands
    if (text.startsWith("START_INTERVIEW:")) {
      const systemPrompt = `You are an AI interview coach named Alex. You conduct professional mock interviews to help candidates prepare for real job interviews.

Your personality:
- Professional yet warm and encouraging
- Provide clear, concise responses without asterisks or emojis
- Use natural human language
- Be supportive but maintain interview professionalism

Interview structure:
1. Greet the candidate by name warmly
2. Introduce yourself as Alex, their AI interview coach
3. Explain the interview rules briefly:
   - This is a ${difficulty} difficulty interview with ${maxQuestions} questions for a ${interviewType} position
   - Answer each question thoughtfully
   - Take your time with responses
   - You can use voice or text to respond
4. Ask if they are ready to begin
5. When they confirm readiness, ask the first question

Keep your greeting and rules explanation conversational and under 100 words total.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Start interview for ${userName}` }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || "Hello, welcome to your interview session.";

      return new Response(
        JSON.stringify({ text: aiResponse, complete: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (text === "END_INTERVIEW") {
      const systemPrompt = `You are Alex, an AI interview coach providing detailed performance feedback and scores for a ${interviewType} position interview.

Analyze the interview conversation and provide:

1. PERFORMANCE SCORES (out of 10):
   - Communication Skills: [score]/10
   - Technical Knowledge: [score]/10
   - Problem-Solving: [score]/10
   - Professionalism: [score]/10
   - Overall Score: [average]/10

2. STRENGTHS:
   List 2-3 key strengths demonstrated during the interview

3. AREAS FOR IMPROVEMENT:
   List 2-3 specific areas that need work

4. ACTIONABLE RECOMMENDATIONS:
   Provide 2-3 concrete steps to improve for future ${interviewType} interviews

Be encouraging but honest. Base scores on actual response quality. Keep total feedback under 400 words. Use clear sections. No asterisks or emojis.`;

      const conversationText = conversationHistory
        ?.map((msg: any) => `${msg.role === "user" ? "Candidate" : "Interviewer"}: ${msg.text}`)
        .join("\n") || "";

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Interview conversation:\n\n${conversationText}\n\nProvide feedback on this interview performance.` }
          ],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate feedback");
      }

      const data = await response.json();
      const feedback = data.choices[0]?.message?.content || "Thank you for completing the interview.";

      return new Response(
        JSON.stringify({ text: feedback, complete: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Regular interview question flow
    const currentQuestion = questionNumber || 1;
    
    let systemPrompt = "";
    let shouldScore = false;
    
    if (currentQuestion === 1 && (!conversationHistory || conversationHistory.length <= 1)) {
      // First question after greeting
      systemPrompt = `You are Alex, conducting a ${difficulty} difficulty interview for a ${interviewType} position. The candidate just confirmed they're ready.

Ask your first interview question now. Choose an appropriate ${interviewType}-specific question for ${difficulty} difficulty level. Focus on skills, experience, and scenarios relevant to ${interviewType} roles.

Keep it natural and professional. No asterisks or emojis.`;
    } else if (isFollowUp) {
      // This is a follow-up question - evaluate the response
      systemPrompt = `You are Alex, conducting a ${difficulty} difficulty interview for a ${interviewType} position. 

The candidate just answered a follow-up question. Evaluate their response:
- If satisfactory: Move to the next main question (question ${currentQuestion + 1} of ${maxQuestions})
- If still unsatisfactory: Move to the next main question anyway (question ${currentQuestion + 1} of ${maxQuestions})

Keep it natural and professional. No asterisks or emojis.`;
    } else {
      // Regular question - check if we need to score and potentially ask follow-up
      shouldScore = true;
      systemPrompt = `You are Alex, conducting a ${difficulty} difficulty interview for a ${interviewType} position. This is question ${currentQuestion} of ${maxQuestions}.

1. First, evaluate the candidate's previous response on a scale of 1-10 based on:
   - Relevance to the question
   - Depth of explanation
   - Communication clarity
   - ${interviewType}-specific knowledge demonstrated

2. Response format:
   - If score >= 6: "SCORE: [number] | " followed by brief acknowledgment (one sentence) and the next interview question
   - If score < 6: "SCORE: [number] | FOLLOWUP | " followed by a brief follow-up question to clarify or expand on their previous answer

Keep it natural and professional. No asterisks or emojis.`;
    }

    const messages = [
      { role: "system", content: systemPrompt },
      ...(conversationHistory || []).map((msg: any) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.text
      })),
      { role: "user", content: text }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: messages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let aiResponse = data.choices[0]?.message?.content || "Thank you for your response.";

    // Clean up response - remove asterisks and emojis
    aiResponse = aiResponse.replace(/\*\*/g, "").replace(/\*/g, "");
    aiResponse = aiResponse.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "");

    // Parse scoring logic if present
    let isFollowUpQuestion = false;
    let shouldIncrementQuestion = true;
    let cleanResponse = aiResponse;
    
    if (aiResponse.includes("SCORE:")) {
      const scoreMatch = aiResponse.match(/SCORE:\s*(\d+)/);
      if (scoreMatch) {
        cleanResponse = aiResponse.replace(/SCORE:\s*\d+\s*\|\s*/, "");
        
        if (aiResponse.includes("FOLLOWUP")) {
          isFollowUpQuestion = true;
          shouldIncrementQuestion = false;
          cleanResponse = cleanResponse.replace(/FOLLOWUP\s*\|\s*/, "");
        }
      }
    }

    // Determine if interview is complete - only if we've asked all main questions and not waiting for follow-up
    const isInterviewComplete = !isFollowUpQuestion && currentQuestion > maxQuestions;
    
    // If interview is complete, return a goodbye message instead of navigating immediately
    let isGoodbye = false;
    if (isInterviewComplete) {
      isGoodbye = true;
      cleanResponse = "Thank you so much for taking the time to complete this interview. You did a great job! I'll now prepare your detailed feedback and performance scores. Best of luck with your future endeavors!";
    }

    return new Response(
      JSON.stringify({ 
        text: cleanResponse, 
        isGoodbye: isGoodbye,
        isFollowUp: isFollowUpQuestion,
        shouldIncrementQuestion 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
