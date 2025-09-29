import { useState } from "react";
import { useTemperatureApiEnvVariables } from "@/helpers/useTemperatureApiEnvVariables";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/Dialog/alert-dialog";
import { RoomTemperaturesTable } from "./houseTemperaturesRoomTemperatureTable";

// TypeScript interfaces
export interface Temperature {
  tempId: number;
  roomId: number;
  hour: number;
  degrees: number;
  date: string; // ISO date string from API
}

interface RoomTemperatureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: number;
  roomName: string;
}

interface DialogState {
  loading: boolean;
  data: Temperature[];
  error?: string;
}

export function RoomTemperatureDialog({
  isOpen,
  onClose,
  roomId,
  roomName,
}: RoomTemperatureDialogProps) {
  const [dialogState, setDialogState] = useState<DialogState>({
    loading: false,
    data: [],
  });

  const { apiUrl, apiKey } = useTemperatureApiEnvVariables();

  // Load room temperature data when dialog opens
  const loadRoomTemperatures = async () => {
    setDialogState({ loading: true, data: [], error: undefined });

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

      setDialogState({
        loading: false,
        data: temperatures,
        error: undefined,
      });
    } catch (error) {
      console.error("Error loading room temperatures:", error);
      setDialogState({
        loading: false,
        data: [],
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  // Handle dialog open/close
  const handleOpenChange = (open: boolean) => {
    if (open && roomId > 0) {
      loadRoomTemperatures();
    } else {
      onClose();
      // Reset state when closing
      setDialogState({ loading: false, data: [], error: undefined });
    }
  };

  // Load data when dialog opens
  if (
    isOpen &&
    dialogState.data.length === 0 &&
    !dialogState.loading &&
    !dialogState.error
  ) {
    loadRoomTemperatures();
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-4xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Temperature Readings - {roomName}</AlertDialogTitle>
          <AlertDialogDescription>
            {dialogState.loading
              ? "Loading temperature data..."
              : dialogState.error
              ? `Error: ${dialogState.error}`
              : dialogState.data.length === 0
              ? "No temperature readings found for today."
              : `Showing ${
                  dialogState.data.length
                } temperature readings for ${new Date().toLocaleDateString()}`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Table Content */}
        {!dialogState.loading &&
          !dialogState.error &&
          dialogState.data.length > 0 && (
            <div className="mt-4">
              <RoomTemperaturesTable
                temperatures={dialogState.data}
                roomName={roomName}
              />
            </div>
          )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
