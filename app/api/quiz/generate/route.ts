import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY_QUIZ || process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
    try {
        const { grade, subject, chapter, topic, difficulty } = await req.json();

        const keys = [
            process.env.GEMINI_API_KEY_QUIZ,
            process.env.GEMINI_API_KEY,
            process.env.GEMINI_API_KEY_PAPER
        ].filter(Boolean) as string[];

        const models = [
            "gemini-2.0-flash",
            "gemini-2.5-flash-lite",
            "gemini-1.5-flash"
        ];

        let numQuestions = 10;
        if (difficulty === 'Medium') numQuestions = 15;
        if (difficulty === 'Hard') numQuestions = 20;

        const prompt = `
        You are an expert examiner for high school students. 
        Generate a multiple-choice quiz (MCQ) with the following specifications:
        
        - Grade Level: ${grade}
        - Subject: ${subject}
        - Chapter: ${chapter}
        - Topic: ${topic}
        - Difficulty: ${difficulty}
        - Number of Questions: ${numQuestions}

        Output STRICT JSON format properly structured as follows:
        {
            "quizTitle": "string",
            "questions": [
                {
                    "question": "string (ALWAYS use LaTeX for math, e.g. $x^2$ or $$\\frac{a}{b}$$)",
                    "options": ["string", "string", "string", "string"],
                    "correctAnswer": "string (must match one of the options exactly)",
                    "explanation": "string (brief explanation, use LaTeX for math)"
                }
            ]
        }
        IMPORTANT JSON RULE: If you use backslashes in LaTeX (like \\frac or \\sqrt), you MUST double-escape them in the JSON string (e.g. \"\\\\\\\\frac\").
        Do not include markdown code blocks (like \`\`\`json). Just the raw JSON string.
        Ensure options are plausible distractors.
        For mathematical questions, ensure LaTeX formatting is high quality.
        `;

        let result: any;
        let attempts = 0;
        const maxRetries = models.length * keys.length;

        while (attempts < maxRetries) {
            try {
                const key = keys[attempts % keys.length];
                const modelName = models[attempts % models.length];
                const genAI = new GoogleGenerativeAI(key);
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: { responseMimeType: "application/json" }
                });

                const response = await model.generateContent(prompt);
                result = response;
                break;
            } catch (error: any) {
                console.error(`[QUIZ_GEN] Attempt ${attempts + 1} failed:`, error.message);
                const isThrottled = error.message?.includes('429') || error.status === 429;
                const isNotFound = error.message?.includes('404') || error.status === 404;

                if ((isThrottled || isNotFound) && attempts < maxRetries - 1) {
                    attempts++;
                    if (isThrottled) await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                }
                throw error;
            }
        }

        const responseText = result.response.text();
        let quizData;

        try {
            quizData = JSON.parse(responseText);
        } catch (parseError) {
            console.warn("[QUIZ_GEN] Standard JSON.parse failed, attempting LaTeX repair...");
            try {
                // Regex to find backslashes that are NOT part of a valid JSON escape sequence and double-escape them
                const repaired = responseText.replace(/\\(?![bfnrtu"\\/]|u[0-9a-fA-F]{4})/g, '\\\\');
                quizData = JSON.parse(repaired);
            } catch (repairError) {
                console.error("[QUIZ_GEN] Both standard parse and repair failed.");
                throw parseError; // Re-throw the original error if repair fails
            }
        }

        return NextResponse.json({ success: true, quiz: quizData });

    } catch (error: any) {
        console.error("Quiz Gen Error:", error);
        return NextResponse.json({ success: false, error: error.message || "Failed to generate quiz" }, { status: 500 });
    }
}
