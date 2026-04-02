import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useGenerateMessage } from "@/hooks/useGenerateMessage";

// Mock global fetch
global.fetch = vi.fn();

describe("useGenerateMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate message successfully", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Generated message" }),
    });

    const { result } = renderHook(() => useGenerateMessage());

    const message = await result.current.generateMessage("lead-1");

    expect(message).toBe("Generated message");
    expect(result.current.error).toBeNull();
  });

  it("should handle API error", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Failed to generate" }),
    });

    const { result } = renderHook(() => useGenerateMessage());

    const message = await result.current.generateMessage("lead-1");

    await waitFor(() => {
      expect(result.current.error).toBe("Failed to generate");
    });
    expect(message).toBe("");
  });

  it("should handle network error", async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useGenerateMessage());

    const message = await result.current.generateMessage("lead-1");

    await waitFor(() => {
      expect(result.current.error).toBe("Falha de conexão com o servidor");
    });
    expect(message).toBe("");
  });

  it("should call correct endpoint", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Test" }),
    });

    const { result } = renderHook(() => useGenerateMessage());

    await result.current.generateMessage("lead-123");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/leads/lead-123/generate-message",
      { method: "POST" }
    );
  });

  it("should reset error on successful request", async () => {
    // First call with error
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "First error" }),
    });

    const { result } = renderHook(() => useGenerateMessage());
    await result.current.generateMessage("lead-1");

    await waitFor(() => {
      expect(result.current.error).toBe("First error");
    });

    // Second call should reset error
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Success" }),
    });

    const message = await result.current.generateMessage("lead-2");

    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });
    expect(message).toBe("Success");
  });
});
