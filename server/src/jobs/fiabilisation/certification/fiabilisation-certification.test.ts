import type { ICertification } from "api-alternance-sdk";
import { describe, it, expect, vi } from "vitest";

import { apiAlternanceClient } from "@/common/apis/apiAlternance/client";

import { getEffectiveEffectifCertification, getEffectifCertification } from "./fiabilisation-certification";

vi.mock("@/common/apis/apiAlternance/client", () => {
  return {
    apiAlternanceClient: {
      certification: {
        index: vi.fn(),
      },
    },
  };
});

describe("getEffectiveEffectifCertification", () => {
  const certifications = [
    { periode_validite: { debut: null, fin: new Date("2020-01-01"), rncp: null, cfd: null } },
    { periode_validite: { debut: new Date("2020-01-01"), fin: new Date("2021-01-01"), rncp: null, cfd: null } },
    { periode_validite: { debut: new Date("2021-01-01"), fin: new Date("2021-08-01"), rncp: null, cfd: null } },
    { periode_validite: { debut: new Date("2021-08-01"), fin: new Date("2022-01-01"), rncp: null, cfd: null } },
    { periode_validite: { debut: new Date("2022-01-01"), fin: null, rncp: null, cfd: null } },
  ];

  describe("when date_entree is defined", () => {
    it.each([
      [new Date("2021-09-01"), certifications[3]],
      [new Date("2019-09-01"), certifications[0]],
      [new Date("2022-09-01"), certifications[4]],
    ])("should return certification valid when effectif started %s", (dateEntree, expected) => {
      expect(getEffectiveEffectifCertification({ formation: { date_entree: dateEntree } }, certifications)).toBe(
        expected
      );
    });
  });

  describe("when periode is defined", () => {
    it.each([
      [2021, 2023, certifications[3]],
      [2019, 2021, certifications[0]],
      [2022, 2024, certifications[4]],
      [2020, 2021, certifications[1]],
    ])("should return certification valid when effectif period was %s-%s", (p1, p2, expected) => {
      expect(getEffectiveEffectifCertification({ formation: { periode: [p1, p2] } }, certifications)).toBe(expected);
    });
  });

  it("should prefer date_entree over periode", () => {
    expect(
      getEffectiveEffectifCertification(
        { formation: { date_entree: new Date("2021-09-01"), periode: [2024, 2025] } },
        certifications
      )
    ).toBe(certifications[3]);
  });

  it("should return null when no certification is valid", () => {
    expect(
      getEffectiveEffectifCertification({ formation: { date_entree: new Date("2024-09-01") } }, [certifications[1]])
    ).toBe(null);
  });

  it("should return null when no formation is defined", () => {
    expect(getEffectiveEffectifCertification({ formation: null }, certifications)).toBe(null);
  });
});

