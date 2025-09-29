import { useEffect, useState } from "react";
import { useTemperatureApiEnvVariables } from "@/helpers/useTemperatureApiEnvVariables";
import { sortAscending } from "@/helpers/sortAndFilter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/Dialog/alert-dialog";
import { HouseTemperaturesTable } from "./houseTemperaturesTable";
import { RoomTemperaturesTable } from "./roomTemperaturesTable";

// TypeScript interfaces matching the TemperatureService API
export interface Room {
  roomId: number;
  houseId: number;
  name: string;
  type: string;
  area: number;
  placement: string;
}

export interface House {
  houseId: number;
  name: string;
  area: number;
  rooms: Room[];
}

export interface Temperature {
  tempId: number;
  roomId: number;
  hour: number;
  degrees: number;
  date: string; // ISO date string from API
}

interface HousesWithRoomsResult {
  houses: House[];
}

interface HouseTemperaturesState {
  loading: boolean;
  houses: House[];
  error?: string;
  // Dialog state for room temperatures
  showRoomTempDialog: boolean;
  roomTempLoading: boolean;
  roomTempData: Temperature[];
  selectedRoomName: string;
  roomTempError?: string;
}

export function HouseTemperatures() {
  const [pageState, setPageState] = useState<HouseTemperaturesState>({
    loading: true,
    houses: [],
    // Dialog state initialization
    showRoomTempDialog: false,
    roomTempLoading: false,
    roomTempData: [],
    selectedRoomName: "",
  });

  const { apiUrl, apiKey } = useTemperatureApiEnvVariables();

  // Handle room temperature view
  const handleRoomTemp = async (houseId: number, roomId: number) => {
    // Find the room name for display
    const house = pageState.houses.find((h) => h.houseId === houseId);
    const room = house?.rooms.find((r) => r.roomId === roomId);
    const roomName = room?.name || `Room ${roomId}`;

    // Set loading state and show dialog
    setPageState((prev) => ({
      ...prev,
      showRoomTempDialog: true,
      roomTempLoading: true,
      selectedRoomName: roomName,
      roomTempData: [],
      roomTempError: undefined,
    }));

    try {
      // Get current date in YYYY-MM-DD format
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0];

      const response = await fetch(
        `${apiUrl}/Temperature/room/${roomId}/date/${dateStr}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to load room temperatures: ${response.status}`);
      }

      const temperatures: Temperature[] = await response.json();

      setPageState((prev) => ({
        ...prev,
        roomTempLoading: false,
        roomTempData: temperatures,
      }));
    } catch (error) {
      console.error("Error loading room temperatures:", error);
      setPageState((prev) => ({
        ...prev,
        roomTempLoading: false,
        roomTempError:
          error instanceof Error ? error.message : "An unknown error occurred",
      }));
    }
  };

  // Handle closing room temperature dialog
  const handleCloseRoomTempDialog = () => {
    setPageState((prev) => ({
      ...prev,
      showRoomTempDialog: false,
      roomTempData: [],
      selectedRoomName: "",
      roomTempError: undefined,
    }));
  };

  // Load houses with rooms data on component mount
  useEffect(() => {
    async function loadHousesWithRooms() {
      try {
        setPageState((prev) => ({ ...prev, loading: true, error: undefined }));

        const response = await fetch(`${apiUrl}/HousesWithRooms`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": apiKey,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load houses: ${response.status}`);
        }

        const result: HousesWithRoomsResult = await response.json();

        // Sort houses by name
        const sortedHouses = sortAscending(result.houses, "name");

        setPageState((prev) => ({
          ...prev,
          loading: false,
          houses: sortedHouses,
          error: undefined,
        }));
      } catch (error) {
        console.error("Error loading houses with rooms:", error);
        setPageState((prev) => ({
          ...prev,
          loading: false,
          houses: [],
          error:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        }));
      }
    }

    loadHousesWithRooms();
  }, [apiUrl, apiKey]);

  return (
    <div className="min-w-sm max-w-md md:min-w-3xl md:max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">House Temperatures</h1>

      {/* Loading State */}
      {pageState.loading && (
        <div className="flex justify-center py-8">
          <div className="text-lg">Loading houses...</div>
        </div>
      )}

      {/* Error State */}
      {pageState.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {pageState.error}
        </div>
      )}

      {/* Empty State */}
      {!pageState.loading &&
        !pageState.error &&
        pageState.houses.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No houses found.</p>
          </div>
        )}

      {/* Houses with Rooms Accordion */}
      {!pageState.loading &&
        !pageState.error &&
        pageState.houses.length > 0 && (
          <Accordion type="multiple" className="w-full">
            {pageState.houses.map((house) => (
              <AccordionItem
                key={house.houseId}
                value={`house-${house.houseId}`}
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex justify-between items-center w-full mr-4">
                    <span className="text-left font-semibold">
                      {house.name}
                    </span>
                    <div className="text-sm text-gray-600">
                      {house.area.toLocaleString()} sq m • {house.rooms.length}{" "}
                      room{house.rooms.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {house.rooms.length > 0 ? (
                    <div className="pt-4">
                      <h3 className="text-lg font-medium mb-4">
                        Rooms in {house.name}
                      </h3>
                      <HouseTemperaturesTable
                        lists={house.rooms}
                        houseName={house.name}
                        onRoomTemp={handleRoomTemp}
                      />
                    </div>
                  ) : (
                    <div className="pt-4 text-gray-500">
                      No rooms found for this house.
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

      {/* Room Temperature Dialog */}
      <AlertDialog open={pageState.showRoomTempDialog}>
        <AlertDialogContent className="max-w-4xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Temperature Readings - {pageState.selectedRoomName}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pageState.roomTempLoading
                ? "Loading temperature data..."
                : pageState.roomTempError
                ? `Error: ${pageState.roomTempError}`
                : pageState.roomTempData.length === 0
                ? "No temperature readings found for today."
                : `Showing ${
                    pageState.roomTempData.length
                  } temperature readings for ${new Date().toLocaleDateString()}`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Table Content */}
          {!pageState.roomTempLoading &&
            !pageState.roomTempError &&
            pageState.roomTempData.length > 0 && (
              <div className="mt-4">
                <RoomTemperaturesTable
                  temperatures={pageState.roomTempData}
                  roomName={pageState.selectedRoomName}
                />
              </div>
            )}

          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseRoomTempDialog}>
              Close
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
