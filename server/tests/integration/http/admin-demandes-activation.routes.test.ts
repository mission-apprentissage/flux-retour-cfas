import { readFileSync } from "node:fs";
import { join } from "node:path";

import AdmZip from "adm-zip";
import { ObjectId } from "mongodb";
import { NATURE_ORGANISME_DE_FORMATION } from "shared/constants";
import type { IDemandeActivationCfa } from "shared/models/data/demandesActivationCfa.model";
import type { IEffectif } from "shared/models/data/effectifs.model";
import type { IOrganisation } from "shared/models/data/organisations.model";
import type { IUsersMigration } from "shared/models/data/usersMigration.model";
import { generateOrganismeFixture } from "shared/models/fixtures/organisme.fixture";
import type { IDemandesActivationResponse } from "shared/models/routes/admin/demandes-activation.api";
import { getActiveAnneesScolaires } from "shared/utils/anneeScolaire";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  demandesActivationCfaDb,
  effectifsDb,
  invitationsArchiveDb,
  invitationsDb,
  organisationsDb,
  organismesDb,
  usersMigrationDb,
} from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";
import { initTestApp, RequestAsOrganisationFunc, testDoc, testPasswordHash } from "@tests/utils/testUtils";

vi.mock("job-processor", async (importOriginal) => ({
  ...(await importOriginal<typeof import("job-processor")>()),
  addJob: vi.fn(),
}));

useMongo();

const EXPORT = readFileSync(join(__dirname, "../../data/demandes-activation/export-google-forms.csv"));
const URL_IMPORT = "/api/v1/admin/demandes-activation/import";
const CFA_SIRET = "13002374000439";
const CFA_GMAIL_SIRET = "19440001400017";

let requestAsOrganisation: RequestAsOrganisationFunc;

async function insererCfa(siret: string, uai: string) {
  const id = new ObjectId();
  await organismesDb().insertOne(
    generateOrganismeFixture({ _id: id, siret, uai, nature: NATURE_ORGANISME_DE_FORMATION.FORMATEUR, ferme: false }),
    { bypassDocumentValidation: true }
  );
  await effectifsDb().insertOne(
    testDoc<IEffectif>({
      _id: new ObjectId(),
      organisme_id: id,
      annee_scolaire: getActiveAnneesScolaires(new Date())[0],
    }),
    { bypassDocumentValidation: true }
  );
  return id;
}

function importer(contenu: Buffer, nomFichier = "Webinaire PdL (réponses).csv", source = "Webinaire PdL") {
  const formulaire = new FormData();
  formulaire.append("fichier", new Blob([contenu]), nomFichier);
  if (source) formulaire.append("source", source);
  return requestAsOrganisation({ type: "ADMINISTRATEUR" }, "post", URL_IMPORT, formulaire);
}

const zipper = (contenu: Buffer, nom = "Webinaire PdL (réponses).csv") => {
  const archive = new AdmZip();
  archive.addFile(nom, contenu);
  return archive.toBuffer();
};

const demande = (email: string) => demandesActivationCfaDb().findOne({ email });

