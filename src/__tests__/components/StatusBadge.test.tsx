import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/leads/StatusBadge";

describe("StatusBadge", () => {
  it("should render novo status", () => {
    render(<StatusBadge status="novo" />);
    expect(screen.getByText("Novo")).toBeInTheDocument();
  });

  it("should render contatado status", () => {
    render(<StatusBadge status="contatado" />);
    expect(screen.getByText("Contatado")).toBeInTheDocument();
  });

  it("should render respondeu status", () => {
    render(<StatusBadge status="respondeu" />);
    expect(screen.getByText("Respondeu")).toBeInTheDocument();
  });

  it("should render fechado status", () => {
    render(<StatusBadge status="fechado" />);
    expect(screen.getByText("Fechado")).toBeInTheDocument();
  });

  it("should render descartado status", () => {
    render(<StatusBadge status="descartado" />);
    expect(screen.getByText("Descartado")).toBeInTheDocument();
  });
});
