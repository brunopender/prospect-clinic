import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LeadsTable } from "@/components/leads/LeadsTable";
import type { Lead } from "@/types/lead";

describe("LeadsTable", () => {
  const mockLead: Lead = {
    id: "1",
    name: "João Silva",
    profileUrl: "https://instagram.com/joao",
    platform: "instagram",
    bio: "Dentista especializado",
    followersCount: 1500,
    status: "novo",
    message: null,
    createdAt: "2026-04-01T10:00:00.000Z",
  };

  it("should render loading state", () => {
    render(
      <LeadsTable
        leads={[]}
        loading={true}
        onLeadClick={() => {}}
      />
    );

    expect(screen.getByText("Carregando leads...")).toBeInTheDocument();
  });

  it("should render empty state", () => {
    render(
      <LeadsTable
        leads={[]}
        loading={false}
        onLeadClick={() => {}}
      />
    );

    expect(screen.getByText("Nenhum lead encontrado")).toBeInTheDocument();
  });

  it("should render leads table with correct columns", () => {
    render(
      <LeadsTable
        leads={[mockLead]}
        loading={false}
        onLeadClick={() => {}}
      />
    );

    expect(screen.getByText("Nome")).toBeInTheDocument();
    expect(screen.getByText("Plataforma")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Data de Captura")).toBeInTheDocument();
  });

  it("should render lead data in table", () => {
    render(
      <LeadsTable
        leads={[mockLead]}
        loading={false}
        onLeadClick={() => {}}
      />
    );

    expect(screen.getByText("João Silva")).toBeInTheDocument();
    expect(screen.getByText("instagram")).toBeInTheDocument();
  });

  it("should call onLeadClick when row is clicked", () => {
    const onLeadClick = vi.fn();
    const { getByText } = render(
      <LeadsTable
        leads={[mockLead]}
        loading={false}
        onLeadClick={onLeadClick}
      />
    );

    getByText("João Silva").closest("tr")?.click();
    expect(onLeadClick).toHaveBeenCalledWith(mockLead);
  });

  it("should render multiple leads", () => {
    const lead2: Lead = {
      ...mockLead,
      id: "2",
      name: "Maria Santos",
      platform: "linkedin",
    };

    render(
      <LeadsTable
        leads={[mockLead, lead2]}
        loading={false}
        onLeadClick={() => {}}
      />
    );

    expect(screen.getByText("João Silva")).toBeInTheDocument();
    expect(screen.getByText("Maria Santos")).toBeInTheDocument();
  });
});
