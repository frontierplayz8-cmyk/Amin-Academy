import { adminDb } from "@/lib/firebase-admin";
import { CURRICULUM_DATA } from "@/app/lib/curriculum-data";

export const getCurriculumFromDB = async () => {
    try {
        const docRef = adminDb.collection("config").doc("curriculum");
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            return docSnap.data();
        } else {
            // Initialize with static data if not exists
            await docRef.set(CURRICULUM_DATA);
            return CURRICULUM_DATA;
        }
    } catch (error) {
        console.error("Error fetching curriculum from DB:", error);
        return CURRICULUM_DATA; // Fallback
    }
};

export const updateCurriculumInDB = async (newData: any) => {
    try {
        const docRef = adminDb.collection("config").doc("curriculum");
        await docRef.set(newData);
        return { success: true };
    } catch (error) {
        console.error("Error updating curriculum in DB:", error);
        throw error;
    }
};
