# MSW Implementation Plan for HouseProject Frontend Testing

_Comprehensive plan for implementing Mock Service Worker (MSW) to enable component testing with API calls_

## 🎯 Implementation Overview

This plan follows **Frontend-Agent.md** patterns and integrates MSW (Mock Service Worker) to enable comprehensive testing of React components that make backend API calls. MSW will provide realistic API mocking capabilities for both unit and integration tests.

## 📐 Current Project Context

### Existing Architecture

- **Frontend**: React + TypeScript + Vite
- **API Integration**: Custom hooks (`useTemperatureApiEnvVariables`, `useApiEnvVariables`)
- **State Management**: Consolidated state pattern with single state objects
- **Components**: Temperature reporting, house temperature viewing, room management
- **No Current Frontend Testing**: Need to establish complete testing infrastructure

### Key Components Requiring API Mocking

1. **HouseTemperatures** - `/HousesWithRooms` API calls
2. **ReportTemperature** - Multiple API endpoints (houses, dates, temperatures)
3. **Future Components** - Any component making backend API calls

## 🧪 MSW Implementation Strategy

### Phase 1: Foundation Setup

#### 1.1 Dependencies Installation

```bash
# Core testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install --save-dev vitest jsdom @vitest/ui
npm install --save-dev msw

# TypeScript support
npm install --save-dev @types/jest @vitest/coverage-v8
```

#### 1.2 Test Configuration Files

**`vitest.config.ts`** - Test runner configuration

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "dist/",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

**`src/test/setup.ts`** - Test environment setup

```typescript
import "@testing-library/jest-dom";
import { beforeAll, afterEach, afterAll } from "vitest";
import { server } from "./mocks/server";

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());

// Mock environment variables
Object.defineProperty(import.meta, "env", {
  value: {
    VITE_TEMPERATURE_API_URL: "http://localhost:5001/api",
    VITE_TEMPERATURE_API_KEY: "test-api-key",
    VITE_HOUSE_API_URL: "http://localhost:5000/api",
    VITE_HOUSE_API_KEY: "test-house-api-key",
  },
  writable: true,
});
```

### Phase 2: MSW Infrastructure

#### 2.1 Mock Server Setup

**`src/test/mocks/server.ts`** - MSW server configuration

```typescript
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

// Setup requests interception on the server side
export const server = setupServer(...handlers);
```

**`src/test/mocks/browser.ts`** - Browser MSW setup (for development)

```typescript
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

// Setup requests interception on the browser side
export const worker = setupWorker(...handlers);
```

#### 2.2 API Handlers Following Frontend-Agent.md Patterns

**`src/test/mocks/handlers/index.ts`** - Main handlers export

```typescript
import { temperatureHandlers } from "./temperatureHandlers";
import { houseHandlers } from "./houseHandlers";

export const handlers = [...temperatureHandlers, ...houseHandlers];
```

**`src/test/mocks/handlers/temperatureHandlers.ts`** - Temperature API mocks

```typescript
import { HttpResponse, http } from "msw";
import { mockTemperatureData } from "../data/temperatureData";

const API_BASE = "http://localhost:5001/api";

export const temperatureHandlers = [
  // GET /HousesWithRooms - Used by HouseTemperatures component
  http.get(`${API_BASE}/HousesWithRooms`, ({ request }) => {
    const apiKey = request.headers.get("X-Api-Key");

    if (!apiKey || apiKey !== "test-api-key") {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return HttpResponse.json({
      houses: mockTemperatureData.housesWithRooms,
    });
  }),

  // GET /Temperature/room/{roomId}/dates - Used by ReportTemperature
  http.get(
    `${API_BASE}/Temperature/room/:roomId/dates`,
    ({ params, request }) => {
      const apiKey = request.headers.get("X-Api-Key");
      const roomId = parseInt(params.roomId as string);

      if (!apiKey || apiKey !== "test-api-key") {
        return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const dates = mockTemperatureData.getAvailableDatesForRoom(roomId);
      return HttpResponse.json(dates);
    }
  ),

  // GET /Temperature/room/{roomId}/date/{date} - Used by ReportTemperature
  http.get(
    `${API_BASE}/Temperature/room/:roomId/date/:date`,
    ({ params, request }) => {
      const apiKey = request.headers.get("X-Api-Key");
      const roomId = parseInt(params.roomId as string);
      const date = params.date as string;

      if (!apiKey || apiKey !== "test-api-key") {
        return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const temperatures = mockTemperatureData.getTemperaturesByRoomAndDate(
        roomId,
        date
      );
      return HttpResponse.json(temperatures);
    }
  ),

  // PUT /Temperature/{tempId} - Used by ReportTemperature
  http.put(`${API_BASE}/Temperature/:tempId`, async ({ params, request }) => {
    const apiKey = request.headers.get("X-Api-Key");
    const tempId = parseInt(params.tempId as string);

    if (!apiKey || apiKey !== "test-api-key") {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as any;
    const updatedTemperature = mockTemperatureData.updateTemperature(
      tempId,
      body
    );

    return HttpResponse.json(updatedTemperature);
  }),

  // POST /Temperature - Used by ReportTemperature
  http.post(`${API_BASE}/Temperature`, async ({ request }) => {
    const apiKey = request.headers.get("X-Api-Key");

    if (!apiKey || apiKey !== "test-api-key") {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as any;
    const newTemperature = mockTemperatureData.createTemperature(body);

    return HttpResponse.json(newTemperature, { status: 201 });
  }),
];
```

