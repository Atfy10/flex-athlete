import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock the auth context hook
const mockRegister = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ register: mockRegister }),
}));

import { MemoryRouter } from "react-router-dom";
import Register from "./Register";

describe("Register form", () => {
  beforeEach(() => {
    mockRegister.mockClear();
  });

  it("submits userName, email, password and phoneNumber to register()", async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    );
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Full name/i), "Test User");
    await user.type(screen.getByLabelText(/Email/i), "test@example.com");
    await user.type(screen.getByLabelText(/Phone/i), "+201234567890");
    await user.type(screen.getByLabelText("Password"), "Password123!");
    await user.type(screen.getByLabelText("Confirm Password"), "Password123!");

    await user.click(screen.getByRole("button", { name: /Create Account/i }));

    expect(mockRegister).toHaveBeenCalledTimes(1);
    expect(mockRegister).toHaveBeenCalledWith({
      userName: "Test User",
      email: "test@example.com",
      password: "Password123!",
      phoneNumber: "+201234567890",
    });
  });
});
