
'use server'

import { adminDb } from "@/lib/firebase-admin";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { buildDigitizationPrompt } from "@/app/lib/digitize-prompt";

const apiKey = process.env.GEMINI_API_KEY_PAST_PAPER || process.env.GEMINI_API_KEY_PAPER || process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey!);

/**
 * Upload a past paper PDF and its metadata to Firebase
 */
export async function uploadPastPaperAction(formData: FormData, pdfUrl: string) {
    try {
        const board = formData.get('board') as string;
        const grade = formData.get('grade') as string;
        const subject = formData.get('subject') as string;
        const year = formData.get('year') as string;
        const session = formData.get('session') as string;
        const group = formData.get('group') as string;

        if (!board || !subject || !pdfUrl) {
            throw new Error("Missing required metadata or PDF URL.");
        }

        // 2. Save Metadata to Firestore
        const docRef = await adminDb.collection('past_papers').add({
            board,
            grade,
            subject,
            year,
            session,
            group,
            pdfUrl,
            createdAt: new Date().toISOString(),
            isDigitized: false,
        });

        return { success: true, id: docRef.id };
    } catch (error: any) {
        console.error("Upload Error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Search for past papers in the database
 */
export async function searchPastPapersAction(query: {
    board: string;
    grade: string;
    subject: string;
    year?: string;
}) {
    try {
        let q = adminDb.collection('past_papers')
            .where('board', '==', query.board)
            .where('grade', '==', query.grade)
            .where('subject', '==', query.subject);

        if (query.year) {
            q = q.where('year', '==', query.year);
        }

        const snapshot = await q.orderBy('createdAt', 'desc').limit(10).get();
        const papers = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
        }));

        return { success: true, papers };
    } catch (error: any) {
        console.error("Search Error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Digitize a PDF paper into structured JSON using AI
 */
export async function digitizePaperAction(paperId: string) {
    try {
        const doc = await adminDb.collection('past_papers').doc(paperId).get();
        if (!doc.exists) throw new Error("Paper not found.");

        const paper = doc.data();
        const response = await fetch(paper.pdfUrl);
        const pdfBuffer = await response.arrayBuffer();
        const base64Pdf = Buffer.from(pdfBuffer).toString('base64');

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                temperature: 0.1,
                responseMimeType: "application/json",
            }
        });

        const prompt = buildDigitizationPrompt(paper);

        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64Pdf,
                    mimeType: "application/pdf"
                }
            },
            prompt
        ]);

        let text = result.response.text();
        const structuredData = JSON.parse(text.trim());

        // Update firestore to mark as digitized or save the data
        await adminDb.collection('past_papers').doc(paperId).update({
            isDigitized: true,
            digitizedData: structuredData,
            digitizedAt: new Date().toISOString()
        });

        return { success: true, data: structuredData };
    } catch (error: any) {
        console.error("Digitization Error:", error);
        // Ensure we return a structured error response that the UI can display
        return {
            success: false,
            error: error.message || "An unexpected error occurred during digitization."
        };
    }
}

/**
 * Delete a past paper and its associated PDF
 */
export async function deletePastPaperAction(paperId: string) {
    try {
        const doc = await adminDb.collection('past_papers').doc(paperId).get();
        if (!doc.exists) throw new Error("Paper not found.");

        const data = doc.data();
        const pdfUrl = data?.pdfUrl;

        // 1. Delete from Uploadthing if URL exists
        if (pdfUrl && pdfUrl.includes('utfs.io')) {
            try {
                const { UTApi } = await import("uploadthing/server");
                const utapi = new UTApi();
                const fileKey = pdfUrl.split('/').pop();
                if (fileKey) {
                    await utapi.deleteFiles(fileKey);
                }
            } catch (utError) {
                console.error("Uploadthing Deletion Error:", utError);
                // Continue with Firestore deletion even if UT deletion fails
            }
        }

        // 2. Delete from Firestore
        await adminDb.collection('past_papers').doc(paperId).delete();

        return { success: true };
    } catch (error: any) {
        console.error("Delete Error:", error);
        return { success: false, error: error.message };
    }
}