**`src/test/mocks/handlers/houseHandlers.ts`** - House API mocks

```typescript
import { HttpResponse, http } from "msw";
import { mockHouseData } from "../data/houseData";

const API_BASE = "http://localhost:5000/api";

export const houseHandlers = [
  // GET /Houses - Basic house listing
  http.get(`${API_BASE}/Houses`, ({ request }) => {
    const apiKey = request.headers.get("X-Api-Key");

    if (!apiKey || apiKey !== "test-house-api-key") {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return HttpResponse.json({
      houses: mockHouseData.houses,
    });
  }),

  // Future endpoints can be added here
];
```

#### 2.3 Mock Data Management

**`src/test/mocks/data/temperatureData.ts`** - Temperature test data

```typescript
import { House, Room } from "@/pages/Temperature/houseTemperatures";

interface Temperature {
  tempId: number;
  roomId: number;
  hour: number;
  degrees: number;
  date: string;
}

class MockTemperatureData {
  private static instance: MockTemperatureData;
  private temperatures: Temperature[] = [];
  private nextTempId = 1;

  static getInstance(): MockTemperatureData {
    if (!MockTemperatureData.instance) {
      MockTemperatureData.instance = new MockTemperatureData();
    }
    return MockTemperatureData.instance;
  }

  // Houses with rooms data following Frontend-Agent.md patterns
  readonly housesWithRooms: House[] = [
    {
      houseId: 1,
      name: "Test House 1",
      area: 1200,
      rooms: [
        {
          roomId: 1,
          houseId: 1,
          name: "Living Room",
          type: "Living",
          area: 350,
          placement: "Ground Floor",
        },
        {
          roomId: 2,
          houseId: 1,
          name: "Kitchen",
          type: "Kitchen",
          area: 200,
          placement: "Ground Floor",
        },
      ],
    },
    {
      houseId: 2,
      name: "Test House 2",
      area: 800,
      rooms: [
        {
          roomId: 3,
          houseId: 2,
          name: "Bedroom",
          type: "Bedroom",
          area: 250,
          placement: "Upper Floor",
        },
      ],
    },
  ];

  constructor() {
    this.seedTestData();
  }

  private seedTestData() {
    // Seed temperature data for testing
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split("T")[0];

    this.temperatures = [
      {
        tempId: this.nextTempId++,
        roomId: 1,
        hour: 8,
        degrees: 20.5,
        date: today,
      },
      {
        tempId: this.nextTempId++,
        roomId: 1,
        hour: 12,
        degrees: 22.0,
        date: today,
      },
      {
        tempId: this.nextTempId++,
        roomId: 1,
        hour: 18,
        degrees: 21.5,
        date: today,
      },
      {
        tempId: this.nextTempId++,
        roomId: 2,
        hour: 9,
        degrees: 19.0,
        date: yesterday,
      },
      {
        tempId: this.nextTempId++,
        roomId: 3,
        hour: 10,
        degrees: 18.5,
        date: today,
      },
    ];
  }

  getAvailableDatesForRoom(roomId: number): string[] {
    const dates = [
      ...new Set(
        this.temperatures.filter((t) => t.roomId === roomId).map((t) => t.date)
      ),
    ];
    return dates.sort();
  }

  getTemperaturesByRoomAndDate(roomId: number, date: string): Temperature[] {
    return this.temperatures
      .filter((t) => t.roomId === roomId && t.date === date)
      .sort((a, b) => a.hour - b.hour);
  }

  updateTemperature(
    tempId: number,
    updates: Partial<Temperature>
  ): Temperature {
    const index = this.temperatures.findIndex((t) => t.tempId === tempId);
    if (index === -1) {
      throw new Error(`Temperature ${tempId} not found`);
    }

    this.temperatures[index] = { ...this.temperatures[index], ...updates };
    return this.temperatures[index];
  }

  createTemperature(data: Omit<Temperature, "tempId">): Temperature {
    const newTemp: Temperature = {
      tempId: this.nextTempId++,
      ...data,
    };
    this.temperatures.push(newTemp);
    return newTemp;
  }

  reset() {
    this.temperatures = [];
    this.nextTempId = 1;
    this.seedTestData();
  }
}

export const mockTemperatureData = MockTemperatureData.getInstance();
```

