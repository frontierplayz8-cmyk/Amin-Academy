import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY_QUIZ || process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
    try {
        const { grade, subject, chapter, topic, difficulty } = await req.json();

        if (!apiKey) {
            return NextResponse.json({ success: false, error: "API Key Config Error" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        // Using "gemini-2.0-flash" as 1.5 models returned 404
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

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
                    "question": "string",
                    "options": ["string", "string", "string", "string"],
                    "correctAnswer": "string (must match one of the options exactly)",
                    "explanation": "string (brief explanation)"
                }
            ]
        }
        Do not include markdown code blocks (like \`\`\`json). Just the raw JSON string.
        Ensure options are plausible distractors.
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Clean up markdown if model adds it despite instructions
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        const quizData = JSON.parse(cleanedText);

        return NextResponse.json({ success: true, quiz: quizData });

    } catch (error: any) {
        console.error("Quiz Gen Error:", error);
        return NextResponse.json({ success: false, error: error.message || "Failed to generate quiz" }, { status: 500 });
    }
}
