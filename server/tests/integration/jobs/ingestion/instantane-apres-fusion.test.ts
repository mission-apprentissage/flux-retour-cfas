import { ObjectId } from "bson";
import { Collection } from "mongodb";
import { SOURCE_APPRENANT } from "shared/constants";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  effectifsDb,
  effectifsQueueDb,
  missionLocaleEffectifsDb,
  organisationsDb,
  organismesDb,
} from "@/common/model/collections";
import { processEffectifsQueue } from "@/jobs/ingestion/process-ingestion";
import { mockApiApprentissageCertificationApi } from "@tests/data/api.apprentissage.beta.gouv.fr/certification/apiApprentissage.certification.mock";
import {
  createRandomDossierApprenantApiInputV3,
  createRandomOrganisme,
  createRandomRupturantDossierApprenantApiInputV3,
} from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { useNock } from "@tests/jest/setupNock";

const UAI = "0802004U";
const SIRET = "77937827200016";

describe("Instantané Mission Locale après une mise à jour par fichier", () => {
  useNock();
  useMongo();
  mockApiApprentissageCertificationApi();

  const organismeId = new ObjectId();

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-04-09T10:00:00Z"));
    await organismesDb().insertOne({ _id: organismeId, ...createRandomOrganisme({ uai: UAI, siret: SIRET }) });
    await organisationsDb().insertOne({
      _id: new ObjectId(),
      type: "MISSION_LOCALE",
      nom: "MA MISSION LOCALE",
      created_at: new Date(),
      ml_id: 609,
      email: "",
      telephone: "",
      site_web: "",
    });

    return () => {
      vi.useRealTimers();
    };
  });

  const identite = {
    annee_scolaire: "2024-2025",
    etablissement_formateur_uai: UAI,
    etablissement_formateur_siret: SIRET,
    etablissement_responsable_uai: UAI,
    etablissement_responsable_siret: SIRET,
    code_postal_apprenant: "75001",
    nom_apprenant: "DUPONT",
    prenom_apprenant: "Jeanne",
    date_de_naissance_apprenant: new Date("2006-03-15T00:00:00Z"),
    id_erp_apprenant: "identite-stable",
  };

  it("crée le dossier Mission Locale dès l'import qui fait passer le jeune en rupture", async () => {
    const sourceFichier = { source: SOURCE_APPRENANT.FICHIER, source_organisme_id: organismeId.toString() };

    await effectifsQueueDb().insertOne({
      _id: new ObjectId(),
      created_at: new Date(),
      ...createRandomDossierApprenantApiInputV3(identite),
      ...sourceFichier,
    });
    await processEffectifsQueue();
    expect(await missionLocaleEffectifsDb().countDocuments({})).toBe(0);

    const { insertedId } = await effectifsQueueDb().insertOne({
      _id: new ObjectId(),
      created_at: new Date(),
      ...createRandomRupturantDossierApprenantApiInputV3(identite),
      ...sourceFichier,
    });
    await processEffectifsQueue();

    const ligne = await effectifsQueueDb().findOne({ _id: insertedId });
    const dossier = await missionLocaleEffectifsDb().findOne({ effectif_id: ligne?.effectif_id ?? undefined });
    expect(dossier?.current_status?.value).toBe("RUPTURANT");
  });

  it("crée le dossier Mission Locale dès la transmission ERP qui fait passer le jeune en rupture", async () => {
    const sourceErp = { source: SOURCE_APPRENANT.ERP, source_organisme_id: organismeId.toString() };

    await effectifsQueueDb().insertOne({
      _id: new ObjectId(),
      created_at: new Date(),
      ...createRandomDossierApprenantApiInputV3(identite),
      ...sourceErp,
    });
    await processEffectifsQueue();
    expect(await missionLocaleEffectifsDb().countDocuments({})).toBe(0);

    const { insertedId } = await effectifsQueueDb().insertOne({
      _id: new ObjectId(),
      created_at: new Date(),
      ...createRandomRupturantDossierApprenantApiInputV3(identite),
      ...sourceErp,
    });
    await processEffectifsQueue();

    const ligne = await effectifsQueueDb().findOne({ _id: insertedId });
    expect(ligne?.has_error).toBe(false);
    const dossiers = await missionLocaleEffectifsDb()
      .find({ effectif_id: ligne?.effectif_id ?? undefined })
      .toArray();
    expect(dossiers).toHaveLength(1);
    expect(dossiers[0].current_status?.value).toBe("RUPTURANT");
  });

  it.each([SOURCE_APPRENANT.FICHIER, SOURCE_APPRENANT.ERP])(
    "met l'item en erreur sans créer de dossier quand l'effectif disparaît pendant l'ingestion (%s)",
    async (source) => {
      const sourceTransmission = { source, source_organisme_id: organismeId.toString() };

      await effectifsQueueDb().insertOne({
        _id: new ObjectId(),
        created_at: new Date(),
        ...createRandomDossierApprenantApiInputV3(identite),
        ...sourceTransmission,
      });
      await processEffectifsQueue();

      const realFindOneAndUpdate = Collection.prototype.findOneAndUpdate;
      vi.spyOn(Collection.prototype, "findOneAndUpdate").mockImplementation(async function (
        this: Collection,
        ...args: Parameters<Collection["findOneAndUpdate"]>
      ) {
        if (this.collectionName === "effectifs") {
          await effectifsDb().deleteOne(args[0]);
        }
        return realFindOneAndUpdate.apply(this, args as never);
      } as never);

      const { insertedId } = await effectifsQueueDb().insertOne({
        _id: new ObjectId(),
        created_at: new Date(),
        ...createRandomRupturantDossierApprenantApiInputV3(identite),
        ...sourceTransmission,
      });
      await processEffectifsQueue();
      vi.restoreAllMocks();

      const ligne = await effectifsQueueDb().findOne({ _id: insertedId });
      expect(ligne).toMatchObject({ has_error: true, processed_at: expect.any(Date) });
      expect(ligne?.error).toContain("supprimé pendant son ingestion");
      expect(await missionLocaleEffectifsDb().countDocuments({})).toBe(0);
      const organisme = await organismesDb().findOne({ _id: organismeId });
      expect(organisme?.has_transmission_errors === true).toBe(source === SOURCE_APPRENANT.FICHIER);
    }
  );
});