describe("POST /api/v1/admin/demandes-activation/import", () => {
  let cfaId: ObjectId;

  beforeEach(async () => {
    ({ requestAsOrganisation } = await initTestApp());
    cfaId = await insererCfa(CFA_SIRET, "0442095L");
    await insererCfa(CFA_GMAIL_SIRET, "0442097N");
  });

  it("importe l'export Google Forms et évalue chaque demandeur", async () => {
    const response = await importer(EXPORT, "Webinaire PdL (réponses).csv", "Webinaire PdL");

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ creees: 5, misesAJour: 0, fusionnees: 1, inchangees: 0, sansSiret: 0, erreurs: 0 });
    expect(await demande("directrice@cfa-exemple.fr")).toMatchObject({
      source: "Webinaire PdL",
      siret_saisi_brut: "130 023 740 00439",
      siret_saisi: CFA_SIRET,
      siret: CFA_SIRET,
      uai: "0442095L",
      organisme_id: cfaId,
      horodatage_brut: "2026/10/16 3:45:45 PM UTC+3",
      horodatage: new Date("2026-10-16T12:45:45.000Z"),
      fonction: "Directrice",
      motifs: [],
      branche: "activation",
      statut: "pret",
      a_envoyer: false,
    });
    expect(await demande("referent@cfa-exemple.fr")).toMatchObject({
      horodatage_brut: "2026/10/16 4:02:10 PM UTC+3",
      horodatage: new Date("2026-10-16T13:02:10.000Z"),
      commentaire: "Merci pour le webinaire, très clair",
    });
    expect(await demande("contact.cfa@gmail.com")).toMatchObject({
      branche: "refus",
      motifs: ["messagerie_grand_public"],
    });
    expect(await demande("rh@cfa-exemple.fr")).toMatchObject({
      siret_saisi: "1300237400043",
      motifs: ["siret_mal_forme"],
    });
    expect(await demande("compta@autre-cfa.fr")).toMatchObject({
      horodatage_brut: "16 octobre",
      horodatage: null,
      motifs: ["siret_inconnu"],
    });
  });

  it("lit le même export dans son archive .zip", async () => {
    const response = await importer(zipper(EXPORT), "Webinaire PdL (réponses).csv.zip");

    expect(response.data.creees).toBe(5);
    expect(await demande("directrice@cfa-exemple.fr")).toMatchObject({ source: "Webinaire PdL" });
  });

  it("refuse un import sans source", async () => {
    const sansSource = await importer(EXPORT, "export.csv", "");
    const blanche = await importer(EXPORT, "export.csv", "   ");

    expect(sansSource.status).toBe(400);
    expect(sansSource.data.message).toBe("Indiquez la source de l'import");
    expect(blanche.status).toBe(400);
    expect(await demandesActivationCfaDb().countDocuments()).toBe(0);
  });

  it("pose la source à la création et reprend l'écriture d'une source existante", async () => {
    const csv = (...emails: string[]) =>
      Buffer.from(
        `"Adresse email","SIRET de votre CFA"\n${emails.map((email) => `"${email}","${CFA_SIRET}"`).join("\n")}\n`
      );

    await importer(EXPORT, "export.csv", "Webinaire PdL");
    await importer(csv("directrice@cfa-exemple.fr", "nouvelle@cfa-exemple.fr"), "salon.csv", "Salon apprentissage");
    await importer(csv("autre@cfa-exemple.fr"), "relance.csv", "  webinaire   pdl ");

    expect(await demande("directrice@cfa-exemple.fr")).toMatchObject({ source: "Webinaire PdL" });
    expect(await demande("nouvelle@cfa-exemple.fr")).toMatchObject({ source: "Salon apprentissage" });
    expect(await demande("autre@cfa-exemple.fr")).toMatchObject({ source: "Webinaire PdL" });
  });

  it("lit une archive recompressée sous macOS, malgré ses fichiers __MACOSX", async () => {
    const archive = new AdmZip();
    archive.addFile("Webinaire PdL (réponses).csv", EXPORT);
    archive.addFile("__MACOSX/._Webinaire PdL (réponses).csv", Buffer.from([0, 5, 22, 7]));

    const response = await importer(archive.toBuffer(), "Webinaire PdL.zip");

    expect(response.status).toBe(200);
    expect(response.data.creees).toBe(5);
  });

  it("garde la date d'inscription la plus ancienne d'un import à l'autre", async () => {
    const reponse = (horodateur: string) =>
      Buffer.from(
        `"Horodateur","Adresse email","SIRET de votre CFA"\n"${horodateur}","directrice@cfa-exemple.fr","${CFA_SIRET}"\n`
      );

    await importer(reponse("2026/10/17 9:00:00 AM UTC+2"));
    await importer(EXPORT);
    await importer(reponse("2026/10/18 9:00:00 AM UTC+2"));

    expect(await demande("directrice@cfa-exemple.fr")).toMatchObject({
      horodatage_brut: "2026/10/16 3:45:45 PM UTC+3",
      horodatage: new Date("2026-10-16T12:45:45.000Z"),
    });
  });

  it("lit un export rouvert dans Excel, avec d'autres intitulés et un autre ordre de colonnes", async () => {
    const excel = Buffer.from(
      "﻿Votre SIRET;E-mail du demandeur;Votre fonction;Horodatage\r\n13002374000439;Directrice@cfa-exemple.fr;Directrice, pédagogie;2026/10/16 3:45:45 PM UTC+3\r\n"
    );

    const response = await importer(excel, "export.csv");

    expect(response.data.creees).toBe(1);
    expect(await demande("directrice@cfa-exemple.fr")).toMatchObject({
      siret: CFA_SIRET,
      fonction: "Directrice, pédagogie",
      horodatage: new Date("2026-10-16T12:45:45.000Z"),
      branche: "activation",
    });
  });

  it("lit les anciens SIRET d'une question recréée, passés dans une colonne sans titre", async () => {
    const recreee = Buffer.from(
      `"Horodateur","Adresse email","SIRET de votre CFA","Fonction occupée au sein du CFA",""
"2026/10/16 3:45:45 PM UTC+3","Directrice@CFA-exemple.fr","","Directrice","130 023 740 00439"
"2026/11/02 9:21:55 AM UTC+1","nouvelle@cfa-exemple.fr","${CFA_GMAIL_SIRET}","Conseillère formation",""
`
    );

    await importer(EXPORT);
    const response = await importer(recreee);

    expect(response.data).toMatchObject({ creees: 1, misesAJour: 1, sansSiret: 0 });
    expect(await demandesActivationCfaDb().countDocuments()).toBe(6);
    expect(await demande("directrice@cfa-exemple.fr")).toMatchObject({
      siret_saisi_brut: "130 023 740 00439",
      siret: CFA_SIRET,
      branche: "activation",
    });
    expect(await demande("nouvelle@cfa-exemple.fr")).toMatchObject({ siret: CFA_GMAIL_SIRET });
  });

  it("lit chacune des colonnes de même intitulé", async () => {
    const enDouble = Buffer.from(
      `"Adresse email","SIRET de votre CFA","SIRET de votre CFA"
"directrice@cfa-exemple.fr","${CFA_SIRET}",""
"nouvelle@cfa-exemple.fr","","${CFA_GMAIL_SIRET}"
`
    );

    const response = await importer(enDouble);

    expect(response.data).toMatchObject({ creees: 2, sansSiret: 0 });
    expect(await demande("directrice@cfa-exemple.fr")).toMatchObject({ siret: CFA_SIRET });
    expect(await demande("nouvelle@cfa-exemple.fr")).toMatchObject({ siret: CFA_GMAIL_SIRET });
  });

  it("ignore et compte à part les lignes sans SIRET, mais garde un SIRET mal saisi", async () => {
    const sansSiret = Buffer.from(
      `"Adresse email","SIRET de votre CFA"
"directrice@cfa-exemple.fr","${CFA_SIRET}"
"nouvelle@cfa-exemple.fr","  "
"rh@cfa-exemple.fr","en cours"
"",""
`
    );

    const response = await importer(sansSiret);

    expect(response.data).toEqual({ creees: 2, misesAJour: 0, fusionnees: 0, inchangees: 0, sansSiret: 1, erreurs: 1 });
    expect(await demande("nouvelle@cfa-exemple.fr")).toBeNull();
    expect(await demande("rh@cfa-exemple.fr")).toMatchObject({ motifs: ["siret_mal_forme"] });
  });

  it("refuse un fichier sans colonne SIRET en listant les colonnes attendues", async () => {
    const response = await importer(Buffer.from('"Horodateur","Adresse email"\n"x","a@b.fr"\n'), "export.csv");

    expect(response.status).toBe(400);
    expect(response.data.message).toContain("Colonnes attendues");
    expect(await demandesActivationCfaDb().countDocuments()).toBe(0);
  });

  it("refuse un fichier trop gros, y compris une archive dont le CSV décompressé dépasse le plafond", async () => {
    const enorme = Buffer.concat([EXPORT, Buffer.alloc(1024 * 1024, " ")]);

    const fichier = await importer(enorme, "export.csv");
    const archive = await importer(zipper(enorme), "export.csv.zip");

    expect(fichier.status).toBe(400);
    expect(fichier.data.message).toContain("trop volumineux");
    expect(archive.status).toBe(400);
    expect(archive.data.message).toContain("trop volumineux");
  });

  it("ne crée aucun doublon au ré-import sous un autre nom et garde les corrections manuelles", async () => {
    await importer(EXPORT, "Webinaire PdL (réponses).csv");
    await demandesActivationCfaDb().updateOne(
      { email: "contact.cfa@gmail.com" },
      { $set: { email_corrige: "contact@cfa-exemple.fr" } }
    );
    await demandesActivationCfaDb().updateOne({ email: "rh@cfa-exemple.fr" }, { $set: { siret_corrige: CFA_SIRET } });

    const response = await importer(zipper(EXPORT), "Webinaire PdL (réponses) (1).csv.zip", "Relance PdL");

    expect(response.data).toEqual({ creees: 0, misesAJour: 5, fusionnees: 1, inchangees: 0, sansSiret: 0, erreurs: 0 });
    expect(await demandesActivationCfaDb().countDocuments()).toBe(5);
    expect(await demandesActivationCfaDb().findOne({ email_saisi: "contact.cfa@gmail.com" })).toMatchObject({
      email_corrige: "contact@cfa-exemple.fr",
      email: "contact@cfa-exemple.fr",
      motifs: [],
      branche: "activation",
      source: "Webinaire PdL",
    });
    expect(await demande("rh@cfa-exemple.fr")).toMatchObject({
      siret_corrige: CFA_SIRET,
      motifs: [],
      branche: "activation",
    });
  });

  it("garde l'email corrigé au ré-import, sans doublon", async () => {
    await importer(EXPORT);
    await demandesActivationCfaDb().updateOne(
      { email: "rh@cfa-exemple.fr" },
      { $set: { email_corrige: "drh@cfa-exemple.fr", email: "drh@cfa-exemple.fr" } }
    );

    const response = await importer(EXPORT);

    expect(response.data).toMatchObject({ creees: 0, misesAJour: 5 });
    expect(await demandesActivationCfaDb().countDocuments()).toBe(5);
    expect(await demande("drh@cfa-exemple.fr")).toMatchObject({
      email_saisi: "rh@cfa-exemple.fr",
      email_corrige: "drh@cfa-exemple.fr",
    });
  });

  it("ne touche pas une demande déjà envoyée", async () => {
    await importer(EXPORT);
    await demandesActivationCfaDb().updateOne({ email: "directrice@cfa-exemple.fr" }, { $set: { statut: "envoyee" } });

    const response = await importer(EXPORT);

    expect(response.data.inchangees).toBe(1);
    expect(response.data.misesAJour).toBe(4);
  });
});

