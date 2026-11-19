import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const STAGES = [
  { key: "pending", label: "Pending", position: 10, tone: "warning", planned: null },
  { key: "testing", label: "Testing", position: 20, tone: "info", planned: null },
];
let laptops: unknown[] = [];
let role = "technician";
const accept = vi.fn().mockResolvedValue(undefined);
const release = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/queries", () => ({
  useLaptopByCode: (code: string | null) => ({
    data: (laptops as { device_code: string }[]).find((l) => l.device_code === code) ?? null,
  }),
  useLaptopStages: () => ({ data: STAGES }),
  useMembers: () => ({
    data: [{ user_id: "u-priya", profiles: { full_name: "Priya", email: "p@x" } }],
  }),
  memberName: (m: { profiles: { full_name: string } } | undefined) =>
    m?.profiles.full_name ?? "Unknown user",
}));
vi.mock("@/lib/laptop-board", async (orig) => ({
  ...(await orig<typeof import("@/lib/laptop-board")>()),
  acceptLaptop: (id: string) => accept(id),
  releaseLaptop: (id: string) => release(id),
}));
vi.mock("@/lib/session", () => ({ useSessionUser: () => ({ data: { id: "u-me" } }) }));
vi.mock("@/lib/org-context", () => ({ useOrg: () => ({ orgId: "o", role }) }));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

import { LaptopClaimBar, useClaimGuard } from "./laptop-claim";

const lap = (o: Record<string, unknown>) => ({
  id: "L1",
  device_code: "NW-A",
  stage_key: "pending",
  claimed_by: null,
  claimed_at: null,
  ...o,
});

function GuardHarness({ onRun }: { onRun: () => void }) {
  const { guard, dialog } = useClaimGuard("NW-A");
  return (
    <>
      <button onClick={() => guard(onRun)}>Do it</button>
      {dialog}
    </>
  );
}

describe("LaptopClaimBar", () => {
  afterEach(() => {
    cleanup();
    role = "technician";
    sessionStorage.clear();
  });

  it("pending: shows the stage and an Accept button", () => {
    laptops = [lap({})];
    render(<LaptopClaimBar deviceCode="NW-A" />);
    expect(screen.getByText("Pending")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    expect(accept).toHaveBeenCalledWith("L1");
  });

  it("someone else's laptop: says who, no Release for a technician", () => {
    laptops = [
      lap({ stage_key: "testing", claimed_by: "u-priya", claimed_at: new Date().toISOString() }),
    ];
    render(<LaptopClaimBar deviceCode="NW-A" />);
    expect(screen.getByText(/Accepted by Priya/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Release" })).toBeNull();
  });

  it("my laptop, or an admin: Release puts it back", () => {
    laptops = [
      lap({ stage_key: "testing", claimed_by: "u-me", claimed_at: new Date().toISOString() }),
    ];
    render(<LaptopClaimBar deviceCode="NW-A" />);
    expect(screen.getByText(/Accepted by you/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Release" }));
    expect(release).toHaveBeenCalledWith("L1");
  });

  it("nothing when stages are not there yet", () => {
    laptops = [];
    const { container } = render(<LaptopClaimBar deviceCode="NW-A" />);
    expect(container.innerHTML).toBe("");
  });
});

describe("useClaimGuard", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  it("asks once before acting on someone else's laptop, then not again", () => {
    laptops = [lap({ stage_key: "testing", claimed_by: "u-priya" })];
    const run = vi.fn();
    render(<GuardHarness onRun={run} />);
    fireEvent.click(screen.getByText("Do it"));
    expect(run).not.toHaveBeenCalled();
    expect(screen.getByText(/This is Priya's laptop/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue anyway" }));
    expect(run).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText("Do it"));
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("does not ask on my own or an unclaimed laptop", () => {
    laptops = [lap({ stage_key: "testing", claimed_by: "u-me" })];
    const run = vi.fn();
    render(<GuardHarness onRun={run} />);
    fireEvent.click(screen.getByText("Do it"));
    expect(run).toHaveBeenCalledTimes(1);
  });
});
