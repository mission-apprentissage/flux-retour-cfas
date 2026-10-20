import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { captureTiered } from "./alertContract";
import { reportDependencyHealth } from "./reportOnce";

vi.mock("./alertContract", () => ({ captureTiered: vi.fn() }));

const MINUTE = 60_000;

describe("reportDependencyHealth", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("ne capture qu'une fois une panne intermittente", () => {
    reportDependencyHealth("intermittente", false);
    reportDependencyHealth("intermittente", true);
    reportDependencyHealth("intermittente", false);
    vi.advanceTimersByTime(10 * MINUTE);
    reportDependencyHealth("intermittente", true);
    reportDependencyHealth("intermittente", false);

    expect(captureTiered).toHaveBeenCalledOnce();
  });

  it("capture à nouveau après une période de calme", () => {
    reportDependencyHealth("calme", false);
    vi.advanceTimersByTime(15 * MINUTE);
    reportDependencyHealth("calme", true);
    reportDependencyHealth("calme", false);

    expect(captureTiered).toHaveBeenCalledTimes(2);
  });

  it("reste un seul incident tant que les échecs se poursuivent", () => {
    reportDependencyHealth("continue", false);
    vi.advanceTimersByTime(10 * MINUTE);
    reportDependencyHealth("continue", false);
    vi.advanceTimersByTime(10 * MINUTE);
    reportDependencyHealth("continue", true);
    reportDependencyHealth("continue", false);

    expect(captureTiered).toHaveBeenCalledOnce();
  });

  it("signale un second incident d'une sonde lente qui a vu le retour à la normale", () => {
    reportDependencyHealth("sonde-lente", false);
    vi.advanceTimersByTime(14 * MINUTE);
    reportDependencyHealth("sonde-lente", true);
    vi.advanceTimersByTime(15 * MINUTE);
    reportDependencyHealth("sonde-lente", false);

    expect(captureTiered).toHaveBeenCalledTimes(2);
  });

  it("ne rouvre pas d'incident sans succès intermédiaire", () => {
    reportDependencyHealth("toujours-ko", false);
    vi.advanceTimersByTime(30 * MINUTE);
    reportDependencyHealth("toujours-ko", false);

    expect(captureTiered).toHaveBeenCalledOnce();
  });

  it("suit chaque dépendance indépendamment", () => {
    reportDependencyHealth("a", false);
    reportDependencyHealth("b", false);

    expect(captureTiered).toHaveBeenCalledTimes(2);
  });
});
