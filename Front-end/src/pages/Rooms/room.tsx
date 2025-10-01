import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApiEnvVariables } from "@/helpers/useApiEnvVariables";
import { ConfirmDialog } from "@/components/ui/Dialog/ConfirmDialog";
import { sortAscending } from "@/helpers/sortAndFilter";
import { RoomTable } from "./roomTable";

// TypeScript interfaces matching the HouseService API
export interface Room {
  roomId: number;
  houseId: number;
  name: string;
  type: string;
  area: number;
  placement: string;
}

interface RoomState {
  loading: boolean;
  rooms: Room[];
  error?: string;
  houseName?: string;
  // Delete functionality state
  showDeleteConfirm: boolean;
  showDeleteSuccess: boolean;
  roomToDelete: Room | null;
  isDeleting: boolean;
}

export function Room() {
  const navigate = useNavigate();
  const { houseId } = useParams<{ houseId: string }>();
  const { apiUrl, apiKey } = useApiEnvVariables();
  const [pageState, setPageState] = useState<RoomState>({
    loading: true,
    rooms: [],
    showDeleteConfirm: false,
    showDeleteSuccess: false,
    roomToDelete: null,
    isDeleting: false,
  });

  useEffect(() => {
    async function fetchRooms() {
      if (!houseId || houseId === "null" || houseId === "undefined") {
        setPageState((prevState) => ({
          ...prevState,
          loading: false,
          error: "No house ID provided",
        }));
        return;
      }

      try {
        // First, get house information for the title
        const houseResponse = await fetch(`${apiUrl}/House/${houseId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": apiKey,
          },
        });

        let houseName = "Unknown House";
        if (houseResponse.ok) {
          const house = await houseResponse.json();
          houseName = house.name;
        }

        // Then get rooms for this house
        const roomsResponse = await fetch(`${apiUrl}/Room/house/${houseId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": apiKey,
          },
        });

        if (!roomsResponse.ok) {
          throw new Error(`HTTP error! status: ${roomsResponse.status}`);
        }

        // The HouseService returns an array of rooms directly
        const rooms: Room[] = await roomsResponse.json();

        // Sort rooms by name in ascending order
        const sortedRooms = sortAscending(rooms, "name");

        setPageState((prevState) => ({
          ...prevState,
          loading: false,
          rooms: sortedRooms,
          houseName: houseName,
        }));
      } catch (error) {
        console.error("Error fetching rooms:", error);
        try {
          setPageState((prevState) => {
            const newState = {
              ...prevState,
              loading: false,
              rooms: [],
              houseName: "",
              error:
                error instanceof Error
                  ? error.message
                  : "An unknown error occurred",
            };

            return newState;
          });
        } catch (stateError) {
          console.error("Error updating state:", stateError);
        }
      }
    }

    // Simplified logic: always fetch when houseId or apiUrl changes, regardless of state
    if (houseId && apiUrl && apiKey) {
      setPageState((prevState) => ({
        ...prevState,
        loading: true,
        error: undefined,
      }));
      fetchRooms();
    }
  }, [apiUrl, apiKey, houseId]);

  // Handler functions for the RoomTable component
  const handleAdd = () => {
    navigate(`/house/${houseId}/rooms/add`);
  };

  const handleEdit = (roomId: number) => {
    navigate(`/house/${houseId}/rooms/edit/${roomId}`);
  };

  const handleDelete = (roomId: number) => {
    const room = pageState.rooms.find((r) => r.roomId === roomId);
    if (room) {
      setPageState((prevState) => ({
        ...prevState,
        roomToDelete: room,
        showDeleteConfirm: true,
      }));
    }
  };

  const handleDeleteCancel = () => {
    setPageState((prevState) => ({
      ...prevState,
      showDeleteConfirm: false,
      roomToDelete: null,
    }));
  };

  const handleDeleteConfirm = async () => {
    if (!pageState.roomToDelete) return;

    setPageState((prevState) => ({
      ...prevState,
      isDeleting: true,
    }));

    try {
      const response = await fetch(
        `${apiUrl}/Room/${pageState.roomToDelete.roomId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete room: ${response.status}`);
      }

      // Remove the deleted room from the state
      setPageState((prevState) => ({
        ...prevState,
        rooms: prevState.rooms.filter(
          (r) => r.roomId !== prevState.roomToDelete?.roomId
        ),
        showDeleteConfirm: false,
        roomToDelete: null,
        showDeleteSuccess: true,
        isDeleting: false,
      }));
    } catch (error) {
      console.error("Error deleting room:", error);
      // For now, just close the dialog. Could add error handling here.
      setPageState((prevState) => ({
        ...prevState,
        showDeleteConfirm: false,
        roomToDelete: null,
        isDeleting: false,
      }));
      // Could show an error dialog here if needed
    }
  };

  const handleDeleteSuccessOk = () => {
    setPageState((prevState) => ({
      ...prevState,
      showDeleteSuccess: false,
    }));
  };

  const handleBackToHouses = () => {
    navigate("/");
  };

  return (
    <div className="min-w-sm max-w-md md:min-w-3xl md:max-w-7xl px-4 py-8">
      <div className="mb-6">
        <button
          onClick={handleBackToHouses}
          className="mb-4 px-4 py-2 text-sm text-app-primary hover:text-app-primary-hover focus:outline-none"
        >
          ← Back to Houses
        </button>
        <h2 className="text-center text-3xl font-bold mb-2">
          Rooms - {pageState.houseName}
        </h2>
      </div>

      {pageState.loading && (
        <div className="flex justify-center">
          <div className="text-lg">Loading rooms...</div>
        </div>
      )}

      {pageState.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {pageState.error}
        </div>
      )}

      {!pageState.loading && !pageState.error && (
        <RoomTable
          lists={pageState.rooms}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onUp={() => {}} // Not used but required by interface
          onDown={() => {}} // Not used but required by interface
          noRowsText={`No rooms found for ${
            pageState.houseName || "this house"
          }.`}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={pageState.showDeleteConfirm}
        title="Delete Room"
        description={`Are you sure you want to delete "${pageState.roomToDelete?.name}"? This action cannot be undone.`}
        onCancel={handleDeleteCancel}
        onOk={handleDeleteConfirm}
        cancelText="Cancel"
        okText={pageState.isDeleting ? "Deleting..." : "Delete"}
      />

      {/* Delete Success Dialog */}
      <ConfirmDialog
        isOpen={pageState.showDeleteSuccess}
        title="Room Deleted Successfully"
        description="The room has been deleted successfully."
        onOk={handleDeleteSuccessOk}
        okText="OK"
      />
    </div>
  );
}
