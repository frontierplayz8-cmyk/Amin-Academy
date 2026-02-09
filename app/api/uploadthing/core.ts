import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

// FileRouter for our app, can contain multiple FileRoutes
export const ourFileRouter = {
    // Define as many FileRoutes as you like, each with a unique routeSlug
    pastPaperUploader: f({
        pdf: {
            maxFileSize: "4MB",
            maxFileCount: 1,
        },
    })
        .onUploadComplete(async ({ metadata, file }) => {
            // This code RUNS ON YOUR SERVER after upload
            console.log("Upload complete for url:", file.url);
            return { url: file.url };
        }),
    vaultUploader: f({
        pdf: {
            maxFileSize: "8MB",
            maxFileCount: 4,
        },
        image: {
            maxFileSize: "4MB",
            maxFileCount: 4,
        },
    })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Vault upload complete:", file.url);
            return { url: file.url };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
