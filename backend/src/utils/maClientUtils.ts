import { MusicAssistantClient } from "../services/musicAssistant.js";

export const withMusicAssistant = async <T>(
    url: string,
    token: string | undefined,
    operation: (client: MusicAssistantClient) => Promise<T>
): Promise<T> => {
    const client = new MusicAssistantClient(url);
    await client.connect(token);
    // eslint-disable-next-line no-restricted-syntax
    try {
        return await operation(client);
    } finally {
        client.disconnect();
    }
};