describe("getEffectifCertification", () => {
  it("should return null when no formation is defined", async () => {
    expect(await getEffectifCertification({ formation: null })).toBe(null);
    expect(apiAlternanceClient.certification.index).not.toHaveBeenCalled();
  });

  it("should return null when no cfd and rncp are defined", async () => {
    expect(await getEffectifCertification({ formation: { cfd: null, rncp: null } })).toBe(null);
    expect(apiAlternanceClient.certification.index).not.toHaveBeenCalled();
  });

  it("should return null when no certification is found", async () => {
    vi.mocked(apiAlternanceClient.certification.index).mockResolvedValue([]);

    expect(
      await getEffectifCertification({
        formation: { cfd: "32321014", rncp: "RNCP24440", date_entree: new Date("2021-09-01") },
      })
    ).toBe(null);
    expect(apiAlternanceClient.certification.index).toHaveBeenCalledTimes(3);
    expect(apiAlternanceClient.certification.index).toHaveBeenNthCalledWith(1, { identifiant: { cfd: "32321014" } });
    expect(apiAlternanceClient.certification.index).toHaveBeenNthCalledWith(2, { identifiant: { rncp: "RNCP24440" } });
    expect(apiAlternanceClient.certification.index).toHaveBeenNthCalledWith(3, {
      identifiant: { cfd: "32321014", rncp: "RNCP24440" },
    });
  });

  const certificationsByRncp = [
    {
      identifiant: {
        cfd: null,
        rncp: "RNCP24440",
        rncp_anterieur_2019: true,
      },
      periode_validite: {
        debut: null,
        fin: new Date("2014-08-31T23:59:59.000+02:00"),
        cfd: null,
        rncp: {
          actif: false,
          activation: null,
          debut_parcours: null,
          fin_enregistrement: new Date("2024-01-01T23:59:59.000+01:00"),
        },
      },
      continuite: {
        cfd: null,
        rncp: [
          {
            activation: new Date("2024-02-22T00:00:00.000+01:00"),
            fin_enregistrement: new Date("2025-12-31T23:59:59.000+01:00"),
            code: "RNCP38650",
            courant: false,
            actif: true,
          },
          {
            activation: new Date("2024-02-22T00:00:00.000+01:00"),
            fin_enregistrement: new Date("2025-12-31T23:59:59.000+01:00"),
            code: "RNCP38651",
            courant: false,
            actif: true,
          },
          {
            activation: new Date("2024-11-29T00:00:00.000+01:00"),
            fin_enregistrement: new Date("2030-09-01T23:59:59.000+02:00"),
            code: "RNCP39836",
            courant: false,
            actif: true,
          },
          {
            activation: null,
            fin_enregistrement: new Date("2024-01-01T23:59:59.000+01:00"),
            code: "RNCP24440",
            courant: true,
            actif: false,
          },
          {
            activation: null,
            fin_enregistrement: null,
            code: "RNCP344",
            courant: false,
            actif: false,
          },
          {
            activation: null,
            fin_enregistrement: new Date("2024-01-01T23:59:59.000+01:00"),
            code: "RNCP24442",
            courant: false,
            actif: false,
          },
          {
            activation: null,
            fin_enregistrement: null,
            code: "RNCP347",
            courant: false,
            actif: false,
          },
        ],
      },
    },
    {
      identifiant: {
        cfd: "32321014",
        rncp: "RNCP24440",
        rncp_anterieur_2019: true,
      },
      periode_validite: {
        debut: new Date("2014-09-01T00:00:00.000+02:00"),
        fin: new Date("2024-01-01T23:59:59.000+01:00"),
        cfd: {
          ouverture: new Date("2014-09-01T00:00:00.000+02:00"),
          fermeture: null,
          premiere_session: 2016,
          derniere_session: null,
        },
        rncp: {
          actif: false,
          activation: null,
          debut_parcours: null,
          fin_enregistrement: new Date("2024-01-01T23:59:59.000+01:00"),
        },
      },
      continuite: {
        cfd: [
          {
            ouverture: "2014-09-01T00:00:00.000+02:00",
            fermeture: null,
            code: "32321014",
            courant: true,
          },
          {
            ouverture: "2025-09-01T00:00:00.000+02:00",
            fermeture: null,
            code: "32321015",
            courant: false,
          },
        ],
        rncp: [
          {
            activation: "2024-02-22T00:00:00.000+01:00",
            fin_enregistrement: "2025-12-31T23:59:59.000+01:00",
            code: "RNCP38650",
            courant: false,
            actif: true,
          },
          {
            activation: "2024-02-22T00:00:00.000+01:00",
            fin_enregistrement: "2025-12-31T23:59:59.000+01:00",
            code: "RNCP38651",
            courant: false,
            actif: true,
          },
          {
            activation: "2024-11-29T00:00:00.000+01:00",
            fin_enregistrement: "2030-09-01T23:59:59.000+02:00",
            code: "RNCP39836",
            courant: false,
            actif: true,
          },
          {
            activation: null,
            fin_enregistrement: "2024-01-01T23:59:59.000+01:00",
            code: "RNCP24440",
            courant: true,
            actif: false,
          },
          {
            activation: null,
            fin_enregistrement: null,
            code: "RNCP344",
            courant: false,
            actif: false,
          },
          {
            activation: null,
            fin_enregistrement: "2024-01-01T23:59:59.000+01:00",
            code: "RNCP24442",
            courant: false,
            actif: false,
          },
          {
            activation: null,
            fin_enregistrement: null,
            code: "RNCP347",
            courant: false,
            actif: false,
          },
        ],
      },
    },
  ] as ICertification[];

  const certificationsByCfd = [
    {
      identifiant: {
        cfd: "32321014",
        rncp: null,
        rncp_anterieur_2019: null,
      },
      periode_validite: {
        debut: new Date("2024-01-02T00:00:00.000+01:00"),
        fin: new Date("2024-02-21T23:59:59.000+01:00"),
        cfd: {
          ouverture: new Date("2014-09-01T00:00:00.000+02:00"),
          fermeture: null,
          premiere_session: 2016,
          derniere_session: null,
        },
        rncp: null,
      },
      continuite: {
        cfd: [
          {
            ouverture: new Date("2014-09-01T00:00:00.000+02:00"),
            fermeture: null,
            code: "32321014",
            courant: true,
          },
          {
            ouverture: new Date("2025-09-01T00:00:00.000+02:00"),
            fermeture: null,
            code: "32321015",
            courant: false,
          },
        ],
        rncp: null,
      },
    },
    {
      identifiant: {
        cfd: "32321014",
        rncp: null,
        rncp_anterieur_2019: null,
      },
      periode_validite: {
        debut: new Date("2026-01-01T00:00:00.000+01:00"),
        fin: null,
        cfd: {
          ouverture: new Date("2014-09-01T00:00:00.000+02:00"),
          fermeture: null,
          premiere_session: 2016,
          derniere_session: null,
        },
        rncp: null,
      },
      continuite: {
        cfd: [
          {
            ouverture: new Date("2014-09-01T00:00:00.000+02:00"),
            fermeture: null,
            code: "32321014",
            courant: true,
          },
          {
            ouverture: new Date("2025-09-01T00:00:00.000+02:00"),
            fermeture: null,
            code: "32321015",
            courant: false,
          },
        ],
        rncp: null,
      },
    },
    {
      identifiant: {
        cfd: "32321014",
        rncp: "RNCP24440",
        rncp_anterieur_2019: true,
      },
      periode_validite: {
        debut: new Date("2014-09-01T00:00:00.000+02:00"),
        fin: new Date("2024-01-01T23:59:59.000+01:00"),
        cfd: {
          ouverture: new Date("2014-09-01T00:00:00.000+02:00"),
          fermeture: null,
          premiere_session: 2016,
          derniere_session: null,
        },
        rncp: {
          actif: false,
          activation: null,
          debut_parcours: null,
          fin_enregistrement: new Date("2024-01-01T23:59:59.000+01:00"),
        },
      },
      continuite: {
        cfd: [
          {
            ouverture: new Date("2014-09-01T00:00:00.000+02:00"),
            fermeture: null,
            code: "32321014",
            courant: true,
          },
          {
            ouverture: new Date("2025-09-01T00:00:00.000+02:00"),
            fermeture: null,
            code: "32321015",
            courant: false,
          },
        ],
        rncp: [
          {
            activation: new Date("2024-02-22T00:00:00.000+01:00"),
            fin_enregistrement: new Date("2025-12-31T23:59:59.000+01:00"),
            code: "RNCP38650",
            courant: false,
            actif: true,
          },
          {
            activation: new Date("2024-02-22T00:00:00.000+01:00"),
            fin_enregistrement: new Date("2025-12-31T23:59:59.000+01:00"),
            code: "RNCP38651",
            courant: false,
            actif: true,
          },
          {
            activation: new Date("2024-11-29T00:00:00.000+01:00"),
            fin_enregistrement: new Date("2030-09-01T23:59:59.000+02:00"),
            code: "RNCP39836",
            courant: false,
            actif: true,
          },
          {
            activation: null,
            fin_enregistrement: new Date("2024-01-01T23:59:59.000+01:00"),
            code: "RNCP24440",
            courant: true,
            actif: false,
          },
          {
            activation: null,
            fin_enregistrement: null,
            code: "RNCP344",
            courant: false,
            actif: false,
          },
          {
            activation: null,
            fin_enregistrement: new Date("2024-01-01T23:59:59.000+01:00"),
            code: "RNCP24442",
            courant: false,
            actif: false,
          },
          {
            activation: null,
            fin_enregistrement: null,
            code: "RNCP347",
            courant: false,
            actif: false,
          },
        ],
      },
    },
    {
      identifiant: {
        cfd: "32321014",
        rncp: "RNCP38650",
        rncp_anterieur_2019: false,
      },
      periode_validite: {
        debut: new Date("2024-02-22T00:00:00.000+01:00"),
        fin: new Date("2025-12-31T23:59:59.000+01:00"),
        cfd: {
          ouverture: new Date("2014-09-01T00:00:00.000+02:00"),
          fermeture: null,
          premiere_session: 2016,
          derniere_session: null,
        },
        rncp: {
          actif: true,
          activation: new Date("2024-02-22T00:00:00.000+01:00"),
          debut_parcours: new Date("2024-01-01T00:00:00.000+01:00"),
          fin_enregistrement: new Date("2025-12-31T23:59:59.000+01:00"),
        },
      },
      continuite: {
        cfd: [
          {
            ouverture: new Date("2014-09-01T00:00:00.000+02:00"),
            fermeture: null,
            code: "32321014",
            courant: true,
          },
          {
            ouverture: new Date("2025-09-01T00:00:00.000+02:00"),
            fermeture: null,
            code: "32321015",
            courant: false,
          },
        ],
        rncp: [
          {
            activation: new Date("2024-02-22T00:00:00.000+01:00"),
            fin_enregistrement: new Date("2025-12-31T23:59:59.000+01:00"),
            code: "RNCP38650",
            courant: true,
            actif: true,
          },
          {
            activation: new Date("2024-02-22T00:00:00.000+01:00"),
            fin_enregistrement: new Date("2025-12-31T23:59:59.000+01:00"),
            code: "RNCP38651",
            courant: false,
            actif: true,
          },
          {
            activation: new Date("2024-11-29T00:00:00.000+01:00"),
            fin_enregistrement: new Date("2030-09-01T23:59:59.000+02:00"),
            code: "RNCP39836",
            courant: false,
            actif: true,
          },
          {
            activation: null,
            fin_enregistrement: new Date("2024-01-01T23:59:59.000+01:00"),
            code: "RNCP24440",
            courant: false,
            actif: false,
          },
          {
            activation: null,
            fin_enregistrement: null,
            code: "RNCP344",
            courant: false,
            actif: false,
          },
          {
            activation: null,
            fin_enregistrement: new Date("2024-01-01T23:59:59.000+01:00"),
            code: "RNCP24442",
            courant: false,
            actif: false,
          },
          {
            activation: null,
            fin_enregistrement: null,
            code: "RNCP347",
            courant: false,
            actif: false,
          },
        ],
      },
    },
  ] as ICertification[];

  it("should return certification with rncp when cfd is not defined", async () => {
    vi.mocked(apiAlternanceClient.certification.index).mockResolvedValue(certificationsByRncp);

    expect(
      await getEffectifCertification({
        formation: { cfd: null, rncp: "RNCP24440", date_entree: new Date("2021-09-01") },
      })
    ).toBe(certificationsByRncp[1]);
    expect(apiAlternanceClient.certification.index).toHaveBeenCalledTimes(2);
    expect(apiAlternanceClient.certification.index).toHaveBeenNthCalledWith(1, { identifiant: { rncp: "RNCP24440" } });
    expect(apiAlternanceClient.certification.index).toHaveBeenNthCalledWith(2, { identifiant: { rncp: "RNCP24440" } });
  });

  it("should return certification with cfd when rncp is not defined", async () => {
    vi.mocked(apiAlternanceClient.certification.index).mockResolvedValue(certificationsByCfd);

    expect(
      await getEffectifCertification({
        formation: { cfd: "32321014", rncp: null, date_entree: new Date("2021-09-01") },
      })
    ).toBe(certificationsByCfd[2]);
    expect(apiAlternanceClient.certification.index).toHaveBeenCalledTimes(2);
    expect(apiAlternanceClient.certification.index).toHaveBeenNthCalledWith(1, { identifiant: { cfd: "32321014" } });
    expect(apiAlternanceClient.certification.index).toHaveBeenNthCalledWith(2, { identifiant: { cfd: "32321014" } });
  });

  it("should return certification when cfd & rncp are defined", async () => {
    vi.mocked(apiAlternanceClient.certification.index).mockImplementation(async (filter) => {
      if (filter.identifiant?.cfd && filter?.identifiant?.rncp) {
        return [certificationsByCfd[2]];
      }

      if (filter.identifiant?.cfd) {
        return certificationsByCfd;
      }

      if (filter.identifiant?.rncp) {
        return certificationsByRncp;
      }

      return [];
    });

    expect(
      await getEffectifCertification({
        formation: { cfd: "32321014", rncp: "RNCP24440", date_entree: new Date("2021-09-01") },
      })
    ).toBe(certificationsByCfd[2]);
    expect(apiAlternanceClient.certification.index).toHaveBeenCalledTimes(3);
    expect(apiAlternanceClient.certification.index).toHaveBeenNthCalledWith(1, { identifiant: { cfd: "32321014" } });
    expect(apiAlternanceClient.certification.index).toHaveBeenNthCalledWith(2, { identifiant: { rncp: "RNCP24440" } });
    expect(apiAlternanceClient.certification.index).toHaveBeenNthCalledWith(3, {
      identifiant: { cfd: "32321014", rncp: "RNCP24440" },
    });
  });

  it("should fix RNCP code format", async () => {
    vi.mocked(apiAlternanceClient.certification.index).mockResolvedValue(certificationsByRncp);

    expect(
      await getEffectifCertification({
        formation: { cfd: null, rncp: "24440", date_entree: new Date("2021-09-01") },
      })
    ).toBe(certificationsByRncp[1]);
    expect(apiAlternanceClient.certification.index).toHaveBeenCalledTimes(2);
    expect(apiAlternanceClient.certification.index).toHaveBeenNthCalledWith(1, { identifiant: { rncp: "RNCP24440" } });
    expect(apiAlternanceClient.certification.index).toHaveBeenNthCalledWith(2, { identifiant: { rncp: "RNCP24440" } });
  });

  it("should skip RNCP code not valid", async () => {
    vi.mocked(apiAlternanceClient.certification.index).mockResolvedValue(certificationsByCfd);
    expect(
      await getEffectifCertification({
        formation: { cfd: "32321014", rncp: "AA", date_entree: new Date("2021-09-01") },
      })
    ).toBe(null);
    expect(apiAlternanceClient.certification.index).toHaveBeenCalledTimes(1);
    expect(apiAlternanceClient.certification.index).toHaveBeenNthCalledWith(1, { identifiant: { cfd: "32321014" } });
  });

  it("should skip CFD code not valid", async () => {
    vi.mocked(apiAlternanceClient.certification.index).mockImplementation(async (filter) => {
      if (filter.identifiant?.rncp) {
        return certificationsByRncp;
      }

      return [];
    });

    expect(
      await getEffectifCertification({
        formation: { cfd: "54", rncp: "RNCP24440", date_entree: new Date("2021-09-01") },
      })
    ).toBe(null);
    expect(apiAlternanceClient.certification.index).toHaveBeenCalledTimes(2);
    expect(apiAlternanceClient.certification.index).toHaveBeenNthCalledWith(1, { identifiant: { cfd: "00000054" } });
    expect(apiAlternanceClient.certification.index).toHaveBeenNthCalledWith(2, { identifiant: { rncp: "RNCP24440" } });
  });

  it('should resolve "effective" CFD', async () => {
    const certificationsByNewCfd = [
      {
        identifiant: {
          cfd: "32321015",
          rncp: null,
          rncp_anterieur_2019: null,
        },
        periode_validite: {
          debut: new Date("2026-01-01T00:00:00.000+01:00"),
          fin: null,
          cfd: {
            ouverture: new Date("2025-09-01T00:00:00.000+02:00"),
            fermeture: null,
            premiere_session: 2027,
            derniere_session: null,
          },
          rncp: null,
        },
        continuite: {
          cfd: [
            {
              ouverture: new Date("2014-09-01T00:00:00.000+02:00"),
              fermeture: null,
              code: "32321014",
              courant: false,
            },
            {
              ouverture: new Date("2025-09-01T00:00:00.000+02:00"),
              fermeture: null,
              code: "32321015",
              courant: true,
            },
          ],
          rncp: null,
        },
      },
      {
        identifiant: {
          cfd: "32321015",
          rncp: "RNCP38650",
          rncp_anterieur_2019: false,
        },
        periode_validite: {
          debut: new Date("2025-09-01T00:00:00.000+02:00"),
          fin: new Date("2025-12-31T23:59:59.000+01:00"),
          cfd: {
            ouverture: new Date("2025-09-01T00:00:00.000+02:00"),
            fermeture: null,
            premiere_session: 2027,
            derniere_session: null,
          },
          rncp: {
            actif: true,
            activation: new Date("2024-02-22T00:00:00.000+01:00"),
            debut_parcours: new Date("2024-01-01T00:00:00.000+01:00"),
            fin_enregistrement: new Date("2025-12-31T23:59:59.000+01:00"),
          },
        },
        continuite: {
          cfd: [
            {
              ouverture: new Date("2014-09-01T00:00:00.000+02:00"),
              fermeture: null,
              code: "32321014",
              courant: false,
            },
            {
              ouverture: new Date("2025-09-01T00:00:00.000+02:00"),
              fermeture: null,
              code: "32321015",
              courant: true,
            },
          ],
          rncp: [
            {
              activation: new Date("2024-02-22T00:00:00.000+01:00"),
              fin_enregistrement: new Date("2025-12-31T23:59:59.000+01:00"),
              code: "RNCP38650",
              courant: true,
              actif: true,
            },
            {
              activation: new Date("2024-02-22T00:00:00.000+01:00"),
              fin_enregistrement: new Date("2025-12-31T23:59:59.000+01:00"),
              code: "RNCP38651",
              courant: false,
              actif: true,
            },
            {
              activation: new Date("2024-11-29T00:00:00.000+01:00"),
              fin_enregistrement: new Date("2030-09-01T23:59:59.000+02:00"),
              code: "RNCP39836",
              courant: false,
              actif: true,
            },
            {
              activation: null,
              fin_enregistrement: new Date("2024-01-01T23:59:59.000+01:00"),
              code: "RNCP24440",
              courant: false,
              actif: false,
            },
            {
              activation: null,
              fin_enregistrement: null,
              code: "RNCP344",
              courant: false,
              actif: false,
            },
            {
              activation: null,
              fin_enregistrement: new Date("2024-01-01T23:59:59.000+01:00"),
              code: "RNCP24442",
              courant: false,
              actif: false,
            },
            {
              activation: null,
              fin_enregistrement: null,
              code: "RNCP347",
              courant: false,
              actif: false,
            },
          ],
        },
      },
    ] as ICertification[];

    vi.mocked(apiAlternanceClient.certification.index).mockResolvedValueOnce(certificationsByNewCfd);
    vi.mocked(apiAlternanceClient.certification.index).mockResolvedValueOnce(certificationsByCfd);

    expect(
      await getEffectifCertification({
        formation: { cfd: "32321015", rncp: null, date_entree: new Date("2021-09-01") },
      })
    ).toBe(certificationsByCfd[2]);
    expect(apiAlternanceClient.certification.index).toHaveBeenCalledTimes(2);
    expect(apiAlternanceClient.certification.index).toHaveBeenNthCalledWith(1, { identifiant: { cfd: "32321015" } });
    expect(apiAlternanceClient.certification.index).toHaveBeenNthCalledWith(2, { identifiant: { cfd: "32321014" } });
  });

  it('should resolve "effective" RNCP', async () => {
    const certificationsByOldRncp = [
      {
        identifiant: {
          cfd: "32321011",
          rncp: "RNCP38651",
          rncp_anterieur_2019: false,
        },
        periode_validite: {
          debut: new Date("2024-02-22T00:00:00.000+01:00"),
          fin: new Date("2025-12-31T23:59:59.000+01:00"),
          cfd: {
            ouverture: new Date("2001-09-01T00:00:00.000+02:00"),
            fermeture: null,
            premiere_session: 2003,
            derniere_session: null,
          },
          rncp: {
            actif: true,
            activation: new Date("2024-02-22T00:00:00.000+01:00"),
            debut_parcours: new Date("2024-01-01T00:00:00.000+01:00"),
            fin_enregistrement: new Date("2025-12-31T23:59:59.000+01:00"),
          },
        },
        continuite: {
          cfd: [
            {
              ouverture: new Date("2001-09-01T00:00:00.000+02:00"),
              fermeture: null,
              code: "32321011",
              courant: true,
            },
            {
              ouverture: new Date("2025-09-01T00:00:00.000+02:00"),
              fermeture: null,
              code: "32321016",
              courant: false,
            },
          ],
          rncp: [
            {
              activation: new Date("2024-02-22T00:00:00.000+01:00"),
              fin_enregistrement: new Date("2025-12-31T23:59:59.000+01:00"),
              code: "RNCP38650",
              courant: false,
              actif: true,
            },
            {
              activation: new Date("2024-02-22T00:00:00.000+01:00"),
              fin_enregistrement: new Date("2025-12-31T23:59:59.000+01:00"),
              code: "RNCP38651",
              courant: true,
              actif: true,
            },
            {
              activation: new Date("2024-11-29T00:00:00.000+01:00"),
              fin_enregistrement: new Date("2030-09-01T23:59:59.000+02:00"),
              code: "RNCP39836",
              courant: false,
              actif: true,
            },
            {
              activation: null,
              fin_enregistrement: new Date("2024-01-01T23:59:59.000+01:00"),
              code: "RNCP24440",
              courant: false,
              actif: false,
            },
          ],
        },
      },
    ] as ICertification[];

    vi.mocked(apiAlternanceClient.certification.index).mockResolvedValueOnce(certificationsByOldRncp);
    vi.mocked(apiAlternanceClient.certification.index).mockResolvedValueOnce(certificationsByRncp);

    expect(
      await getEffectifCertification({
        formation: { cfd: null, rncp: "RNCP38651", date_entree: new Date("2021-09-01") },
      })
    ).toBe(certificationsByRncp[1]);
    expect(apiAlternanceClient.certification.index).toHaveBeenCalledTimes(2);
    expect(apiAlternanceClient.certification.index).toHaveBeenNthCalledWith(1, { identifiant: { rncp: "RNCP38651" } });
    expect(apiAlternanceClient.certification.index).toHaveBeenNthCalledWith(2, { identifiant: { rncp: "RNCP24440" } });
  });
});
