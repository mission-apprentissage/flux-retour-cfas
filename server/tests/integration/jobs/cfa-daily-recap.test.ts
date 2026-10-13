import { subHours } from "date-fns";
import { ObjectId } from "mongodb";
import type { IMissionLocaleEffectif, IOrganisation, IUsersMigration } from "shared/models";
import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import type { IMissionLocaleEffectifLog } from "shared/models/data/missionLocaleEffectifLog.model";
import type { IOrganisme } from "shared/models/data/organismes.model";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  missionLocaleEffectifsDb,
  missionLocaleEffectifsLogDb,
  organisationsDb,
  organismesDb,
  usersMigrationDb,
} from "@/common/model/collections";
import { sendEmail } from "@/common/services/mailer/mailer";
import { sendCfaDailyRecap } from "@/jobs/emails/cfa-daily-recap";
import { createRandomOrganisme } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { testDoc } from "@tests/utils/testUtils";

vi.mock("@/common/services/mailer/mailer");

const SIRET = "19040492100016";

async function insererUtilisateur(email: string, organisationId: ObjectId, extra: Partial<IUsersMigration> = {}) {
  const user = testDoc<IUsersMigration>({
    email,
    password: "hash",
    nom: "Martin",
    prenom: "Paul",
    organisation_id: organisationId,
    account_status: "CONFIRMED",
    ...extra,
  });
  await usersMigrationDb().insertOne(user);
  return user;
}

describe("sendCfaDailyRecap", () => {
  useMongo();

  let organisme: IOrganisme;
  let organisationCfa: IOrganisation;
  let missionLocale: IOrganisation;
  let repondant: IUsersMigration;

  async function insererDossier({
    accConjoint = true,
    accConjointBy = repondant._id,
    situation = SITUATION_ENUM.RDV_PRIS,
    logIlYaHeures = 1,
  }: {
    accConjoint?: boolean;
    accConjointBy?: ObjectId;
    situation?: SITUATION_ENUM;
    logIlYaHeures?: number;
  } = {}) {
    const dossier = testDoc<IMissionLocaleEffectif>({
      mission_locale_id: missionLocale._id,
      effectif_id: new ObjectId(),
      effectif_snapshot: { organisme_id: organisme._id, apprenant: { nom: "DURAND", prenom: "Léa" } },
      created_at: new Date(),
      organisme_data: { acc_conjoint: accConjoint, acc_conjoint_by: accConjointBy },
    });
    await missionLocaleEffectifsDb().insertOne(dossier, { bypassDocumentValidation: true });
    await missionLocaleEffectifsLogDb().insertOne(
      testDoc<IMissionLocaleEffectifLog>({
        mission_locale_effectif_id: dossier._id,
        situation,
        created_at: subHours(new Date(), logIlYaHeures),
        read_by: [],
      })
    );
    return dossier;
  }

  beforeEach(async () => {
    vi.mocked(sendEmail).mockClear();
    organisme = { _id: new ObjectId(), ...createRandomOrganisme({ siret: SIRET }), nom: "CFA TEST" };
    await organismesDb().insertOne(organisme);
    organisationCfa = testDoc<IOrganisation>({
      type: "ORGANISME_FORMATION",
      siret: SIRET,
      uai: null,
      organisme_id: organisme._id.toString(),
      created_at: new Date(),
    });
    missionLocale = testDoc<IOrganisation>({
      type: "MISSION_LOCALE",
      ml_id: 42,
      nom: "ML Niort",
      created_at: new Date(),
    });
    await organisationsDb().insertMany([organisationCfa, missionLocale]);
    repondant = await insererUtilisateur("repondant@cfa.fr", organisationCfa._id);
    await insererUtilisateur("collegue@cfa.fr", organisationCfa._id);
  });

  it("envoie un seul mail, au répondant, pour un dossier en collaboration", async () => {
    await insererDossier();

    const compteurs = await sendCfaDailyRecap();

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(
      "repondant@cfa.fr",
      "cfa_daily_recap",
      {
        cfa: { nom: "Martin", prenom: "Paul" },
        mission_locale: { nom: "ML Niort" },
        effectifs_count: 1,
        jeunes: [{ nom: "DURAND", prenom: "Léa" }],
      },
      { noreply: true }
    );
    expect(compteurs).toEqual({
      cfas: 1,
      emailsSent: 1,
      organisationsIntrouvables: 0,
      repondantsIntrouvables: 0,
      erreurs: 0,
    });
  });

  it("n'envoie rien pour un dossier hors collaboration", async () => {
    await insererDossier({ accConjoint: false });

    const compteurs = await sendCfaDailyRecap();

    expect(sendEmail).not.toHaveBeenCalled();
    expect(compteurs).toMatchObject({ cfas: 0, emailsSent: 0 });
  });

  it("n'envoie rien et compte le répondant quand il n'est pas un compte confirmé du CFA", async () => {
    const autreCfa = testDoc<IOrganisation>({
      type: "ORGANISME_FORMATION",
      siret: "19040492100024",
      uai: null,
      organisme_id: new ObjectId().toString(),
      created_at: new Date(),
    });
    await organisationsDb().insertOne(autreCfa);
    const etranger = await insererUtilisateur("etranger@autre-cfa.fr", autreCfa._id);
    await insererDossier({ accConjointBy: etranger._id });

    const compteurs = await sendCfaDailyRecap();

    expect(sendEmail).not.toHaveBeenCalled();
    expect(compteurs).toMatchObject({ cfas: 1, emailsSent: 0, repondantsIntrouvables: 1 });
  });

  it("ignore les actions de plus de 24 h et les situations non actives", async () => {
    await insererDossier({ logIlYaHeures: 48 });
    await insererDossier({ situation: SITUATION_ENUM.COORDONNEES_INCORRECT });

    const compteurs = await sendCfaDailyRecap();

    expect(sendEmail).not.toHaveBeenCalled();
    expect(compteurs).toMatchObject({ cfas: 0, emailsSent: 0 });
  });
});
