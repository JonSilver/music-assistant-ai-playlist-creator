import { attemptPromise } from "@jfdi/attempt";

interface WebhookPayload {
    jobId: string;
    success: boolean;
    playlistUrl?: string;
    error?: string;
}

export const callWebhook = async (url: string, payload: WebhookPayload): Promise<void> => {
    const maxRetries = 3;
    const retryDelays = [2000, 4000, 8000]; // 2s, 4s, 8s

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const [err] = await attemptPromise(async () => {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) 
                throw new Error(`Webhook returned ${response.status}: ${response.statusText}`);
            

            return response;
        });

        if (err === undefined) {
            console.log(`[Webhook] Successfully called ${url} for job ${payload.jobId}`);
            return;
        }

        console.warn(
            `[Webhook] Attempt ${attempt + 1}/${maxRetries} failed for ${url}: ${err.message}`
        );

        if (attempt < maxRetries - 1) {
            const delay = retryDelays[attempt];
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    console.error(
        `[Webhook] Failed to call ${url} after ${maxRetries} attempts for job ${payload.jobId}`
    );
};
