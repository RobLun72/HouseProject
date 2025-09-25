import { useMemo } from "react";

/**
 * Custom React hook to get and validate API environment variables
 * @returns Object containing apiUrl and apiKey
 * @throws Error if required environment variables are missing
 */
export function useApiEnvVariables() {
  const apiConfig = useMemo(() => {
    // Get environment variables
    const apiUrl = import.meta.env.VITE_HOUSE_API_URL;
    const apiKey = import.meta.env.VITE_HOUSE_API_KEY;

    if (!apiUrl || !apiKey) {
      throw new Error(
        "Missing API configuration: VITE_HOUSE_API_URL or VITE_HOUSE_API_KEY not found"
      );
    }

    return {
      apiUrl,
      apiKey,
    };
  }, []);

  return apiConfig;
}
