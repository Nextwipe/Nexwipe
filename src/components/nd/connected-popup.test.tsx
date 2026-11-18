import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

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

let laptops: { data?: unknown[]; error?: unknown } = {};
const accept = vi.fn();
vi.mock("@/lib/queries", () => ({
  useConnectedNow: () => ({ data: rows }),
  useLaptops: () => laptops,
}));
vi.mock("@/lib/laptop-board", () => ({ acceptLaptop: (id: string) => accept(id) }));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock("@/lib/org-context", () => ({ useOrg: () => ({ role: "technician" }) }));
vi.mock("@tanstack/react-router", () => ({
  useParams: () => params,
  useNavigate: () => vi.fn(),
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
    laptops = {};
    accept.mockReset();
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

  it("goes away when the stick stops checking in, even if the data does not change", () => {
    vi.useFakeTimers();
    rows = [row("A", "1", "NW-A", "ENVY")];
    render(<ConnectedPopup />);
    expect(screen.getByText("Laptop connected")).toBeTruthy();
    act(() => vi.advanceTimersByTime(120_000));
    expect(screen.queryByText("Laptop connected")).toBeNull();
    vi.useRealTimers();
  });

  it("does not pop up the laptop whose page is open", () => {
    rows = [row("A", "1", "NW-A", "ENVY")];
    params = { discoveryId: "A" };
    render(<ConnectedPopup />);
    expect(screen.queryByText("Laptop connected")).toBeNull();
  });

  describe("with laptop stages (database update 0027)", () => {
    const stage = (code: string, stage_key: string) => ({
      id: `lap-${code}`,
      device_code: code,
      stage_key,
    });

    it("only pending laptops pop up; accepted ones stay quiet", () => {
      rows = [row("A", "1", "NW-A", "ENVY")];
      laptops = { data: [stage("NW-A", "testing")] };
      render(<ConnectedPopup />);
      expect(screen.queryByText(/Laptop connected/)).toBeNull();
    });

    it("a pending laptop asks to be accepted", () => {
      rows = [row("A", "1", "NW-A", "ENVY")];
      laptops = { data: [stage("NW-A", "pending")] };
      accept.mockResolvedValue(undefined);
      render(<ConnectedPopup />);
      fireEvent.click(screen.getByRole("button", { name: "Accept" }));
      expect(accept).toHaveBeenCalledWith("lap-NW-A");
    });

    it("after Later, a small 'waiting' button stays and brings the card back", () => {
      rows = [row("A", "1", "NW-A", "ENVY")];
      laptops = { data: [stage("NW-A", "pending")] };
      render(<ConnectedPopup />);
      fireEvent.click(screen.getByLabelText("Later"));
      fireEvent.click(screen.getByRole("button", { name: "1 laptop waiting" }));
      expect(screen.getByText("Laptop connected")).toBeTruthy();
    });

    it("before the database update, behaves as before (every connected laptop)", () => {
      rows = [row("A", "1", "NW-A", "ENVY")];
      laptops = { error: { code: "PGRST205" } };
      render(<ConnectedPopup />);
      expect(screen.getByText("Open laptop")).toBeTruthy();
    });
  });
});
