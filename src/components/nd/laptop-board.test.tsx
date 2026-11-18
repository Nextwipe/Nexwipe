import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const STAGES = [
  {
    key: "pending",
    label: "Pending",
    position: 10,
    tone: "warning",
    planned: null,
    is_initial: true,
    is_terminal: false,
  },
  {
    key: "testing",
    label: "Testing",
    position: 20,
    tone: "info",
    planned: null,
    is_initial: false,
    is_terminal: false,
  },
  {
    key: "tested",
    label: "Tested",
    position: 30,
    tone: "success",
    planned: null,
    is_initial: false,
    is_terminal: false,
  },
  {
    key: "ready_for_sale",
    label: "Ready for sale",
    position: 40,
    tone: "success",
    planned: "v2",
    is_initial: false,
    is_terminal: true,
  },
];
const lap = (id: string, stage_key: string, o: Record<string, unknown> = {}) => ({
  id,
  device_code: `NW-${id}`,
  title: `HP ${id}`,
  latest_discovery_id: `d-${id}`,
  stage_key,
  is_simulated: false,
  claimed_by: null as string | null,
  claimed_at: null,
  stage_changed_at: new Date().toISOString(),
  first_seen_at: new Date().toISOString(),
  ...o,
});
let laptops: { data?: unknown[]; error?: unknown; isLoading?: boolean } = {};
let discoveries: unknown[] = [];
const accept = vi.fn();

vi.mock("@/lib/queries", () => ({
  useLaptopStages: () => ({ data: STAGES }),
  useLaptops: () => laptops,
  useConnectedDevices: () => ({ data: discoveries }),
  useMembers: () => ({
    data: [
      { user_id: "u-priya", profiles: { full_name: "Priya", email: "p@x" } },
      { user_id: "u-me", profiles: { full_name: "Me", email: "m@x" } },
    ],
  }),
  memberName: (m: { profiles: { full_name: string } } | undefined) =>
    m?.profiles.full_name ?? "Unknown user",
}));
vi.mock("@/lib/laptop-board", async (orig) => ({
  ...(await orig<typeof import("@/lib/laptop-board")>()),
  acceptLaptop: (id: string) => accept(id),
}));
vi.mock("@/lib/session", () => ({ useSessionUser: () => ({ data: { id: "u-me" } }) }));
vi.mock("@/lib/org-context", () => ({ useOrg: () => ({ orgId: "org-1", role: "technician" }) }));
vi.mock("@/lib/virtual-laptop.functions", () => ({ runVirtualLaptop: vi.fn() }));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children }: { children: React.ReactNode }) => <a href="#">{children}</a>,
}));
vi.mock("@/components/nd/prepare-usb-stick", () => ({ PrepareUsbStick: () => null }));

import { LaptopBoard } from "./laptop-board";

describe("LaptopBoard", () => {
  afterEach(() => {
    cleanup();
    accept.mockReset();
    discoveries = [];
  });

  it("builds its tabs from the stage list, with counts; planned stages are shown but disabled", () => {
    laptops = { data: [lap("A", "pending"), lap("B", "pending"), lap("C", "tested")] };
    render(<LaptopBoard />);
    expect(screen.getByRole("tab", { name: /Pending\s*2/ })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Tested\s*1/ })).toBeTruthy();
    const planned = screen.getByRole("tab", { name: /Ready for sale.*Planned v2/ });
    expect(planned.hasAttribute("disabled")).toBe(true);
  });

  it("a pending laptop has a big Accept button that claims it", async () => {
    laptops = { data: [lap("A", "pending")] };
    accept.mockResolvedValue(undefined);
    render(<LaptopBoard />);
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    await waitFor(() => expect(accept).toHaveBeenCalledWith("A"));
  });

  it("losing the race shows who accepted it", async () => {
    laptops = { data: [lap("A", "pending")] };
    accept.mockRejectedValue(new Error("Already accepted by Priya"));
    render(<LaptopBoard />);
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    expect(await screen.findByText("Already accepted by Priya")).toBeTruthy();
  });

  it("shows who accepted a laptop, and Mine filters to my laptops", () => {
    laptops = {
      data: [
        lap("A", "testing", { claimed_by: "u-priya" }),
        lap("B", "testing", { claimed_by: "u-me" }),
      ],
    };
    render(<LaptopBoard />);
    fireEvent.click(screen.getByRole("tab", { name: /Testing/ }));
    expect(screen.getByText(/Accepted by Priya/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Only mine/ }));
    expect(screen.queryByText(/Accepted by Priya/)).toBeNull();
    expect(screen.getByText(/Accepted by Me/)).toBeTruthy();
  });

  it("labels simulated laptops and laptops already recorded in inventory", () => {
    laptops = { data: [lap("A", "pending", { is_simulated: true }), lap("B", "pending")] };
    discoveries = [{ device_code: "NW-B", device_id: "dev-1", devices: { asset_tag: "TAG-B" } }];
    render(<LaptopBoard />);
    expect(screen.getByText("Simulated")).toBeTruthy();
    expect(screen.getByText(/Recorded · TAG-B/)).toBeTruthy();
  });

  it("an empty board shows the three steps and the virtual laptop", () => {
    laptops = { data: [] };
    render(<LaptopBoard />);
    expect(screen.getByText(/Prepare a USB stick/)).toBeTruthy();
    expect(screen.getByText(/double-click Start NexWipe/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Try a virtual laptop/ })).toBeTruthy();
  });

  it("before the database update, says so instead of breaking", () => {
    laptops = { error: { code: "PGRST205", message: "Could not find the table 'public.laptops'" } };
    render(<LaptopBoard />);
    expect(screen.getByText("Waiting for a database update")).toBeTruthy();
  });
});
