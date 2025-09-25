import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ConfirmDialog } from "@/components/ui/Dialog/ConfirmDialog";
import { useApiEnvVariables } from "@/helpers/useApiEnvVariables";

// Form data interface
interface RoomFormData {
  name: string;
  type: string;
  area: number;
  placement: string;
}

// Room interface (matching the API response)
interface Room {
  roomId: number;
  houseId: number;
  name: string;
  type: string;
  area: number;
  placement: string;
}

export function RoomEdit() {
  const navigate = useNavigate();
  const { houseId, roomId } = useParams<{ houseId: string; roomId: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>("");
  const { apiUrl, apiKey } = useApiEnvVariables();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<RoomFormData>({
    mode: "onChange", // Validate on change for real-time validation
  });

  // Load room data on component mount
  useEffect(() => {
    async function loadRoom() {
      if (!roomId) {
        setLoadError("No room ID provided");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/Room/${roomId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": apiKey,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load room: ${response.status}`);
        }

        const room: Room = await response.json();

        // Reset form with loaded data
        reset({
          name: room.name,
          type: room.type,
          area: room.area,
          placement: room.placement,
        });

        setIsLoading(false);
      } catch (error) {
        console.error("Error loading room:", error);
        setLoadError(
          error instanceof Error ? error.message : "An unknown error occurred"
        );
        setIsLoading(false);
      }
    }

    loadRoom();
  }, [roomId, apiUrl, apiKey, reset]);

  const onSubmit = async (data: RoomFormData) => {
    if (!roomId || !houseId) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const requestData = {
        ...data,
        houseId: parseInt(houseId),
      };

      const response = await fetch(`${apiUrl}/Room/${roomId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKey,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to update room: ${response.status} ${errorText}`
        );
      }

      // Success - show success dialog instead of immediately navigating
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error updating room:", error);
      setSubmitError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/house/${houseId}/rooms`);
  };

  const handleSuccessDialogOk = () => {
    setShowSuccessDialog(false);
    navigate(`/house/${houseId}/rooms`);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-w-sm max-w-md md:min-w-3xl md:max-w-7xl px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center">
            <div className="text-lg">Loading room...</div>
          </div>
        </div>
      </div>
    );
  }

  // Show load error
  if (loadError) {
    return (
      <div className="min-w-sm max-w-md md:min-w-3xl md:max-w-7xl px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {loadError}
          </div>
          <button
            onClick={handleCancel}
            className="px-6 py-2 border border-gray-300 text-app-primary rounded-md font-medium hover:text-app-primary-hover hover:bg-gray-50"
          >
            Back to Rooms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-sm max-w-md md:min-w-3xl md:max-w-7xl px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Edit Room</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name Field */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Room Name *
            </label>
            <input
              id="name"
              type="text"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              {...register("name", {
                required: "Room name is required",
                minLength: {
                  value: 2,
                  message: "Room name must be at least 2 characters long",
                },
                maxLength: {
                  value: 50,
                  message: "Room name cannot exceed 50 characters",
                },
              })}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Type Field */}
          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Room Type *
            </label>
            <input
              id="type"
              type="text"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.type ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="e.g., Bedroom, Kitchen, Living Room"
              {...register("type", {
                required: "Room type is required",
                minLength: {
                  value: 2,
                  message: "Room type must be at least 2 characters long",
                },
                maxLength: {
                  value: 30,
                  message: "Room type cannot exceed 30 characters",
                },
              })}
            />
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          {/* Area Field */}
          <div>
            <label
              htmlFor="area"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Area (sq ft) *
            </label>
            <input
              id="area"
              type="number"
              step="0.01"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.area ? "border-red-500" : "border-gray-300"
              }`}
              {...register("area", {
                required: "Area is required",
                min: {
                  value: 1,
                  message: "Area must be greater than 0",
                },
                max: {
                  value: 10000,
                  message: "Area cannot exceed 10,000 sq ft",
                },
                valueAsNumber: true,
              })}
            />
            {errors.area && (
              <p className="mt-1 text-sm text-red-600">{errors.area.message}</p>
            )}
          </div>

          {/* Placement Field */}
          <div>
            <label
              htmlFor="placement"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Placement *
            </label>
            <input
              id="placement"
              type="text"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.placement ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="e.g., First Floor, Second Floor, Basement"
              {...register("placement", {
                required: "Placement is required",
                minLength: {
                  value: 2,
                  message: "Placement must be at least 2 characters long",
                },
                maxLength: {
                  value: 50,
                  message: "Placement cannot exceed 50 characters",
                },
              })}
            />
            {errors.placement && (
              <p className="mt-1 text-sm text-red-600">
                {errors.placement.message}
              </p>
            )}
          </div>

          {/* Submit Error */}
          {submitError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <strong>Error:</strong> {submitError}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                isValid && !isSubmitting
                  ? "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? "Updating..." : "Update Room"}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Success Dialog */}
        <ConfirmDialog
          isOpen={showSuccessDialog}
          title="Room Updated Successfully"
          description="The room has been updated successfully. Click OK to return to the rooms list."
          onOk={handleSuccessDialogOk}
          okText="OK"
        />
      </div>
    </div>
  );
}
