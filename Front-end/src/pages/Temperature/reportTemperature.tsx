import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ConfirmDialog } from "@/components/ui/Dialog/ConfirmDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTemperatureApiEnvVariables } from "@/helpers/useTemperatureApiEnvVariables";

interface HouseWithRooms {
  houseId: number;
  name: string;
  area: number;
  rooms: Room[];
}

interface Room {
  roomId: number;
  name: string;
  houseId: number;
  type: string;
  area: number;
  placement: string;
}

interface AvailableDate {
  date: string;
  displayDate: string;
}

interface Temperature {
  tempId: number;
  roomId: number;
  hour: number;
  degrees: number;
  date: string;
}

interface TemperatureFormData {
  tempId: number;
  roomId: number;
  hour: number;
  degrees: number;
  date: string;
}

interface PageState {
  housesWithRooms: HouseWithRooms[];
  availableDates: AvailableDate[];
  temperatures: Temperature[];
  selectedHouseId: number | null;
  selectedRoomId: number | null;
  selectedDate: string | null;
  selectedTemperature: Temperature | null;
  loadingHousesWithRooms: boolean;
  loadingDates: boolean;
  loadingTemperatures: boolean;
  showSuccessDialog: boolean;
}

export function ReportTemperature() {
  const { apiUrl, apiKey } = useTemperatureApiEnvVariables();

  const [pageState, setPageState] = useState<PageState>({
    housesWithRooms: [],
    availableDates: [],
    temperatures: [],
    selectedHouseId: null,
    selectedRoomId: null,
    selectedDate: null,
    selectedTemperature: null,
    loadingHousesWithRooms: true,
    loadingDates: false,
    loadingTemperatures: false,
    showSuccessDialog: false,
  });

  // Initialize React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<TemperatureFormData>();

  // Save temperature record function
  const onSave = async (data: TemperatureFormData) => {
    try {
      const response = await fetch(`${apiUrl}/Temperature/${data.tempId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKey,
        },
        body: JSON.stringify({
          tempId: data.tempId,
          roomId: data.roomId,
          hour: data.hour,
          degrees: data.degrees,
          date: data.date,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save temperature record");
      }

      // Update the local temperatures array and re-sort by hour
      const updatedTemperatures = pageState.temperatures
        .map((temp) =>
          temp.tempId === data.tempId
            ? { ...temp, hour: data.hour, degrees: data.degrees }
            : temp
        )
        .sort((a, b) => a.hour - b.hour);

      // Update the selected temperature if it matches
      const updatedSelectedTemperature =
        pageState.selectedTemperature &&
        pageState.selectedTemperature.tempId === data.tempId
          ? {
              ...pageState.selectedTemperature,
              hour: data.hour,
              degrees: data.degrees,
            }
          : pageState.selectedTemperature;

      setPageState((prev) => ({
        ...prev,
        temperatures: updatedTemperatures,
        selectedTemperature: updatedSelectedTemperature,
        showSuccessDialog: true,
      }));

      // Reset form dirty state
      reset(data);
    } catch (error) {
      console.error("Error saving temperature:", error);
      alert("Failed to save temperature record. Please try again.");
    }
  };

  // Handle success dialog OK button
  const handleSuccessDialogOk = () => {
    setPageState((prev) => ({
      ...prev,
      showSuccessDialog: false,
    }));
  };

  // Load all houses with rooms on component mount
  useEffect(() => {
    const fetchHousesWithRooms = async () => {
      try {
        const response = await fetch(`${apiUrl}/HousesWithRooms`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": apiKey,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch houses with rooms");
        }

        const result = await response.json();
        // The TemperatureService returns a HousesWithRoomsResult object with a houses array (camelCase)
        setPageState((prev) => ({
          ...prev,
          housesWithRooms: result.houses || [],
          loadingHousesWithRooms: false,
        }));
      } catch (error) {
        console.error("Error fetching houses with rooms:", error);
        setPageState((prev) => ({
          ...prev,
          loadingHousesWithRooms: false,
        }));
      }
    };

    fetchHousesWithRooms();
  }, [apiUrl, apiKey]);

  const handleHouseChange = (value: string) => {
    const houseId = parseInt(value);
    setPageState((prev) => ({
      ...prev,
      selectedHouseId: houseId,
      selectedRoomId: null, // Reset room selection when house changes
      selectedDate: null, // Reset date selection when house changes
      selectedTemperature: null,
      availableDates: [],
      temperatures: [],
    }));
  };

  const handleRoomChange = (value: string) => {
    const roomId = parseInt(value);
    setPageState((prev) => ({
      ...prev,
      selectedRoomId: roomId,
      selectedDate: null, // Reset date selection when room changes
      selectedTemperature: null,
      temperatures: [],
    }));
  };

  // Load available dates when a room is selected
  useEffect(() => {
    if (pageState.selectedRoomId) {
      const fetchAvailableDates = async () => {
        setPageState((prev) => ({ ...prev, loadingDates: true }));

        try {
          const response = await fetch(
            `${apiUrl}/Temperature/room/${pageState.selectedRoomId}/dates`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "X-Api-Key": apiKey,
              },
            }
          );

          if (!response.ok) {
            throw new Error("Failed to fetch temperature dates");
          }

          const dateStrings: string[] = await response.json();

          // Format the dates for display
          const formattedDates = dateStrings.map((dateString) => ({
            date: dateString.split("T")[0], // Extract just the date part
            displayDate: new Date(dateString).toLocaleDateString("en-US", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
          }));

          setPageState((prev) => ({
            ...prev,
            availableDates: formattedDates,
            loadingDates: false,
          }));
        } catch (error) {
          console.error("Error fetching available dates:", error);
          setPageState((prev) => ({
            ...prev,
            availableDates: [],
            loadingDates: false,
          }));
        }
      };

      fetchAvailableDates();
    } else {
      setPageState((prev) => ({
        ...prev,
        availableDates: [],
        selectedDate: null,
      }));
    }
  }, [pageState.selectedRoomId, apiUrl, apiKey]);

  // Load temperature records when date is selected
  useEffect(() => {
    if (pageState.selectedRoomId && pageState.selectedDate) {
      const fetchTemperatures = async () => {
        setPageState((prev) => ({ ...prev, loadingTemperatures: true }));

        try {
          const response = await fetch(
            `${apiUrl}/Temperature/room/${pageState.selectedRoomId}/date/${pageState.selectedDate}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "X-Api-Key": apiKey,
              },
            }
          );

          if (!response.ok) {
            throw new Error("Failed to fetch temperature records");
          }

          const temperatureRecords: Temperature[] = await response.json();
          // Sort by hour for consistent display
          const sortedTemperatures = temperatureRecords.sort(
            (a, b) => a.hour - b.hour
          );

          setPageState((prev) => ({
            ...prev,
            temperatures: sortedTemperatures,
            loadingTemperatures: false,
          }));
        } catch (error) {
          console.error("Error fetching temperature records:", error);
          setPageState((prev) => ({
            ...prev,
            temperatures: [],
            loadingTemperatures: false,
          }));
        }
      };

      fetchTemperatures();
    } else {
      setPageState((prev) => ({
        ...prev,
        temperatures: [],
        selectedTemperature: null,
      }));
    }
  }, [pageState.selectedRoomId, pageState.selectedDate, apiUrl, apiKey]);

  const handleDateChange = (value: string) => {
    setPageState((prev) => ({
      ...prev,
      selectedDate: value,
      selectedTemperature: null,
    }));
  };

  const handleTemperatureSelect = (temperature: Temperature) => {
    setPageState((prev) => ({
      ...prev,
      selectedTemperature: temperature,
    }));
    // Populate the form with the selected temperature data
    setValue("tempId", temperature.tempId);
    setValue("roomId", temperature.roomId);
    setValue("hour", temperature.hour);
    setValue("degrees", temperature.degrees);
    setValue("date", temperature.date);
  };

  const handleCreateNewTemperature = async () => {
    if (!pageState.selectedRoomId || !pageState.selectedDate) return;

    try {
      // Find a suitable hour that doesn't exist yet
      const existingHours = pageState.temperatures
        .map((temp) => temp.hour)
        .sort((a, b) => a - b);
      let newHour = 0;

      // Find the first available hour (0-23)
      for (let i = 0; i <= 23; i++) {
        if (!existingHours.includes(i)) {
          newHour = i;
          break;
        }
      }

      // Format the date properly as ISO string
      const formattedDate = new Date(
        pageState.selectedDate + "T00:00:00.000Z"
      ).toISOString();

      const response = await fetch(`${apiUrl}/Temperature`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKey,
        },
        body: JSON.stringify({
          roomId: pageState.selectedRoomId,
          hour: newHour,
          degrees: 20.0, // Default temperature
          date: formattedDate,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to create temperature record: ${response.status} - ${errorText}`
        );
      }

      const newTemperature = await response.json();

      // Update local temperatures array and set as selected
      const updatedTemperatures = [
        ...pageState.temperatures,
        newTemperature,
      ].sort((a, b) => a.hour - b.hour);

      setPageState((prev) => ({
        ...prev,
        temperatures: updatedTemperatures,
        selectedTemperature: newTemperature,
      }));

      // Populate form with new temperature
      setValue("tempId", newTemperature.tempId);
      setValue("roomId", newTemperature.roomId);
      setValue("hour", newTemperature.hour);
      setValue("degrees", newTemperature.degrees);
      setValue("date", newTemperature.date);
    } catch (error) {
      console.error("Error creating temperature record:", error);
      alert("Failed to create temperature record. Please try again.");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <Link to="/temperature">
          <button className="mb-4 px-4 py-2 text-sm text-app-primary hover:text-app-primary-hover focus:outline-none">
            ← Back to Temperature
          </button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Report Temperatures
        </h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* House Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Select House
            </label>
            <Select
              value={pageState.selectedHouseId?.toString() || ""}
              onValueChange={handleHouseChange}
              disabled={pageState.loadingHousesWithRooms}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    pageState.loadingHousesWithRooms
                      ? "Loading houses..."
                      : "Choose a house"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {pageState.housesWithRooms.map((house) => (
                  <SelectItem
                    key={house.houseId}
                    value={house.houseId.toString()}
                  >
                    {house.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Room Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Select Room
            </label>
            <Select
              value={pageState.selectedRoomId?.toString() || ""}
              onValueChange={handleRoomChange}
              disabled={
                !pageState.selectedHouseId ||
                !pageState.housesWithRooms.find(
                  (h) => h.houseId === pageState.selectedHouseId
                )?.rooms.length
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    !pageState.selectedHouseId
                      ? "Select a house first"
                      : !pageState.housesWithRooms.find(
                          (h) => h.houseId === pageState.selectedHouseId
                        )?.rooms.length
                      ? "No rooms available"
                      : "Choose a room"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {pageState.selectedHouseId &&
                  pageState.housesWithRooms
                    .find((h) => h.houseId === pageState.selectedHouseId)
                    ?.rooms.map((room) => (
                      <SelectItem
                        key={room.roomId}
                        value={room.roomId.toString()}
                      >
                        {room.name}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Select Date
            </label>
            <Select
              value={pageState.selectedDate || ""}
              onValueChange={handleDateChange}
              disabled={
                !pageState.selectedRoomId ||
                pageState.loadingDates ||
                pageState.availableDates.length === 0
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    !pageState.selectedRoomId
                      ? "Select a room first"
                      : pageState.loadingDates
                      ? "Loading dates..."
                      : pageState.availableDates.length === 0
                      ? "No dates available"
                      : "Choose a date"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {pageState.availableDates.map((dateObj) => (
                  <SelectItem key={dateObj.date} value={dateObj.date}>
                    {dateObj.displayDate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Temperature Time Buttons */}
        {pageState.selectedDate && pageState.temperatures.length > 0 && (
          <div className="space-y-4">
            {pageState.loadingTemperatures ? (
              <div className="flex justify-center py-4">
                <div className="text-sm text-gray-500">
                  Loading temperature records...
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Horizontal Button Strip */}
                <div className="flex flex-wrap gap-2">
                  {pageState.temperatures.map((temp) => (
                    <button
                      key={temp.tempId}
                      onClick={() => handleTemperatureSelect(temp)}
                      className={`px-4 py-2 text-sm font-medium transition-all relative ${
                        pageState.selectedTemperature?.tempId === temp.tempId
                          ? "bg-white text-gray-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-app-primary"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {temp.hour.toString().padStart(2, "0")}:00
                    </button>
                  ))}

                  {/* Add New Temperature Button */}
                  <button
                    onClick={handleCreateNewTemperature}
                    className="px-4 py-2 text-sm font-medium transition-all bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-dashed border-gray-300 hover:border-gray-400"
                    title="Add new temperature record"
                  >
                    *
                  </button>
                </div>

                {/* Temperature Record Form */}
                {pageState.selectedTemperature && (
                  <div className="bg-gray-50 p-6 rounded-lg border">
                    <h4 className="text-md font-medium text-gray-900 mb-4">
                      Temperature Record Details
                    </h4>

                    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Hour */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Hour (0-23)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="23"
                            {...register("hour", {
                              required: "Hour is required",
                              min: {
                                value: 0,
                                message: "Hour must be 0 or greater",
                              },
                              max: {
                                value: 23,
                                message: "Hour must be 23 or less",
                              },
                              valueAsNumber: true,
                            })}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-app-primary focus:border-transparent ${
                              errors.hour ? "border-red-500" : "border-gray-300"
                            }`}
                          />
                          {errors.hour && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.hour.message}
                            </p>
                          )}
                        </div>

                        {/* Degrees */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Temperature (°C)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            {...register("degrees", {
                              required: "Temperature is required",
                              valueAsNumber: true,
                            })}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-app-primary focus:border-transparent ${
                              errors.degrees
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          {errors.degrees && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.degrees.message}
                            </p>
                          )}
                        </div>

                        {/* Hidden fields for form data integrity */}
                        <input type="hidden" {...register("tempId")} />
                        <input type="hidden" {...register("roomId")} />
                        <input type="hidden" {...register("date")} />
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end pt-4">
                        <button
                          type="submit"
                          disabled={!isDirty}
                          className={`px-6 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            isDirty
                              ? "bg-app-primary text-white hover:bg-app-primary-dark focus:ring-app-primary cursor-pointer"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty State Message */}
        {pageState.selectedDate &&
          pageState.temperatures.length === 0 &&
          !pageState.loadingTemperatures && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No temperature records found for the selected date.
              </p>
            </div>
          )}

        {/* Initial State Message */}
        {!pageState.selectedDate && (
          <div className="border-t pt-4">
            <p className="text-sm text-gray-500 italic">
              Select a house, room, and date to view temperature records.
            </p>
          </div>
        )}
      </div>

      {/* Success Dialog */}
      <ConfirmDialog
        isOpen={pageState.showSuccessDialog}
        title="Temperature Saved Successfully"
        description="The temperature record has been updated successfully."
        onOk={handleSuccessDialogOk}
        okText="OK"
      />
    </div>
  );
}
