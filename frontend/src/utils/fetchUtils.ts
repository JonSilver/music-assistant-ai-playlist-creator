import { attemptPromise } from "@jfdi/attempt";
import { API_BASE_PATH } from "@shared/constants";

const DEFAULT_BACKEND_URL = "http://localhost:3333";

export const getBackendUrl = (): string => {
    return import.meta.env.MODE === "development"
        ? `${DEFAULT_BACKEND_URL}${API_BASE_PATH}`
        : API_BASE_PATH;
};

export const backendFetch = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
    const backendUrl = getBackendUrl();

    const [err, result] = await attemptPromise(async () => {
        const response = await fetch(`${backendUrl}${endpoint}`, options);

        if (!response.ok) {
            const errorData = (await response
                .json()
                .catch(() => ({ error: response.statusText }))) as { error?: string };
            throw new Error(errorData.error ?? response.statusText);
        }

        return response.json() as Promise<T>;
    });

    if (err !== undefined) {
        throw new Error(err.message);
    }

    return result;
};
