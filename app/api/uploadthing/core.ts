import { createUploadthing, type FileRouter } from "uploadthing/next";
import { adminAuth } from "@/lib/firebase-admin";

const f = createUploadthing();

export const ourFileRouter = {
    pastPaperUploader: f({
        pdf: {
            maxFileCount: 1,
        },
    })
        .middleware(async ({ req }) => {
            const authHeader = req.headers.get("authorization");
            if (!authHeader || !authHeader.startsWith("Bearer ")) throw new Error("Unauthorized");
            const token = authHeader.split(" ")[1];
            try {
                const decoded = await adminAuth.verifyIdToken(token);
                return { userId: decoded.uid };
            } catch (e) {
                throw new Error("Invalid Token");
            }
        })
        .onUploadComplete(async ({ metadata, file }) => {
            return { url: file.url };
        }),
    vaultUploader: f({
        pdf: {
            maxFileSize: "8MB",
            maxFileCount: 4,
        },
        image: {
            maxFileCount: 4,
        },
    })
        .middleware(async ({ req }) => {
            const authHeader = req.headers.get("authorization");
            if (!authHeader || !authHeader.startsWith("Bearer ")) throw new Error("Unauthorized");
            const token = authHeader.split(" ")[1];
            try {
                const decoded = await adminAuth.verifyIdToken(token);
                return { userId: decoded.uid };
            } catch (e) {
                throw new Error("Invalid Token");
            }
        })
        .onUploadComplete(async ({ metadata, file }) => {
            return { url: file.url };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
