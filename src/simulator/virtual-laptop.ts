/** What the SIMULATED virtual stick sends for "Try a virtual laptop". No real hardware exists. */
export function virtualLaptopReport(serial: string) {
  return {
    system: {
      manufacturer: "SIMULATED",
      model: "Virtual laptop",
      serial,
      cpu: "Simulated CPU",
      ram_bytes: 8_000_000_000,
    },
    os: { name: "Simulated Windows 11", version: "0.0" },
    drives: [],
  };
}

export const VIRTUAL_TEST_RESULT = {
  test: "full",
  outcome: "fail",
  detail: "SIMULATED: 11 pass, 1 fail (Webcam)",
  result: {
    tests: {
      keyboard: { outcome: "pass" },
      display: { outcome: "pass" },
      webcam: { outcome: "fail", note: "SIMULATED camera fault" },
      microphone: { outcome: "pass" },
      speakers: { outcome: "pass" },
      touchpad: { outcome: "pass" },
      battery: { outcome: "pass", values: { health_pct: 88 } },
      charging: { outcome: "pass" },
      wifi: { outcome: "pass" },
      ports: { outcome: "pass" },
      hinges: { outcome: "pass" },
      body: { outcome: "pass" },
    },
  },
};