describe("récapitulatif des demandes d'activation", () => {
  const URL_LISTE = "/api/v1/admin/demandes-activation";

  beforeEach(async () => {
    ({ requestAsOrganisation } = await initTestApp());
    await insererCfa(CFA_SIRET, "0442095L");
    await insererCfa(CFA_GMAIL_SIRET, "0442097N");
    await importer(EXPORT);
  });

  const lister = async () =>
    (await requestAsOrganisation({ type: "ADMINISTRATEUR" }, "get", URL_LISTE)).data as {
      demandes: { _id: string; email: string; vue: string; cochable: boolean; branche: string; motifs: string[] }[];
    };
  const ligne = async (email: string) => (await lister()).demandes.find((demande) => demande.email === email)!;
  const modifier = (id: string, modification: Record<string, unknown>) =>
    requestAsOrganisation({ type: "ADMINISTRATEUR" }, "put", `${URL_LISTE}/${id}`, modification);
  const cocher = (ids: string[], aEnvoyer: boolean) =>
    requestAsOrganisation({ type: "ADMINISTRATEUR" }, "put", `${URL_LISTE}/a-envoyer`, { ids, a_envoyer: aEnvoyer });
  const relireDemande = (id: string) => demandesActivationCfaDb().findOne({ _id: new ObjectId(id) });

  it("classe chaque demande dans une seule vue, avec son compte", async () => {
    const { demandes } = await lister();

    expect(demandes.map(({ vue }) => vue).sort()).toEqual(["a_envoyer", "a_envoyer", "refus", "refus", "refus"]);
    expect(demandes.find((demande) => demande.email === "directrice@cfa-exemple.fr")).toMatchObject({
      vue: "a_envoyer",
      cochable: true,
      horodatage: "2026-10-16T12:45:45.000Z",
      horodatage_brut: "2026/10/16 3:45:45 PM UTC+3",
      organisme: { nom: null },
    });
  });

  it("rend cochable un refus avec mail, pas un refus sans mail", async () => {
    const siretInconnu = await ligne("compta@autre-cfa.fr");
    const gmail = await ligne("contact.cfa@gmail.com");

    expect(siretInconnu).toMatchObject({ vue: "refus", cochable: true });
    expect(gmail).toMatchObject({ vue: "refus", cochable: false });

    const reponse = await cocher([siretInconnu._id, gmail._id], true);

    expect(reponse.status).toBe(200);
    expect(reponse.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ _id: siretInconnu._id, a_envoyer: true }),
        expect.objectContaining({ _id: gmail._id, a_envoyer: false }),
      ])
    );
    expect(await relireDemande(gmail._id)).toMatchObject({ a_envoyer: false });
  });

  it("décoche des demandes sans toucher une demande en cours d'envoi", async () => {
    const directrice = await ligne("directrice@cfa-exemple.fr");
    const referent = await ligne("referent@cfa-exemple.fr");
    await cocher([directrice._id, referent._id], true);
    await demandesActivationCfaDb().updateOne(
      { _id: new ObjectId(referent._id) },
      { $set: { statut: "envoi_en_cours" } }
    );

    const reponse = await cocher([directrice._id, referent._id], false);

    expect(reponse.data).toHaveLength(2);
    expect(await relireDemande(directrice._id)).toMatchObject({ a_envoyer: false });
    expect(await relireDemande(referent._id)).toMatchObject({ a_envoyer: true, statut: "envoi_en_cours" });
  });

  it("refuse une coche sans identifiant valide, et la coche par la route de correction", async () => {
    const { _id } = await ligne("directrice@cfa-exemple.fr");

    expect((await cocher([], true)).status).toBe(400);
    expect((await cocher(["pas-un-identifiant"], true)).status).toBe(400);
    expect((await modifier(_id, { a_envoyer: true })).status).toBe(400);
  });

  it("réévalue une demande dont le SIRET est corrigé : elle devient éligible et cochable", async () => {
    const { _id } = await ligne("rh@cfa-exemple.fr");

    const response = await modifier(_id, { siret_corrige: "130 023 740 00439" });

    expect(response.data).toMatchObject({
      siret_corrige: CFA_SIRET,
      motifs: [],
      branche: "activation",
      vue: "a_envoyer",
      cochable: true,
    });
  });

  it("corrige l'email d'une demande, puis revient à l'email saisi", async () => {
    const { _id } = await ligne("contact.cfa@gmail.com");

    const corrigee = await modifier(_id, { email_corrige: " Direction@CFA-exemple.fr " });
    expect(corrigee.data).toMatchObject({
      email: "direction@cfa-exemple.fr",
      email_saisi: "contact.cfa@gmail.com",
      email_corrige: "direction@cfa-exemple.fr",
      motifs: [],
      vue: "a_envoyer",
      cochable: true,
    });

    const annulee = await modifier(_id, { email_corrige: null });
    expect(annulee.data).toMatchObject({
      email: "contact.cfa@gmail.com",
      email_corrige: null,
      motifs: ["messagerie_grand_public"],
    });
  });

  it("fait apparaître dans « Devenus éligibles » un CFA dont les effectifs sont arrivés", async () => {
    const sansEffectifId = new ObjectId();
    await organismesDb().insertOne(
      generateOrganismeFixture({
        _id: sansEffectifId,
        siret: "13002374000447",
        uai: "0442096M",
        nature: NATURE_ORGANISME_DE_FORMATION.FORMATEUR,
        ferme: false,
      }),
      { bypassDocumentValidation: true }
    );
    await importer(Buffer.from('"Adresse email","SIRET de votre CFA"\n"direction@cfa-exemple.fr","13002374000447"\n'));
    expect(await ligne("direction@cfa-exemple.fr")).toMatchObject({ vue: "refus", motifs: ["aucun_effectif"] });

    await effectifsDb().insertOne(
      testDoc<IEffectif>({
        _id: new ObjectId(),
        organisme_id: sansEffectifId,
        annee_scolaire: getActiveAnneesScolaires(new Date())[0],
      }),
      { bypassDocumentValidation: true }
    );

    expect(await ligne("direction@cfa-exemple.fr")).toMatchObject({ vue: "devenus_eligibles", cochable: true });
  });

  it("refuse un envoi sans demande confirmée", async () => {
    const response = await requestAsOrganisation({ type: "ADMINISTRATEUR" }, "post", `${URL_LISTE}/envoyer`, {});

    expect(response.status).toBe(400);
  });

  it("refuse de modifier une demande en cours d'envoi", async () => {
    const { _id } = await ligne("directrice@cfa-exemple.fr");
    await demandesActivationCfaDb().updateOne({ _id: new ObjectId(_id) }, { $set: { statut: "envoi_en_cours" } });

    expect((await modifier(_id, { siret_corrige: CFA_SIRET })).status).toBe(409);
  });
});

