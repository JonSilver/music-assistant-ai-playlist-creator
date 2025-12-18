import { attemptPromise } from "@jfdi/attempt";
import { API_BASE_PATH, DEFAULT_BACKEND_PORT } from "@shared/constants";

export const getBackendUrl = (): string =>
    import.meta.env.MODE === "development"
        ? `http://localhost:${import.meta.env.VITE_BACKEND_PORT ?? DEFAULT_BACKEND_PORT}${API_BASE_PATH}`
        : API_BASE_PATH;

interface ErrorResponse {
    error?: string;
    details?: string;
}

export const backendFetch = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
    const backendUrl = getBackendUrl();

    const [err, result] = await attemptPromise(async () => {
        const response = await fetch(`${backendUrl}${endpoint}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options?.headers as Record<string, string> | undefined)
            }
        });

        if (!response.ok) {
            const errorData = (await response
                .json()
                .catch(() => ({ error: response.statusText }))) as ErrorResponse;
            throw new Error(errorData.details ?? errorData.error ?? response.statusText);
        }

        return (await response.json()) as T;
    });

    if (err !== undefined) {
        throw new Error(err.message);
    }

    return result;
};
