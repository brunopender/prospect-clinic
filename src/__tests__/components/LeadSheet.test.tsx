import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LeadSheet } from "@/components/leads/LeadSheet";
import type { Lead } from "@/types/lead";

// Mock the useGenerateMessage hook
vi.mock("@/hooks/useGenerateMessage", () => ({
  useGenerateMessage: () => ({
    generateMessage: vi.fn(async () => "Generated message"),
    loading: false,
    error: null,
  }),
}));

describe("LeadSheet", () => {
  const mockLead: Lead = {
    id: "1",
    name: "João Silva",
    profileUrl: "https://instagram.com/joao",
    platform: "instagram",
    bio: "Dentista especializado",
    followersCount: 1500,
    status: "novo",
    message: "Olá João, tudo bem?",
    createdAt: "2026-04-01T10:00:00.000Z",
  };

  const mockOnClose = vi.fn();
  const mockOnMessageGenerated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not render when lead is null", () => {
    const { container } = render(
      <LeadSheet
        lead={null}
        onClose={mockOnClose}
        onMessageGenerated={mockOnMessageGenerated}
      />
    );

    // Should return null, so container should be empty
    expect(container.firstChild).toBeNull();
  });

  it("should render sheet when lead is provided", () => {
    render(
      <LeadSheet
        lead={mockLead}
        onClose={mockOnClose}
        onMessageGenerated={mockOnMessageGenerated}
      />
    );

    expect(screen.getByText("João Silva")).toBeInTheDocument();
  });

  it("should display lead details", () => {
    render(
      <LeadSheet
        lead={mockLead}
        onClose={mockOnClose}
        onMessageGenerated={mockOnMessageGenerated}
      />
    );

    expect(screen.getByText("Dentista especializado")).toBeInTheDocument();
    expect(screen.getByText(/1.500/)).toBeInTheDocument();
    expect(screen.getByText("instagram")).toBeInTheDocument();
  });

  it("should display message in textarea when available", () => {
    render(
      <LeadSheet
        lead={mockLead}
        onClose={mockOnClose}
        onMessageGenerated={mockOnMessageGenerated}
      />
    );

    const textarea = screen.getByDisplayValue("Olá João, tudo bem?");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute("readonly");
  });

  it("should show copy button when message exists", () => {
    render(
      <LeadSheet
        lead={mockLead}
        onClose={mockOnClose}
        onMessageGenerated={mockOnMessageGenerated}
      />
    );

    expect(screen.getByText("Copiar")).toBeInTheDocument();
  });

  it("should show generate button when no message", () => {
    const leadWithoutMessage = { ...mockLead, message: null };

    render(
      <LeadSheet
        lead={leadWithoutMessage}
        onClose={mockOnClose}
        onMessageGenerated={mockOnMessageGenerated}
      />
    );

    expect(screen.getByText("Gerar Mensagem Agora")).toBeInTheDocument();
  });

  it("should open profile link in new tab", () => {
    render(
      <LeadSheet
        lead={mockLead}
        onClose={mockOnClose}
        onMessageGenerated={mockOnMessageGenerated}
      />
    );

    const link = screen.getByText(/Ver perfil/);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("should display no message state", () => {
    const leadWithoutMessage = { ...mockLead, message: null };

    render(
      <LeadSheet
        lead={leadWithoutMessage}
        onClose={mockOnClose}
        onMessageGenerated={mockOnMessageGenerated}
      />
    );

    expect(screen.getByText("Nenhuma mensagem gerada ainda")).toBeInTheDocument();
  });
});
