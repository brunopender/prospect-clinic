import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useLeads } from "@/hooks/useLeads";
import type { Lead } from "@/types/lead";

// Mock global fetch
global.fetch = vi.fn();

describe("useLeads", () => {
  const mockLead1: Lead = {
    id: "1",
    name: "João",
    profileUrl: "https://instagram.com/joao",
    platform: "instagram",
    bio: "Bio",
    followersCount: 100,
    status: "novo",
    message: null,
    createdAt: "2026-04-01T10:00:00.000Z",
  };

  const mockLead2: Lead = {
    id: "2",
    name: "Maria",
    profileUrl: "https://linkedin.com/maria",
    platform: "linkedin",
    bio: "Bio",
    followersCount: 200,
    status: "contatado",
    message: "Message",
    createdAt: "2026-04-02T10:00:00.000Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch leads successfully", async () => {
    const mockFetch = global.fetch as unknown as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [mockLead1, mockLead2],
    });

    const { result } = renderHook(() => useLeads());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.leads).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it("should sort leads by createdAt descending", async () => {
    const mockFetch = global.fetch as unknown as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [mockLead1, mockLead2],
    });

    const { result } = renderHook(() => useLeads());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.leads[0].id).toBe("2"); // Latest first
    expect(result.current.leads[1].id).toBe("1");
  });

  it("should pass filters as query params", async () => {
    const mockFetch = global.fetch as unknown as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [mockLead1],
    });

    const { result } = renderHook(() =>
      useLeads({ platform: "instagram", status: "novo" })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("platform=instagram")
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("status=novo")
    );
  });

  it("should handle fetch error", async () => {
    const mockFetch = global.fetch as unknown as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Not found" }),
    });

    const { result } = renderHook(() => useLeads());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Not found");
    expect(result.current.leads).toHaveLength(0);
  });

  it("should handle network error", async () => {
    const mockFetch = global.fetch as unknown as ReturnType<typeof vi.fn>;
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useLeads());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Falha de conexão com o servidor");
  });

  it("should provide refetch function", async () => {
    const mockFetch = global.fetch as unknown as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [mockLead1],
    });

    const { result } = renderHook(() => useLeads());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe("function");

    // Call refetch
    result.current.refetch();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