**`src/test/mocks/data/houseData.ts`** - House test data

```typescript
interface House {
  houseId: number;
  name: string;
  area: number;
}

class MockHouseData {
  readonly houses: House[] = [
    { houseId: 1, name: "Test House 1", area: 1200 },
    { houseId: 2, name: "Test House 2", area: 800 },
    { houseId: 3, name: "Test House 3", area: 1500 },
  ];
}

export const mockHouseData = new MockHouseData();
```

### Phase 3: Component Testing Implementation

#### 3.1 Test Utilities Following Frontend-Agent.md Patterns

**`src/test/utils/testUtils.tsx`** - Custom render utilities

```typescript
import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

// All the providers you need for testing
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from "@testing-library/react";
export { customRender as render };
```

**`src/test/utils/mockHelpers.ts`** - MSW helper utilities

```typescript
import { server } from "../mocks/server";
import { HttpResponse, http } from "msw";

export const mockApiError = (
  endpoint: string,
  status: number = 500,
  message: string = "Server Error"
) => {
  server.use(
    http.get(endpoint, () => {
      return HttpResponse.json({ error: message }, { status });
    })
  );
};

export const mockApiSuccess = (endpoint: string, data: any) => {
  server.use(
    http.get(endpoint, () => {
      return HttpResponse.json(data);
    })
  );
};

export const mockApiDelay = (endpoint: string, delay: number = 1000) => {
  server.use(
    http.get(endpoint, async () => {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return HttpResponse.json({ data: "delayed response" });
    })
  );
};
```

#### 3.2 Component Tests Following Frontend-Agent.md Patterns

**`src/pages/Temperature/__tests__/houseTemperatures.test.tsx`** - HouseTemperatures component tests

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/utils/testUtils";
import { HouseTemperatures } from "../houseTemperatures";
import { mockApiError, mockApiDelay } from "@/test/utils/mockHelpers";
import { mockTemperatureData } from "@/test/mocks/data/temperatureData";

