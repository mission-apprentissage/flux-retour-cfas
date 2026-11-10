import { ObjectId } from "bson";
import { SOURCE_APPRENANT } from "shared/constants";
import type { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import type { IOrganisme } from "shared/models/data/organismes.model";
import { generateOrganismeFixture } from "shared/models/fixtures/organisme.fixture";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getEtablissementRechercheEntreprises,
  type IEtablissementRechercheEntreprises,
} from "@/common/apis/apiRechercheEntreprises";
import { effectifsDb, effectifsDECADb, organismesDb } from "@/common/model/collections";
import { rattraperAdressesOrganismes } from "@/jobs/hydrate/organismes/rattrapage-adresses-organismes";
import { createSampleEffectif } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { testDoc } from "@tests/utils/testUtils";

vi.mock("@/common/apis/apiRechercheEntreprises");

useMongo();

const SIRET_PARIS = "31709861400033";
const SIRET_INTROUVABLE = "32922456200549";

const etablissementParis: IEtablissementRechercheEntreprises = {
  siret: SIRET_PARIS,
  adresse: "38 QUAI DE JEMMAPES 75010 PARIS",
  code_postal: "75010",
  commune: "75110",
  libelle_commune: "PARIS",
  statut_diffusion_etablissement: "O",
};

const adresseParis = {
  code_postal: "75010",
  code_insee: "75110",
  commune: "PARIS",
  departement: "75",
  region: "11",
  academie: "01",
  complete: "38 QUAI DE JEMMAPES 75010 PARIS",
};

const adresseLille = {
  code_postal: "59790",
  code_insee: "59507",
  commune: "Ronchin",
  departement: "59",
  region: "32",
  academie: "09",
  complete: "9 RUE DE L'UNIVERSITE 59790 Ronchin",
};

const insertEffectif = async (organisme: IOrganisme) => {
  const _id = new ObjectId();
  await effectifsDb().insertOne({ _id, ...(await createSampleEffectif({ organisme })) });
  return _id;
};

const insertDeca = async (organisme: IOrganisme) => {
  const _id = new ObjectId();
  await effectifsDECADb().insertOne(
    testDoc<IEffectifDECA>({
      _id,
      deca_raw_id: new ObjectId(),
      ...(await createSampleEffectif({ organisme, source: SOURCE_APPRENANT.DECA })),
      is_deca_compatible: true,
    })
  );
  return _id;
};

describe("rattrapage des adresses des organismes", () => {
  beforeEach(() => {
    vi.mocked(getEtablissementRechercheEntreprises).mockReset();
    vi.mocked(getEtablissementRechercheEntreprises).mockImplementation(async (siret) =>
      siret === SIRET_PARIS ? etablissementParis : null
    );
  });

  it("complète les organismes sans département et met à jour leurs dossiers, une seule fois", async () => {
    const paris = generateOrganismeFixture({ uai: "0754571L", siret: SIRET_PARIS, adresse: null });
    const introuvable = generateOrganismeFixture({ uai: "0756243D", siret: SIRET_INTROUVABLE, adresse: null });
    const lille = generateOrganismeFixture({ uai: "0597114M", siret: "13002975400020", adresse: adresseLille });
    const sansUai = generateOrganismeFixture({ uai: undefined, siret: "19590065900028", adresse: null });
    await organismesDb().insertMany([paris, introuvable, lille, sansUai], { bypassDocumentValidation: true });
    const effectifParis = await insertEffectif(paris);
    const decaParis = await insertDeca(paris);
    const effectifLille = await insertEffectif(lille);

    const premier = await rattraperAdressesOrganismes();

    expect(premier).toEqual({ nbOrganismes: 2, nbCompletes: 1, nbSansAdresse: 1, sourceDisponible: true });
    expect((await organismesDb().findOne({ _id: paris._id }))?.adresse).toEqual(adresseParis);
    expect((await organismesDb().findOne({ _id: introuvable._id }))?.adresse).toBeNull();
    expect((await organismesDb().findOne({ _id: lille._id }))?.adresse).toEqual(adresseLille);
    expect((await organismesDb().findOne({ _id: sansUai._id }))?.adresse).toBeNull();
    for (const dossier of [
      await effectifsDb().findOne({ _id: effectifParis }),
      await effectifsDECADb().findOne({ _id: decaParis }),
    ]) {
      expect(dossier?._computed?.organisme).toMatchObject({ departement: "75", region: "11", academie: "01" });
    }
    expect((await effectifsDb().findOne({ _id: effectifLille }))?._computed?.organisme?.departement).toBe("59");
    expect(getEtablissementRechercheEntreprises).toHaveBeenCalledTimes(2);

    vi.mocked(getEtablissementRechercheEntreprises).mockClear();
    const second = await rattraperAdressesOrganismes();

    expect(second).toEqual({ nbOrganismes: 1, nbCompletes: 0, nbSansAdresse: 1, sourceDisponible: true });
    expect(getEtablissementRechercheEntreprises).toHaveBeenCalledTimes(1);
    expect(getEtablissementRechercheEntreprises).toHaveBeenCalledWith(SIRET_INTROUVABLE);
    expect((await organismesDb().findOne({ _id: paris._id }))?.adresse).toEqual(adresseParis);
  });

  it("s'arrête sans échouer quand l'API ne répond pas", async () => {
    const paris = generateOrganismeFixture({ uai: "0754571L", siret: SIRET_PARIS, adresse: null });
    const autre = generateOrganismeFixture({ uai: "0756243D", siret: SIRET_INTROUVABLE, adresse: null });
    await organismesDb().insertMany([paris, autre], { bypassDocumentValidation: true });
    vi.mocked(getEtablissementRechercheEntreprises).mockRejectedValue(new Error("Service Unavailable"));

    const resultat = await rattraperAdressesOrganismes();

    expect(resultat).toEqual({ nbOrganismes: 2, nbCompletes: 0, nbSansAdresse: 2, sourceDisponible: false });
    expect(getEtablissementRechercheEntreprises).toHaveBeenCalledTimes(1);
    expect(await organismesDb().countDocuments({ adresse: null })).toBe(2);
  });
});