describe("suivi des demandes envoyées", () => {
  const URL_LISTE = "/api/v1/admin/demandes-activation";
  const JOUR = 24 * 3600 * 1000;
  const ENVOI = new Date("2026-10-28T09:00:00.000Z");
  const plus = (jours: number) => new Date(ENVOI.getTime() + jours * JOUR);
  const EMAIL = "direction@cfa-suivi.fr";
  let organismeId: ObjectId;
  let organisationId: ObjectId;

  async function insererOrganisation(organisme: ObjectId) {
    const _id = new ObjectId();
    await organisationsDb().insertOne(
      testDoc<IOrganisation>({
        _id,
        type: "ORGANISME_FORMATION",
        siret: CFA_SIRET,
        uai: "0442095L",
        organisme_id: organisme.toString(),
        created_at: ENVOI,
      }),
      { bypassDocumentValidation: true }
    );
    return _id;
  }

  async function insererCompte(overrides: Partial<IUsersMigration> = {}) {
    const _id = new ObjectId();
    await usersMigrationDb().insertOne({
      _id,
      email: EMAIL,
      prenom: "Camille",
      nom: "Martin",
      password: testPasswordHash,
      connection_history: [],
      emails: [],
      organisation_id: organisationId,
      organisation_role: "admin",
      account_status: "CONFIRMED",
      created_at: plus(1),
      ...overrides,
    });
    return _id;
  }

  async function insererEnvoyee(overrides: Partial<IDemandeActivationCfa> = {}) {
    const _id = new ObjectId();
    await demandesActivationCfaDb().insertOne({
      _id,
      source: "Webinaire PdL",
      email_saisi: EMAIL,
      email: EMAIL,
      siret_saisi_brut: CFA_SIRET,
      siret_saisi: CFA_SIRET,
      siret: CFA_SIRET,
      organisme_id: organismeId,
      organisation_id: organisationId,
      motifs: [],
      domaine_inconnu: false,
      branche: "activation",
      branche_initiale: "activation",
      branche_envoyee: "activation",
      a_envoyer: false,
      statut: "envoyee",
      invitation_id: new ObjectId(),
      envoyee_at: ENVOI,
      created_at: ENVOI,
      updated_at: ENVOI,
      ...overrides,
    });
    return _id.toString();
  }

  const invitation = (overrides: {
    author_id: ObjectId;
    email?: string;
    created_at?: Date;
    relance_admin_at?: Date;
  }) => ({
    _id: new ObjectId(),
    token: `jeton-${new ObjectId().toString()}`,
    email: "collegue@cfa-suivi.fr",
    organisation_id: organisationId,
    role: "member" as const,
    created_at: plus(2),
    expires_at: plus(6),
    ...overrides,
  });

  const COMPTE_EXISTANT = {
    branche: "compte_existant",
    branche_initiale: "compte_existant",
    branche_envoyee: "compte_existant",
    invitation_id: null,
  } as const;

  const ligneDe = async (id: string) =>
    (
      (await requestAsOrganisation({ type: "ADMINISTRATEUR" }, "get", URL_LISTE)).data as IDemandesActivationResponse
    ).demandes.find((demande) => demande._id === id)!;

  beforeEach(async () => {
    ({ requestAsOrganisation } = await initTestApp());
    organismeId = await insererCfa(CFA_SIRET, "0442095L");
    organisationId = await insererOrganisation(organismeId);
  });

  it("retrouve par e-mail le compte recréé sur invitation, quand user_id vise l'ancien compte supprimé", async () => {
    const id = await insererEnvoyee({ user_id: new ObjectId() });
    await insererCompte({ account_status: "PENDING_EMAIL_VALIDATION" });

    expect(await ligneDe(id)).toMatchObject({
      vue: "envoyees",
      compte: { prenom: "Camille", account_status: "PENDING_EMAIL_VALIDATION", created_at: plus(1).toISOString() },
      suivi: {
        etape: "compte_a_valider",
        mail_envoye: "invitation",
        compte_ailleurs: false,
        connexion_apres_envoi_at: null,
      },
    });
  });

  it("ne compte que les connexions postérieures à l'envoi", async () => {
    const id = await insererEnvoyee();
    const compteId = await insererCompte({ connection_history: [plus(-3)], last_connection: plus(-3) });

    expect((await ligneDe(id)).suivi).toMatchObject({ etape: "pas_connecte", connexion_apres_envoi_at: null });

    await usersMigrationDb().updateOne(
      { _id: compteId },
      { $set: { connection_history: [plus(-3), plus(2), plus(5)], last_connection: plus(5) } }
    );

    expect(await ligneDe(id)).toMatchObject({
      compte: { last_connection: plus(5).toISOString() },
      suivi: { etape: "connecte", connexion_apres_envoi_at: plus(2).toISOString() },
    });
  });

  it("retrouve par user_id un compte existant dont l'e-mail a changé depuis l'évaluation", async () => {
    const compteId = await insererCompte({ email: "nouvelle.adresse@cfa-suivi.fr", created_at: plus(-100) });
    const id = await insererEnvoyee({ ...COMPTE_EXISTANT, user_id: compteId });

    expect((await ligneDe(id)).suivi).toMatchObject({ etape: "pas_connecte", mail_envoye: "compte_existant" });
  });

  it("repasse à compte à créer un compte existant supprimé depuis l'envoi", async () => {
    const id = await insererEnvoyee({ ...COMPTE_EXISTANT, user_id: new ObjectId() });

    expect(await ligneDe(id)).toMatchObject({
      compte: null,
      suivi: { etape: "compte_a_creer", mail_envoye: "compte_existant", compte_ailleurs: false },
    });
  });

  it("écarte un compte d'un autre établissement, mais garde celui d'une organisation jumelle", async () => {
    const id = await insererEnvoyee();
    const autreOrganisme = await insererCfa(CFA_GMAIL_SIRET, "0442097N");
    const compteId = await insererCompte({ organisation_id: await insererOrganisation(autreOrganisme) });

    expect(await ligneDe(id)).toMatchObject({
      compte: null,
      suivi: { etape: "compte_a_creer", compte_ailleurs: true },
    });

    await usersMigrationDb().updateOne(
      { _id: compteId },
      { $set: { organisation_id: await insererOrganisation(organismeId) } }
    );

    expect((await ligneDe(id)).suivi).toMatchObject({ etape: "pas_connecte", compte_ailleurs: false });
  });

  it("compte les collaborateurs invités depuis l'envoi, et seulement les inscrits parmi les archivées", async () => {
    const id = await insererEnvoyee();
    const compteId = await insererCompte();
    await insererCompte({ email: "inscrit@cfa-suivi.fr", organisation_role: "member" });
    await invitationsDb().insertOne(invitation({ author_id: compteId, email: "en-attente@cfa-suivi.fr" }));
    await invitationsArchiveDb().insertOne(invitation({ author_id: compteId, email: "inscrit@cfa-suivi.fr" }));
    await invitationsArchiveDb().insertOne(invitation({ author_id: compteId, email: "annulee@cfa-suivi.fr" }));
    await invitationsDb().insertOne(
      invitation({ author_id: compteId, email: "avant-envoi@cfa-suivi.fr", created_at: plus(-1) })
    );

    expect((await ligneDe(id)).suivi).toMatchObject({ collaborateurs_invites: 3, collaborateurs_inscrits: 1 });
  });

  it("donne la dernière relance postérieure à l'envoi, relances d'invitations en attente comprises", async () => {
    const compteId = await insererCompte();
    const id = await insererEnvoyee({ invitez_sent_at: plus(-10) });

    expect((await ligneDe(id)).suivi?.derniere_relance).toBeNull();

    await demandesActivationCfaDb().updateOne(
      { _id: new ObjectId(id) },
      { $set: { relance_validation_email_at: plus(2) } }
    );

    expect((await ligneDe(id)).suivi?.derniere_relance).toEqual({
      type: "validation_email",
      at: plus(2).toISOString(),
    });

    await invitationsDb().insertOne(
      invitation({ author_id: compteId, created_at: plus(3), relance_admin_at: plus(5) })
    );

    expect((await ligneDe(id)).suivi?.derniere_relance).toEqual({
      type: "invitation_en_attente",
      at: plus(5).toISOString(),
    });
  });

  it("indique un lien de validation renvoyé quand l'envoi n'a pas créé d'invitation", async () => {
    const id = await insererEnvoyee({ invitation_id: null });
    await insererCompte({ account_status: "PENDING_EMAIL_VALIDATION", created_at: plus(-5) });

    expect((await ligneDe(id)).suivi).toMatchObject({ etape: "compte_a_valider", mail_envoye: "lien_validation" });
  });

  it("ne calcule le suivi que dans la vue Envoyées", async () => {
    const envoyee = await insererEnvoyee();
    const prete = await insererEnvoyee({ email: "autre@cfa-suivi.fr", statut: "pret", envoyee_at: null });
    const refusEnvoye = await insererEnvoyee({
      email: "refus@cfa-suivi.fr",
      branche: "refus",
      branche_initiale: "refus",
      branche_envoyee: "refus",
      motifs: ["aucun_effectif"],
    });

    expect((await ligneDe(envoyee)).suivi).not.toBeNull();
    for (const id of [prete, refusEnvoye]) {
      expect(await ligneDe(id)).toMatchObject({ suivi: null });
      expect((await ligneDe(id)).vue).not.toBe("envoyees");
    }
  });
});
