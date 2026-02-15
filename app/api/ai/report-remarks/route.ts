import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const POST = async (req: Request) => {
    try {
        const body = await req.json();
        const { name, grade, performance, subjects } = body;

        if (!name || !grade) {
            return NextResponse.json({ message: "Missing required student data" }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash", // Reverting to 2.0 as 2.5 was likely a user mistake
            generationConfig: { responseMimeType: "application/json" }
        });

        const systemPrompt = `You are a professional educational consultant and principal at Amin Academy.
        Your task is to generate professional, encouraging, and constructive academic remarks for a student's report card.
        
        Student Name: ${name}
        Grade: ${grade}
        Performance Rating: ${performance}/5
        Subject Marks: ${JSON.stringify(subjects)}
        
        Instructions:
        1. Write 2-3 professional sentences.
        2. Maintain a formal yet encouraging tone.
        3. Mention specific strengths if performance is high.
        4. Provide constructive feedback if performance is low.
        5. The response must be in JSON format with a single key "remarks".
        
        Example JSON:
        {
            "remarks": "John has shown exceptional dedication this term, particularly in Mathematics. His consistent effort and analytical skills are commendable, and he is well on his way to achieving academic excellence."
        }`;

        const result = await model.generateContent(systemPrompt);
        const responseText = result.response.text();
        const parsed = JSON.parse(responseText);

        return NextResponse.json({
            success: true,
            remarks: parsed.remarks
        });

    } catch (error: any) {
        console.error("AI Remarks Error:", error);
        return NextResponse.json({
            success: false,
            message: "Failed to generate AI remarks",
            error: error.message
        }, { status: 500 });
    }
};
