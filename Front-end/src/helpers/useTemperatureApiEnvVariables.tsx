import { useMemo } from "react";

/**
 * Custom React hook to get and validate Temperature Service API environment variables
 * @returns Object containing apiUrl and apiKey for TemperatureService
 * @throws Error if required environment variables are missing
 */
export function useTemperatureApiEnvVariables() {
  const apiConfig = useMemo(() => {
    // Get environment variables for TemperatureService
    const apiUrl = import.meta.env.VITE_TEMPERATURE_API_URL;
    const apiKey = import.meta.env.VITE_TEMPERATURE_API_KEY;

    if (!apiUrl || !apiKey) {
      throw new Error(
        "Missing Temperature API configuration: VITE_TEMPERATURE_API_URL or VITE_TEMPERATURE_API_KEY not found"
      );
    }

    return {
      apiUrl,
      apiKey,
    };
  }, []);

  return apiConfig;
}
