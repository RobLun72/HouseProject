import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ConfirmDialog } from "@/components/ui/Dialog/ConfirmDialog";
import { useApiEnvVariables } from "@/helpers/useApiEnvVariables";

// Form data interface
interface HouseFormData {
  name: string;
  address: string;
  area: number;
}

// House interface (matching the API response)
interface House {
  houseId: number;
  name: string;
  address: string;
  area: number;
}

export function HouseEdit() {
  const navigate = useNavigate();
  const { houseId } = useParams<{ houseId: string }>();
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
  } = useForm<HouseFormData>({
    mode: "onChange", // Validate on change for real-time validation
  });

  // Load house data on component mount
  useEffect(() => {
    async function loadHouse() {
      if (!houseId) {
        setLoadError("No house ID provided");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/House/${houseId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": apiKey,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load house: ${response.status}`);
        }

        const house: House = await response.json();

        // Reset form with loaded data
        reset({
          name: house.name,
          address: house.address,
          area: house.area,
        });

        setIsLoading(false);
      } catch (error) {
        console.error("Error loading house:", error);
        setLoadError(
          error instanceof Error ? error.message : "An unknown error occurred"
        );
        setIsLoading(false);
      }
    }

    loadHouse();
  }, [houseId, apiUrl, apiKey, reset]);

  const onSubmit = async (data: HouseFormData) => {
    if (!houseId) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch(`${apiUrl}/House/${houseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKey,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to update house: ${response.status} ${errorText}`
        );
      }

      // Success - show success dialog instead of immediately navigating
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error updating house:", error);
      setSubmitError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/");
  };

  const handleSuccessDialogOk = () => {
    setShowSuccessDialog(false);
    navigate("/");
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-w-sm max-w-md md:min-w-3xl md:max-w-7xl px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center">
            <div className="text-lg">Loading house...</div>
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
            Back to Houses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-sm max-w-md md:min-w-3xl md:max-w-7xl px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Edit House</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name Field */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              House Name *
            </label>
            <input
              id="name"
              type="text"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              {...register("name", {
                required: "House name is required",
                minLength: {
                  value: 2,
                  message: "House name must be at least 2 characters long",
                },
                maxLength: {
                  value: 100,
                  message: "House name cannot exceed 100 characters",
                },
              })}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Address Field */}
          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Address *
            </label>
            <input
              id="address"
              type="text"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.address ? "border-red-500" : "border-gray-300"
              }`}
              {...register("address", {
                required: "Address is required",
                minLength: {
                  value: 5,
                  message: "Address must be at least 5 characters long",
                },
                maxLength: {
                  value: 200,
                  message: "Address cannot exceed 200 characters",
                },
              })}
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">
                {errors.address.message}
              </p>
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
                  value: 100000,
                  message: "Area cannot exceed 100,000 sq ft",
                },
                valueAsNumber: true,
              })}
            />
            {errors.area && (
              <p className="mt-1 text-sm text-red-600">{errors.area.message}</p>
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
              {isSubmitting ? "Updating..." : "Update House"}
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
          title="House Updated Successfully"
          description="The house has been updated successfully. Click OK to return to the house list."
          onOk={handleSuccessDialogOk}
          okText="OK"
        />
      </div>
    </div>
  );
}