describe("HouseTemperatures", () => {
  beforeEach(() => {
    // Reset mock data before each test
    mockTemperatureData.reset();
  });

  describe("Component Rendering", () => {
    it("renders loading state initially", () => {
      render(<HouseTemperatures />);
      expect(screen.getByText("Loading houses...")).toBeInTheDocument();
    });

    it("renders page title correctly", () => {
      render(<HouseTemperatures />);
      expect(
        screen.getByRole("heading", { name: "House Temperatures" })
      ).toBeInTheDocument();
    });
  });

  describe("API Integration", () => {
    it("loads and displays houses with rooms successfully", async () => {
      render(<HouseTemperatures />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText("Loading houses...")).not.toBeInTheDocument();
      });

      // Check if houses are displayed
      expect(screen.getByText("Test House 1")).toBeInTheDocument();
      expect(screen.getByText("Test House 2")).toBeInTheDocument();

      // Check house details
      expect(screen.getByText("1,200 sq m • 2 rooms")).toBeInTheDocument();
      expect(screen.getByText("800 sq m • 1 room")).toBeInTheDocument();
    });

    it("handles API errors gracefully", async () => {
      // Mock API error
      mockApiError(
        "http://localhost:5001/api/HousesWithRooms",
        500,
        "Server Error"
      );

      render(<HouseTemperatures />);

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
        expect(
          screen.getByText(/Failed to load houses: 500/)
        ).toBeInTheDocument();
      });
    });

    it("shows empty state when no houses returned", async () => {
      // Mock empty response
      server.use(
        http.get("http://localhost:5001/api/HousesWithRooms", () => {
          return HttpResponse.json({ houses: [] });
        })
      );

      render(<HouseTemperatures />);

      await waitFor(() => {
        expect(screen.getByText("No houses found.")).toBeInTheDocument();
      });
    });
  });

  describe("State Management (Frontend-Agent.md patterns)", () => {
    it("manages consolidated state correctly", async () => {
      render(<HouseTemperatures />);

      // Initial state: loading = true
      expect(screen.getByText("Loading houses...")).toBeInTheDocument();

      // After load: loading = false, data populated
      await waitFor(() => {
        expect(screen.queryByText("Loading houses...")).not.toBeInTheDocument();
        expect(screen.getByText("Test House 1")).toBeInTheDocument();
      });
    });

    it("handles room temperature dialog state", async () => {
      render(<HouseTemperatures />);

      await waitFor(() => {
        expect(screen.getByText("Test House 1")).toBeInTheDocument();
      });

      // Note: This would require expanding the accordion and clicking a room
      // Full implementation would test dialog opening/closing
    });
  });

  describe("User Interactions", () => {
    it("expands house accordion when clicked", async () => {
      render(<HouseTemperatures />);

      await waitFor(() => {
        expect(screen.getByText("Test House 1")).toBeInTheDocument();
      });

      // Click to expand accordion
      const houseAccordion = screen.getByText("Test House 1");
      fireEvent.click(houseAccordion);

      // Check if rooms are displayed
      await waitFor(() => {
        expect(screen.getByText("Living Room")).toBeInTheDocument();
        expect(screen.getByText("Kitchen")).toBeInTheDocument();
      });
    });
  });

  describe("Error Scenarios", () => {
    it("handles network timeouts", async () => {
      mockApiDelay("http://localhost:5001/api/HousesWithRooms", 5000);

      render(<HouseTemperatures />);

      // Should show loading state for extended time
      expect(screen.getByText("Loading houses...")).toBeInTheDocument();

      // Could test timeout behavior if implemented
    });

    it("handles unauthorized access", async () => {
      mockApiError(
        "http://localhost:5001/api/HousesWithRooms",
        401,
        "Unauthorized"
      );

      render(<HouseTemperatures />);

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
        expect(
          screen.getByText(/Failed to load houses: 401/)
        ).toBeInTheDocument();
      });
    });
  });
});
```

**`src/pages/Temperature/__tests__/reportTemperature.test.tsx`** - ReportTemperature component tests

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from "@/test/utils/testUtils";
import userEvent from "@testing-library/user-event";
import { ReportTemperature } from "../reportTemperature";
import { mockTemperatureData } from "@/test/mocks/data/temperatureData";
import { mockApiError } from "@/test/utils/mockHelpers";

// Mock react-router-dom Link component
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  };
});

describe("ReportTemperature", () => {
  beforeEach(() => {
    mockTemperatureData.reset();
  });

  describe("Component Structure", () => {
    it("renders main navigation and title", async () => {
      render(<ReportTemperature />);

      expect(screen.getByText("← Back to Temperature")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Report Temperatures" })
      ).toBeInTheDocument();
    });

    it("renders selection dropdowns in correct order", async () => {
      render(<ReportTemperature />);

      expect(screen.getByText("Select House")).toBeInTheDocument();
      expect(screen.getByText("Select Room")).toBeInTheDocument();
      expect(screen.getByText("Select Date")).toBeInTheDocument();
    });
  });

  describe("Sequential Selection Flow (Frontend-Agent.md state patterns)", () => {
    const user = userEvent.setup();

    it("loads houses on mount and enables house selection", async () => {
      render(<ReportTemperature />);

      // Wait for houses to load
      await waitFor(() => {
        expect(screen.queryByText("Loading houses...")).not.toBeInTheDocument();
      });

      // Check house dropdown is enabled with options
      const houseSelect = screen.getByRole("combobox", {
        name: /select house/i,
      });
      expect(houseSelect).not.toBeDisabled();
    });

    it("enables room selection after house is selected", async () => {
      const user = userEvent.setup();
      render(<ReportTemperature />);

      await waitFor(() => {
        expect(screen.queryByText("Loading houses...")).not.toBeInTheDocument();
      });

      // Initially room select should be disabled
      const roomSelect = screen.getByRole("combobox", { name: /select room/i });
      expect(roomSelect).toBeDisabled();

      // Select a house
      const houseSelect = screen.getByRole("combobox", {
        name: /select house/i,
      });
      await user.click(houseSelect);
      await user.click(screen.getByText("Test House 1"));

      // Room select should now be enabled
      await waitFor(() => {
        expect(roomSelect).not.toBeDisabled();
      });
    });

    it("enables date selection after room is selected", async () => {
      const user = userEvent.setup();
      render(<ReportTemperature />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.queryByText("Loading houses...")).not.toBeInTheDocument();
      });

      // Select house and room
      const houseSelect = screen.getByRole("combobox", {
        name: /select house/i,
      });
      await user.click(houseSelect);
      await user.click(screen.getByText("Test House 1"));

      const roomSelect = screen.getByRole("combobox", { name: /select room/i });
      await user.click(roomSelect);
      await user.click(screen.getByText("Living Room"));

      // Date select should become enabled and load dates
      const dateSelect = screen.getByRole("combobox", { name: /select date/i });
      await waitFor(() => {
        expect(dateSelect).not.toBeDisabled();
        expect(screen.queryByText("Loading dates...")).not.toBeInTheDocument();
      });
    });

    it("loads temperature records after complete selection", async () => {
      const user = userEvent.setup();
      render(<ReportTemperature />);

      await waitFor(() => {
        expect(screen.queryByText("Loading houses...")).not.toBeInTheDocument();
      });

      // Complete the selection flow
      const houseSelect = screen.getByRole("combobox", {
        name: /select house/i,
      });
      await user.click(houseSelect);
      await user.click(screen.getByText("Test House 1"));

      const roomSelect = screen.getByRole("combobox", { name: /select room/i });
      await user.click(roomSelect);
      await user.click(screen.getByText("Living Room"));

      const dateSelect = screen.getByRole("combobox", { name: /select date/i });
      await user.click(dateSelect);
      // Select today's date (mocked data has today's records)
      const today = new Date().toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      await user.click(screen.getByText(today));

      // Temperature buttons should appear
      await waitFor(() => {
        expect(screen.getByText("08:00")).toBeInTheDocument();
        expect(screen.getByText("12:00")).toBeInTheDocument();
        expect(screen.getByText("18:00")).toBeInTheDocument();
      });
    });
  });

  describe("Temperature Record Management", () => {
    const user = userEvent.setup();

    it("allows editing existing temperature records", async () => {
      render(<ReportTemperature />);

      // Complete selection flow (abbreviated)
      await completeSelectionFlow(user);

      // Click on a temperature time slot
      await user.click(screen.getByText("08:00"));

      // Form should appear with current values
      await waitFor(() => {
        expect(
          screen.getByText("Temperature Record Details")
        ).toBeInTheDocument();
        expect(screen.getByDisplayValue("8")).toBeInTheDocument(); // hour
        expect(screen.getByDisplayValue("20.5")).toBeInTheDocument(); // degrees
      });

      // Modify temperature
      const degreesInput = screen.getByLabelText(/temperature.*°c/i);
      await user.clear(degreesInput);
      await user.type(degreesInput, "23.5");

      // Save changes
      const saveButton = screen.getByRole("button", { name: /save changes/i });
      expect(saveButton).not.toBeDisabled();
      await user.click(saveButton);

      // Success dialog should appear
      await waitFor(() => {
        expect(
          screen.getByText("Temperature Saved Successfully")
        ).toBeInTheDocument();
      });
    });

    it("handles temperature creation", async () => {
      render(<ReportTemperature />);

      await completeSelectionFlow(user);

      // Click the "add new" button (*)
      const addButton = screen.getByRole("button", { name: "*" });
      await user.click(addButton);

      // New temperature should be created and form should appear
      await waitFor(() => {
        expect(
          screen.getByText("Temperature Record Details")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling (Frontend-Agent.md patterns)", () => {
    it("displays consolidated error states correctly", async () => {
      // Mock multiple API errors
      mockApiError(
        "http://localhost:5001/api/HousesWithRooms",
        500,
        "Failed to load houses"
      );

      render(<ReportTemperature />);

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
        expect(screen.getByText("Failed to load houses")).toBeInTheDocument();
      });
    });

    it("handles form validation errors", async () => {
      const user = userEvent.setup();
      render(<ReportTemperature />);

      await completeSelectionFlow(user);
      await user.click(screen.getByText("08:00"));

      // Clear required field
      const hourInput = screen.getByLabelText(/hour.*0-23/i);
      await user.clear(hourInput);
      await user.type(hourInput, "25"); // Invalid hour

      // Try to save
      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(saveButton);

      // Validation error should appear
      await waitFor(() => {
        expect(screen.getByText("Hour must be 23 or less")).toBeInTheDocument();
      });
    });
  });

  // Helper function for common test setup
  async function completeSelectionFlow(user: any) {
    await waitFor(() => {
      expect(screen.queryByText("Loading houses...")).not.toBeInTheDocument();
    });

    const houseSelect = screen.getByRole("combobox", { name: /select house/i });
    await user.click(houseSelect);
    await user.click(screen.getByText("Test House 1"));

    const roomSelect = screen.getByRole("combobox", { name: /select room/i });
    await user.click(roomSelect);
    await user.click(screen.getByText("Living Room"));

    const dateSelect = screen.getByRole("combobox", { name: /select date/i });
    await user.click(dateSelect);
    const today = new Date().toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    await user.click(screen.getByText(today));

    await waitFor(() => {
      expect(screen.getByText("08:00")).toBeInTheDocument();
    });
  }
});
```

