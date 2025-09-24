import { useEffect, useState } from "react";

// TypeScript interfaces matching the HouseService API
interface House {
  houseId: number;
  name: string;
  address: string;
  area: number;
}

interface HouseState {
  loading: boolean;
  houses: House[];
  error?: string;
}

export function House() {
  const [pageState, setPageState] = useState<HouseState>({
    loading: true,
    houses: [],
  });

  useEffect(() => {
    async function fetchHouses() {
      try {
        // Get environment variables (Vite uses VITE_ prefix)
        const apiUrl = import.meta.env.VITE_HOUSE_API_URL;
        const apiKey = import.meta.env.VITE_HOUSE_API_KEY;

        if (!apiUrl || !apiKey) {
          throw new Error(
            "Missing environment variables: VITE_HOUSE_API_URL or VITE_HOUSE_API_KEY"
          );
        }

        const response = await fetch(`${apiUrl}/House`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": apiKey,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // The HouseService returns an array of houses directly, not wrapped in a response object
        const houses: House[] = await response.json();

        setPageState({
          loading: false,
          houses: houses,
        });
      } catch (error) {
        console.error("Error fetching houses:", error);
        setPageState({
          loading: false,
          houses: [],
          error:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        });
      }
    }

    if (
      pageState.loading &&
      pageState.houses.length === 0 &&
      !pageState.error
    ) {
      fetchHouses();
    }
  }, [pageState.loading, pageState.houses.length, pageState.error]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-center text-3xl font-bold mb-6">Houses</h2>

      {pageState.loading && (
        <div className="flex justify-center">
          <div className="text-lg">Loading houses...</div>
        </div>
      )}

      {pageState.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {pageState.error}
        </div>
      )}

      {!pageState.loading &&
        !pageState.error &&
        pageState.houses.length === 0 && (
          <div className="text-center text-gray-500">No houses found.</div>
        )}

      {!pageState.loading && pageState.houses.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pageState.houses.map((house) => (
            <div
              key={house.houseId}
              className="bg-white shadow-md rounded-lg p-6 border"
            >
              <h3 className="text-xl font-semibold mb-2">{house.name}</h3>
              <p className="text-gray-600 mb-2">
                <span className="font-medium">Address:</span> {house.address}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Area:</span> {house.area} sq ft
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
