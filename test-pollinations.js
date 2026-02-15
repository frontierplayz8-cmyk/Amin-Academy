const fs = require('fs');

async function testPollinations() {
    try {
        const prompt = "A futuristic cyberpunk city with neon lights";
        const seed = Math.floor(Math.random() * 1000000);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&model=flux&seed=${seed}&nologo=true`;

        console.log("Fetching:", imageUrl);
        const response = await fetch(imageUrl);

        if (!response.ok) {
            console.error("Error:", response.status, response.statusText);
            return;
        }

        const buffer = await response.arrayBuffer();
        console.log("Response size:", buffer.byteLength);
        console.log("Content-Type:", response.headers.get("content-type"));

    } catch (e) {
        console.error("Exception:", e);
    }
}

testPollinations();
