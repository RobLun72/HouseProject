import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HouseTable } from "./houseTable";
import { useApiEnvVariables } from "@/helpers/useApiEnvVariables";
import { ConfirmDialog } from "@/components/ui/Dialog/ConfirmDialog";
import { sortAscending } from "@/helpers/sortAndFilter";

// TypeScript interfaces matching the HouseService API
export interface House {
  houseId: number;
  name: string;
  address: string;
  area: number;
}

interface HouseState {
  loading: boolean;
  houses: House[];
  error?: string;
  // Delete functionality state
  showDeleteConfirm: boolean;
  showDeleteSuccess: boolean;
  houseToDelete: House | null;
  isDeleting: boolean;
}

export function House() {
  const navigate = useNavigate();
  const { apiUrl, apiKey } = useApiEnvVariables();
  const [pageState, setPageState] = useState<HouseState>({
    loading: true,
    houses: [],
    showDeleteConfirm: false,
    showDeleteSuccess: false,
    houseToDelete: null,
    isDeleting: false,
  });

  useEffect(() => {
    async function fetchHouses() {
      try {
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

        // Sort houses by name in ascending order
        const sortedHouses = sortAscending(houses, "name");

        setPageState((prevState) => ({
          ...prevState,
          loading: false,
          houses: sortedHouses,
        }));
      } catch (error) {
        console.error("Error fetching houses:", error);
        setPageState((prevState) => ({
          ...prevState,
          loading: false,
          houses: [],
          error:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        }));
      }
    }

    if (
      pageState.loading &&
      pageState.houses.length === 0 &&
      !pageState.error
    ) {
      fetchHouses();
    }
  }, [
    pageState.loading,
    pageState.houses.length,
    pageState.error,
    apiUrl,
    apiKey,
  ]);

  // Handler functions for the HouseTable component
  const handleAdd = () => {
    navigate("/house/add");
  };

  const handleEdit = (houseId: number) => {
    navigate(`/house/edit/${houseId}`);
  };

  const handleViewRooms = (houseId: number) => {
    navigate(`/house/${houseId}/rooms`);
  };

  const handleDelete = (houseId: number) => {
    const house = pageState.houses.find((h) => h.houseId === houseId);
    if (house) {
      setPageState((prevState) => ({
        ...prevState,
        houseToDelete: house,
        showDeleteConfirm: true,
      }));
    }
  };

  const handleDeleteCancel = () => {
    setPageState((prevState) => ({
      ...prevState,
      showDeleteConfirm: false,
      houseToDelete: null,
    }));
  };

  const handleDeleteConfirm = async () => {
    if (!pageState.houseToDelete) return;

    setPageState((prevState) => ({
      ...prevState,
      isDeleting: true,
    }));

    try {
      const response = await fetch(
        `${apiUrl}/House/${pageState.houseToDelete.houseId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete house: ${response.status}`);
      }

      // Remove the deleted house from the state
      setPageState((prevState) => ({
        ...prevState,
        houses: prevState.houses.filter(
          (h) => h.houseId !== prevState.houseToDelete?.houseId
        ),
        showDeleteConfirm: false,
        houseToDelete: null,
        showDeleteSuccess: true,
        isDeleting: false,
      }));
    } catch (error) {
      console.error("Error deleting house:", error);
      // For now, just close the dialog. Could add error handling here.
      setPageState((prevState) => ({
        ...prevState,
        showDeleteConfirm: false,
        houseToDelete: null,
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

  return (
    <div className="min-w-sm max-w-md md:min-w-3xl md:max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Houses</h1>

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
        <HouseTable
          lists={pageState.houses}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewRooms={handleViewRooms}
          onUp={() => {}} // Not used but required by interface
          onDown={() => {}} // Not used but required by interface
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={pageState.showDeleteConfirm}
        title="Delete House"
        description={`Are you sure you want to delete "${pageState.houseToDelete?.name}"? This action cannot be undone.`}
        onCancel={handleDeleteCancel}
        onOk={handleDeleteConfirm}
        cancelText="Cancel"
        okText={pageState.isDeleting ? "Deleting..." : "Delete"}
      />

      {/* Delete Success Dialog */}
      <ConfirmDialog
        isOpen={pageState.showDeleteSuccess}
        title="House Deleted Successfully"
        description="The house has been deleted successfully."
        onOk={handleDeleteSuccessOk}
        okText="OK"
      />
    </div>
  );
}
