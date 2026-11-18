import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const fresh = () => new Date(Date.now() - 5_000).toISOString();
const row = (id: string, agent: string, code: string, model: string, ageMs = 0) => ({
  id,
  agent_id: agent,
  device_code: code,
  reported_at: fresh(),
  last_reported_at: new Date(Date.now() - ageMs).toISOString(),
  is_simulated: false,
  sys: { manufacturer: "HP", model },
  agents: { name: `Stick ${agent}`, status: "active", last_heartbeat_at: fresh() },
});
let rows: ReturnType<typeof row>[] = [];
let params: { discoveryId?: string } = {};

vi.mock("@/lib/queries", () => ({ useConnectedNow: () => ({ data: rows }) }));
vi.mock("@/lib/org-context", () => ({ useOrg: () => ({ role: "technician" }) }));
vi.mock("@tanstack/react-router", () => ({
  useParams: () => params,
  Link: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <a href="#" onClick={onClick}>
      {children}
    </a>
  ),
}));

import { ConnectedPopup } from "./connected-popup";

describe("ConnectedPopup", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    params = {};
  });

  it("shows nothing when no laptop is connected", () => {
    rows = [];
    const { container } = render(<ConnectedPopup />);
    expect(container.innerHTML).toBe("");
  });

  it("flips between several connected laptops, newest first", () => {
    rows = [row("A", "1", "NW-A", "ENVY", 60_000), row("B", "2", "NW-B", "Victus", 0)];
    render(<ConnectedPopup />);
    expect(screen.getByText("1 of 2")).toBeTruthy();
    expect(screen.getByText("HP Victus")).toBeTruthy();
    fireEvent.click(screen.getByText("Next"));
    expect(screen.getByText("HP ENVY")).toBeTruthy();
  });

  it("Later hides that laptop and remembers it", () => {
    rows = [row("A", "1", "NW-A", "ENVY")];
    render(<ConnectedPopup />);
    fireEvent.click(screen.getByLabelText("Later"));
    expect(screen.queryByText("Laptop connected")).toBeNull();
    cleanup();
    render(<ConnectedPopup />);
    expect(screen.queryByText("Laptop connected")).toBeNull();
  });

  it("does not pop up the laptop whose page is open", () => {
    rows = [row("A", "1", "NW-A", "ENVY")];
    params = { discoveryId: "A" };
    render(<ConnectedPopup />);
    expect(screen.queryByText("Laptop connected")).toBeNull();
  });
});
