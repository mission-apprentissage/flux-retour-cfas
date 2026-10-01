import type { IOrganisationMissionLocale, IOrganisationOrganismeFormation, IOrganisme } from "shared/models";

import { buildOrgaMl, buildOrgaOf, buildOrganisme } from "@/common/actions/brevo/contacts/fixtures";
import { organisationsDb, organismesDb } from "@/common/model/collections";
import { CFA_HOST_CODES, type SeedRecetteHosts } from "@/jobs/seed-recette/hosts";

export async function insertSeedRecetteHosts(): Promise<SeedRecetteHosts> {
  const mlA = buildOrgaMl("ML A", { ml_id: 569, activated_at: new Date("2026-04-01T00:00:00.000Z") });
  const { activated_at: _nonActivee, ...mlB } = buildOrgaMl("ML B", { ml_id: 39 });
  const mlClichy = buildOrgaMl("ML CLICHY", { ml_id: 139, activated_at: new Date("2025-09-11T00:00:00.000Z") });
  await organisationsDb().insertMany([
    mlA as IOrganisationMissionLocale,
    mlB as IOrganisationMissionLocale,
    mlClichy as IOrganisationMissionLocale,
  ]);

  const cfas = {} as SeedRecetteHosts["cfas"];
  for (const code of CFA_HOST_CODES) {
    const orgaOf = buildOrgaOf();
    const organisme = buildOrganisme(orgaOf, {
      is_allowed_collab: code === "CFA_ON",
      adresse: { region: "11", departement: "94", commune: "Cachan" },
      ...(code === "CFA_REAL_CAMPUS" ? { first_transmission_date: new Date("2024-11-13T00:00:00.000Z") } : {}),
    });
    await organismesDb().insertOne(organisme as IOrganisme);
    await organisationsDb().insertOne({
      ...orgaOf,
      ...(code === "CFA_ON" ? { ml_beta_activated_at: new Date("2026-05-01T00:00:00.000Z") } : {}),
    } as IOrganisationOrganismeFormation);
    cfas[code] = { organisationId: orgaOf._id, organismeId: organisme._id };
  }

  return { missionsLocales: { ML_A: mlA._id, ML_B: mlB._id, ML_CLICHY: mlClichy._id }, cfas };
}