### Phase 4: Package.json Integration

#### 4.1 Updated Scripts Section

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch"
  }
}
```

## 📋 Implementation Todo List

### Phase 1: Foundation Setup ⚡ HIGH PRIORITY

- [ ] **Install core testing dependencies**

  - Install @testing-library/react, @testing-library/jest-dom, @testing-library/user-event
  - Install vitest, jsdom, @vitest/ui, @vitest/coverage-v8
  - Install msw for API mocking
  - Install TypeScript types: @types/jest

- [ ] **Create test configuration files**
  - Create `vitest.config.ts` with React plugin and jsdom environment
  - Create `src/test/setup.ts` with global test setup and MSW server initialization
  - Update `package.json` with test scripts
  - Configure path aliases to match main Vite config

### Phase 2: MSW Infrastructure ⚡ HIGH PRIORITY

- [ ] **Setup MSW server and handlers**

  - Create `src/test/mocks/server.ts` with MSW server setup
  - Create `src/test/mocks/browser.ts` for development mocking (optional)
  - Create `src/test/mocks/handlers/index.ts` as main handlers export

- [ ] **Create API handlers following Frontend-Agent.md patterns**

  - Create `src/test/mocks/handlers/temperatureHandlers.ts` with all Temperature API endpoints
  - Create `src/test/mocks/handlers/houseHandlers.ts` with House API endpoints
  - Implement proper API key validation in handlers
  - Add error response scenarios for each endpoint

- [ ] **Create mock data management**
  - Create `src/test/mocks/data/temperatureData.ts` with realistic test data
  - Create `src/test/mocks/data/houseData.ts` with house test data
  - Implement data manipulation methods (create, update, delete)
  - Add data reset functionality for test isolation

### Phase 3: Test Utilities 🔧 MEDIUM PRIORITY

- [ ] **Create test utilities following Frontend-Agent.md patterns**

  - Create `src/test/utils/testUtils.tsx` with custom render function
  - Add React Router wrapper to test utilities
  - Create `src/test/utils/mockHelpers.ts` with MSW helper functions
  - Add utilities for common test scenarios (error mocking, delay simulation)

- [ ] **Setup test data builders**
  - Create builders for House, Room, Temperature entities
  - Add factory functions for common test scenarios
  - Implement test data variation helpers

### Phase 4: Component Testing 🧪 HIGH PRIORITY

- [ ] **Create HouseTemperatures component tests**

  - Create `src/pages/Temperature/__tests__/houseTemperatures.test.tsx`
  - Test component rendering states (loading, success, error, empty)
  - Test API integration with mocked responses
  - Test state management following Frontend-Agent.md patterns
  - Test user interactions (accordion expansion, room selection)
  - Test error scenarios (network errors, unauthorized, timeouts)

- [ ] **Create ReportTemperature component tests**
  - Create `src/pages/Temperature/__tests__/reportTemperature.test.tsx`
  - Test sequential selection flow (house → room → date → temperatures)
  - Test temperature record management (view, edit, create)
  - Test form validation and submission
  - Test consolidated error handling patterns
  - Test loading states and async operations

### Phase 5: Advanced Testing Features 🚀 LOW PRIORITY

- [ ] **Add integration test scenarios**

  - Test complete user workflows end-to-end
  - Test component interaction patterns
  - Test navigation and routing integration

- [ ] **Add accessibility testing**

  - Install @testing-library/jest-dom accessibility matchers
  - Add ARIA label and role testing
  - Test keyboard navigation

- [ ] **Add performance testing**
  - Test render performance with large datasets
  - Test memory leak scenarios
  - Add bundle size impact analysis

### Phase 6: CI/CD Integration 🔄 MEDIUM PRIORITY

- [ ] **Setup continuous testing**

  - Add test commands to Dockerfile
  - Configure coverage reporting
  - Add test result reporting to CI pipeline

- [ ] **Add test quality gates**
  - Set minimum coverage thresholds (85% component coverage target)
  - Add test performance benchmarks
  - Configure automated test execution on PR

## 🎯 Success Criteria

### Functional Requirements ✅

- [ ] All API calls in components are mockable and testable
- [ ] Components render correctly with mocked data
- [ ] Error scenarios are thoroughly tested
- [ ] User interactions are properly tested
- [ ] State management follows Frontend-Agent.md patterns

### Quality Requirements 📊

- [ ] Achieve 85%+ test coverage on components that make API calls
- [ ] All critical user paths have test coverage
- [ ] Tests execute quickly (< 5 seconds for full suite)
- [ ] Tests are reliable and don't have flaky failures
- [ ] Test code follows Frontend-Agent.md patterns

### Integration Requirements 🔗

- [ ] MSW handlers match actual API contracts
- [ ] Tests work in both development and CI environments
- [ ] Mock data is realistic and covers edge cases
- [ ] Tests can run in isolation without external dependencies

## 🔧 Maintenance Considerations

### Ongoing Tasks

- **API Contract Updates**: Update MSW handlers when backend APIs change
- **Test Data Maintenance**: Keep mock data synchronized with real data structures
- **Coverage Monitoring**: Regular review of test coverage reports
- **Performance Monitoring**: Track test execution time and optimize as needed

### Best Practices

- **Follow Frontend-Agent.md patterns** for state management and component structure
- **Keep mock data realistic** to catch integration issues early
- **Test error scenarios** as thoroughly as success scenarios
- **Maintain test isolation** by resetting state between tests
- **Document complex test scenarios** for future maintainers

## 📝 Expected Deliverables

Upon completion of this implementation plan:

### 🧪 Tests Created

- Complete test suite for HouseTemperatures component (15+ test cases)
- Complete test suite for ReportTemperature component (20+ test cases)
- Comprehensive MSW mock server with all current API endpoints
- Test utilities and helpers for future component testing

### 📊 Coverage Impact

- 85%+ coverage on API-calling components
- All critical user workflows tested
- Error handling and edge cases covered
- Performance and accessibility considerations included

### 🔧 Test Infrastructure

- MSW server with realistic API mocking
- Test data management system
- Automated test execution setup
- CI/CD pipeline integration ready

### 🚀 Execution Instructions

- `npm test` - Run all tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run test:ui` - Launch Vitest UI for interactive testing
- Tests integrate seamlessly with existing development workflow

---

_Implementation follows Frontend-Agent.md patterns and integrates with existing HouseProject architecture_
_Total estimated implementation time: 16-20 hours across 4 development phases_
