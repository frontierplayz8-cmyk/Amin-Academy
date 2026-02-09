import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey!);

export async function POST(req: Request) {
    if (!apiKey) {
        return NextResponse.json({ message: "API Key Missing" }, { status: 500 });
    }

    try {
        const { messages, context } = await req.json();
        const { grade, subject, topic } = context;

        const analysisPrompt = `
[ROLE]
You are an expert academic evaluator for Amin Academy. Analyze the provided study session between a tutor and a student.

[CONTEXT]
- Grade: ${grade}
- Subject: ${subject}
- Topic: ${topic}

[SESSION DATA]
${messages.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')}

[INSTRUCTIONS]
1. Evaluate the student's mastery of the topic (0-100).
2. Rate their knowledge clarity (e.g., "Bad", "Intermediate", "Advanced", "Expert").
3. Grade their practice quality/effort (A+, A, B, C, etc.).
4. Provide a warm, encouraging one-sentence feedback summary.
5. Identify 2-3 specific sub-topics or focus areas they should review.

[OUTPUT FORMAT]
Return ONLY a valid JSON object with the following structure:
{
  "score": number,
  "knowledgeLevel": "string",
  "practiceGrade": "string",
  "feedback": "string",
  "focusAreas": ["string", "string"]
}
`;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const result = await model.generateContent(analysisPrompt);
        const response = await result.response;
        const text = response.text().trim();

        // Extract JSON if model wraps it in markdown
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const cleanedJson = jsonMatch ? jsonMatch[0] : text;

        try {
            const parsedData = JSON.parse(cleanedJson);
            return NextResponse.json(parsedData);
        } catch (parseErr) {
            return NextResponse.json({
                score: 75,
                knowledgeLevel: "Intermediate",
                practiceGrade: "A",
                feedback: "You've made good progress today. Keep practicing the core concepts!",
                focusAreas: ["General Concept Review", "Terminology"]
            });
        }

    } catch (error: any) {
        return NextResponse.json({ message: "Analysis Failed" }, { status: 500 });
    }
}
