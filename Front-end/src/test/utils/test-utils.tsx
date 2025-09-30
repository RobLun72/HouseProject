// src/test/utils/test-utils.tsx
import React from "react";
import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import type { RenderOptions } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

// Custom wrapper component for tests
interface AllProvidersProps {
  children: React.ReactNode;
}

const AllProviders = ({ children }: AllProvidersProps) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

// Custom render function that includes providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllProviders, ...options });

// Re-export testing library functions individually to avoid fast refresh issues
export { customRender as render };
export { screen, fireEvent, waitFor, act } from "@testing-library/react";
