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

interface House {
  houseId: number;
  name: string;
  area: number;
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

export function ReportTemperature() {
  const { apiUrl, apiKey } = useTemperatureApiEnvVariables();
  const [houses, setHouses] = useState<House[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  const [temperatures, setTemperatures] = useState<Temperature[]>([]);
  const [selectedHouseId, setSelectedHouseId] = useState<number | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTemperature, setSelectedTemperature] =
    useState<Temperature | null>(null);
  const [loadingHouses, setLoadingHouses] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingTemperatures, setLoadingTemperatures] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

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
      setTemperatures((prev) =>
        prev
          .map((temp) =>
            temp.tempId === data.tempId
              ? { ...temp, hour: data.hour, degrees: data.degrees }
              : temp
          )
          .sort((a, b) => a.hour - b.hour)
      );

      // Update the selected temperature
      if (selectedTemperature && selectedTemperature.tempId === data.tempId) {
        setSelectedTemperature({
          ...selectedTemperature,
          hour: data.hour,
          degrees: data.degrees,
        });
      }

      // Reset form dirty state
      reset(data);

      // Show success dialog
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error saving temperature:", error);
      alert("Failed to save temperature record. Please try again.");
    }
  };

  // Handle success dialog OK button
  const handleSuccessDialogOk = () => {
    setShowSuccessDialog(false);
  };

  // Load all houses on component mount
  useEffect(() => {
    const fetchHouses = async () => {
      try {
        const response = await fetch(`${apiUrl}/Houses`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": apiKey,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch houses");
        }

        const result = await response.json();
        // The TemperatureService returns a HousesResult object with a houses array (camelCase)
        setHouses(result.houses || []);
      } catch (error) {
        console.error("Error fetching houses:", error);
      } finally {
        setLoadingHouses(false);
      }
    };

    fetchHouses();
  }, [apiUrl, apiKey]);

  // Load rooms when a house is selected
  useEffect(() => {
    if (selectedHouseId) {
      const fetchRooms = async () => {
        setLoadingRooms(true);
        try {
          const response = await fetch(
            `${apiUrl}/House/${selectedHouseId}/rooms`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "X-Api-Key": apiKey,
              },
            }
          );

          if (!response.ok) {
            throw new Error("Failed to fetch rooms");
          }

          const result = await response.json();
          // The TemperatureService returns a HouseRoomsResult object with a rooms array (camelCase)
          setRooms(result.rooms || []);
        } catch (error) {
          console.error("Error fetching rooms:", error);
          setRooms([]);
        } finally {
          setLoadingRooms(false);
        }
      };

      fetchRooms();
    } else {
      setRooms([]);
      setSelectedRoomId(null);
    }
  }, [selectedHouseId, apiUrl, apiKey]);

  // Load available dates when a room is selected
  useEffect(() => {
    if (selectedRoomId) {
      const fetchAvailableDates = async () => {
        setLoadingDates(true);
        try {
          const response = await fetch(
            `${apiUrl}/Temperature/room/${selectedRoomId}/dates`,
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

          setAvailableDates(formattedDates);
        } catch (error) {
          console.error("Error fetching available dates:", error);
          setAvailableDates([]);
        } finally {
          setLoadingDates(false);
        }
      };

      fetchAvailableDates();
    } else {
      setAvailableDates([]);
      setSelectedDate(null);
    }
  }, [selectedRoomId, apiUrl, apiKey]);

  // Load temperature records when date is selected
  useEffect(() => {
    if (selectedRoomId && selectedDate) {
      const fetchTemperatures = async () => {
        setLoadingTemperatures(true);
        try {
          const response = await fetch(
            `${apiUrl}/Temperature/room/${selectedRoomId}/date/${selectedDate}`,
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
          setTemperatures(sortedTemperatures);
        } catch (error) {
          console.error("Error fetching temperature records:", error);
          setTemperatures([]);
        } finally {
          setLoadingTemperatures(false);
        }
      };

      fetchTemperatures();
    } else {
      setTemperatures([]);
      setSelectedTemperature(null);
    }
  }, [selectedRoomId, selectedDate, apiUrl, apiKey]);

  const handleHouseChange = (value: string) => {
    const houseId = parseInt(value);
    setSelectedHouseId(houseId);
    setSelectedRoomId(null); // Reset room selection when house changes
  };

  const handleRoomChange = (value: string) => {
    const roomId = parseInt(value);
    setSelectedRoomId(roomId);
    setSelectedDate(null); // Reset date selection when room changes
  };

  const handleDateChange = (value: string) => {
    setSelectedDate(value);
  };

  const handleTemperatureSelect = (temperature: Temperature) => {
    setSelectedTemperature(temperature);
    // Populate the form with the selected temperature data
    setValue("tempId", temperature.tempId);
    setValue("roomId", temperature.roomId);
    setValue("hour", temperature.hour);
    setValue("degrees", temperature.degrees);
    setValue("date", temperature.date);
  };

  const handleCreateNewTemperature = async () => {
    if (!selectedRoomId || !selectedDate) return;

    try {
      // Find a suitable hour that doesn't exist yet
      const existingHours = temperatures
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
        selectedDate + "T00:00:00.000Z"
      ).toISOString();

      const response = await fetch(`${apiUrl}/Temperature`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKey,
        },
        body: JSON.stringify({
          roomId: selectedRoomId,
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

      // Update local temperatures array
      setTemperatures((prev) =>
        [...prev, newTemperature].sort((a, b) => a.hour - b.hour)
      );

      // Select the new temperature record
      setSelectedTemperature(newTemperature);
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
              value={selectedHouseId?.toString() || ""}
              onValueChange={handleHouseChange}
              disabled={loadingHouses}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    loadingHouses ? "Loading houses..." : "Choose a house"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {houses.map((house) => (
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
              value={selectedRoomId?.toString() || ""}
              onValueChange={handleRoomChange}
              disabled={!selectedHouseId || loadingRooms || rooms.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    !selectedHouseId
                      ? "Select a house first"
                      : loadingRooms
                      ? "Loading rooms..."
                      : rooms.length === 0
                      ? "No rooms available"
                      : "Choose a room"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room.roomId} value={room.roomId.toString()}>
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
              value={selectedDate || ""}
              onValueChange={handleDateChange}
              disabled={
                !selectedRoomId || loadingDates || availableDates.length === 0
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    !selectedRoomId
                      ? "Select a room first"
                      : loadingDates
                      ? "Loading dates..."
                      : availableDates.length === 0
                      ? "No dates available"
                      : "Choose a date"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableDates.map((dateObj) => (
                  <SelectItem key={dateObj.date} value={dateObj.date}>
                    {dateObj.displayDate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Temperature Time Buttons */}
        {selectedDate && temperatures.length > 0 && (
          <div className="space-y-4">
            {loadingTemperatures ? (
              <div className="flex justify-center py-4">
                <div className="text-sm text-gray-500">
                  Loading temperature records...
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Horizontal Button Strip */}
                <div className="flex flex-wrap gap-2">
                  {temperatures.map((temp) => (
                    <button
                      key={temp.tempId}
                      onClick={() => handleTemperatureSelect(temp)}
                      className={`px-4 py-2 text-sm font-medium transition-all relative ${
                        selectedTemperature?.tempId === temp.tempId
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
                {selectedTemperature && (
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
        {selectedDate && temperatures.length === 0 && !loadingTemperatures && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              No temperature records found for the selected date.
            </p>
          </div>
        )}

        {/* Initial State Message */}
        {!selectedDate && (
          <div className="border-t pt-4">
            <p className="text-sm text-gray-500 italic">
              Select a house, room, and date to view temperature records.
            </p>
          </div>
        )}
      </div>

      {/* Success Dialog */}
      <ConfirmDialog
        isOpen={showSuccessDialog}
        title="Temperature Saved Successfully"
        description="The temperature record has been updated successfully."
        onOk={handleSuccessDialogOk}
        okText="OK"
      />
    </div>
  );
}
