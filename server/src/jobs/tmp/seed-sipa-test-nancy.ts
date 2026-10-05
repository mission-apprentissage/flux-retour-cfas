import { ObjectId, WithoutId } from "mongodb";
import { SOURCE_APPRENANT } from "shared/constants";
import { IEffectif } from "shared/models/data/effectifs.model";
import { IEffectifDECA } from "shared/models/data/effectifsDECA.model";

import { withComputedFields } from "@/common/actions/effectifs.actions";
import { getOrganismeByUAIAndSIRET } from "@/common/actions/organismes/organismes.actions";
import { getSuiviSipaEffectifs } from "@/common/actions/sipa.actions";
import parentLogger from "@/common/logger";
import { effectifsDb, effectifsDECADb } from "@/common/model/collections";

const logger = parentLogger.child({ module: "job:tmp:seed-sipa-test-nancy" });

const MARKER = "SIPA_TEST_NANCY";
const ANNEE_SCOLAIRE = "2026-2027";
const NIVEAU = "3"; // CAP
const NIVEAU_LIBELLE = "3 (CAP, BEP...)";

const VERIF_DATE_MIN = "2026-09-01";
const VERIF_DATE_MAX = "2026-09-30";
const VERIF_DEPARTEMENTS = ["54", "55", "88"];

const d = (s: string) => new Date(`${s}T00:00:00.000Z`);

interface SeedEmployeur {
  siret: string;
  denomination: string;
  naf: string;
  adresse: { code_postal: string };
  nombre_de_salaries: number;
}

interface SeedProfil {
  kind: "CFA" | "DECA";
  uai: string;
  siret: string;
  expectedDepartement: string;
  formation: { cfd: string; rncp: string; date_inscription: string; date_entree: string; date_fin: string };
  contrat: { date_debut: string; date_fin: string; date_rupture: string | null; employeur?: SeedEmployeur } | null;
}

const PROFILS = {
  INSCRIT_54: {
    kind: "CFA",
    uai: "0540081V",
    siret: "19540081700019",
    expectedDepartement: "54",
    formation: {
      cfd: "50022141",
      rncp: "RNCP4637",
      date_inscription: "2026-09-02",
      date_entree: "2026-09-02",
      date_fin: "2027-08-31",
    },
    contrat: null,
  },
  DECLARE_55: {
    kind: "CFA",
    uai: "0550892W",
    siret: "78341511000015",
    expectedDepartement: "55",
    formation: {
      cfd: "50022141",
      rncp: "RNCP4637",
      date_inscription: "2026-09-02",
      date_entree: "2026-09-02",
      date_fin: "2027-08-31",
    },
    contrat: { date_debut: "2026-09-01", date_fin: "2027-08-31", date_rupture: null },
  },
  DECA_88: {
    kind: "DECA",
    uai: "0881269B",
    siret: "78334702400086",
    expectedDepartement: "88",
    formation: {
      cfd: "40025503",
      rncp: "RNCP38596",
      date_inscription: "2026-09-02",
      date_entree: "2026-09-02",
      date_fin: "2027-06-30",
    },
    contrat: { date_debut: "2026-09-01", date_fin: "2027-06-30", date_rupture: "2027-07-15" },
  },
  DECLARE_55_0550861M: {
    kind: "CFA",
    uai: "0550861M",
    siret: "30019718300027",
    expectedDepartement: "55",
    formation: {
      cfd: "50022141",
      rncp: "RNCP4637",
      date_inscription: "2026-09-02",
      date_entree: "2026-09-02",
      date_fin: "2027-08-31",
    },
    contrat: { date_debut: "2026-09-01", date_fin: "2027-08-31", date_rupture: null },
  },
  DECA_55_0550861M: {
    kind: "DECA",
    uai: "0550861M",
    siret: "30019718300027",
    expectedDepartement: "55",
    formation: {
      cfd: "40025503",
      rncp: "RNCP38596",
      date_inscription: "2026-09-02",
      date_entree: "2026-09-02",
      date_fin: "2027-06-30",
    },
    contrat: { date_debut: "2026-09-01", date_fin: "2027-06-30", date_rupture: "2027-07-15" },
  },
  DECLARE_54: {
    kind: "CFA",
    uai: "0540081V",
    siret: "19540081700019",
    expectedDepartement: "54",
    formation: {
      cfd: "50022141",
      rncp: "RNCP4637",
      date_inscription: "2026-09-02",
      date_entree: "2026-09-02",
      date_fin: "2027-08-31",
    },
    contrat: { date_debut: "2026-09-01", date_fin: "2027-08-31", date_rupture: null },
  },
  DECA_55_0550892W: {
    kind: "DECA",
    uai: "0550892W",
    siret: "78341511000015",
    expectedDepartement: "55",
    formation: {
      cfd: "50022141",
      rncp: "RNCP4637",
      date_inscription: "2026-09-02",
      date_entree: "2026-09-02",
      date_fin: "2027-08-31",
    },
    contrat: {
      date_debut: "2026-09-01",
      date_fin: "2027-06-30",
      date_rupture: null,
      employeur: {
        siret: "44556677800019",
        denomination: "GARAGE DURAND SAS",
        naf: "4520A",
        adresse: { code_postal: "69007" },
        nombre_de_salaries: 15,
      },
    },
  },
  DECA_88_RUPTURE: {
    kind: "DECA",
    uai: "0881269B",
    siret: "78334702400086",
    expectedDepartement: "88",
    formation: {
      cfd: "40025503",
      rncp: "RNCP38596",
      date_inscription: "2026-09-02",
      date_entree: "2026-09-02",
      date_fin: "2027-06-30",
    },
    contrat: { date_debut: "2026-09-01", date_fin: "2027-06-30", date_rupture: "2026-09-28" },
  },
} satisfies Record<string, SeedProfil>;

interface SeedRecord {
  key: string;
  profil: keyof typeof PROFILS;
  nom: string;
  prenom: string;
  ine: string | null;
  date_de_naissance: string;
  sexe: "M" | "F";
  courriel: string;
  telephone: string;
  libelle: string;
  decaRawId?: string;
}

const LIBELLE_INSCRIT = "1CAP2  MAINT.VEHIC.OPT.VEHIC.LEGERS";
const LIBELLE_DECLARE = "1CAP2  MAINT.MATERIELS OPT.C ESP. VERTS";
const LIBELLE_DECA = "1CAP2  MACON";
const TEL_CFA = "0628000000";
const TEL_DECA = "0690000000";

const RECORDS: SeedRecord[] = [
  {
    key: "CDT01",
    profil: "DECA_88",
    nom: "XOTNUDA",
    prenom: "Ccaeaeoeoe",
    ine: null,
    date_de_naissance: "2011-05-07",
    sexe: "F",
    courriel: "Ccaeaeoeoe.bernard@example.com",
    telephone: TEL_DECA,
    libelle: LIBELLE_DECA,
    decaRawId: "665f1a2b3c4d5e6f7a869521",
  },
  {
    key: "CDT02",
    profil: "DECLARE_55",
    nom: "XUTNALI",
    prenom: "Ççææœœ",
    ine: null,
    date_de_naissance: "2011-06-07",
    sexe: "F",
    courriel: "XUTNALIemail_contact@domain.tld",
    telephone: TEL_CFA,
    libelle: LIBELLE_DECLARE,
  },
  {
    key: "CDT03",
    profil: "INSCRIT_54",
    nom: "ÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝ",
    prenom: "Jules",
    ine: null,
    date_de_naissance: "2011-05-23",
    sexe: "M",
    courriel: "Jules_contact@domain.tld",
    telephone: TEL_CFA,
    libelle: LIBELLE_INSCRIT,
  },
  {
    key: "CDT04",
    profil: "DECA_88",
    nom: "AAAAAAEEEEIIIIOOOOOUUUUY",
    prenom: "Aloïs",
    ine: null,
    date_de_naissance: "2011-05-30",
    sexe: "M",
    courriel: "Aloïs@example.com",
    telephone: TEL_DECA,
    libelle: LIBELLE_DECA,
    decaRawId: "69522a2b3c4d5e6f7a8b9c11",
  },
  {
    key: "CDT05",
    profil: "DECA_88",
    nom: "TRASNAPU",
    prenom: "Aaaaaaeeeeiiiiooooouuuuy",
    ine: null,
    date_de_naissance: "2011-12-08",
    sexe: "M",
    courriel: "Aaaaaaeeeeiiiiooooouuuuy.bernard@example.com",
    telephone: TEL_DECA,
    libelle: LIBELLE_DECA,
    decaRawId: "69520a2b3c4d5e6f7a8b9c11",
  },
  {
    key: "CDT06",
    profil: "DECLARE_55",
    nom: "ROBINSON-NINO",
    prenom: "Àáâãäåèéêëìíîïòóôõöùúûüý",
    ine: null,
    date_de_naissance: "2011-03-06",
    sexe: "M",
    courriel: "ROBINSON-NINO_contact@domain.tld",
    telephone: TEL_CFA,
    libelle: LIBELLE_DECLARE,
  },
  {
    key: "CDT07",
    profil: "DECA_88",
    nom: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    prenom: "Inaya",
    ine: null,
    date_de_naissance: "2011-11-21",
    sexe: "M",
    courriel: "Inaya.bernard@example.com",
    telephone: TEL_DECA,
    libelle: LIBELLE_DECA,
    decaRawId: "69516a2b3c4d5e6f7a8b9c11",
  },
  {
    key: "CDT08",
    profil: "INSCRIT_54",
    nom: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    prenom: "Bettina",
    ine: null,
    date_de_naissance: "2011-03-12",
    sexe: "F",
    courriel: "Bettina_contact@domain.tld",
    telephone: TEL_CFA,
    libelle: LIBELLE_INSCRIT,
  },
  {
    key: "CDT09",
    profil: "INSCRIT_54",
    nom: "NAJJILE",
    prenom: "Mohamed-Ali",
    ine: null,
    date_de_naissance: "2010-11-09",
    sexe: "M",
    courriel: "Mohamed-Aliemail_contact@domain.tld",
    telephone: TEL_CFA,
    libelle: LIBELLE_INSCRIT,
  },
  {
    key: "CDT10",
    profil: "DECLARE_55",
    nom: "GLOFVALE",
    prenom: "Lou-Ann",
    ine: null,
    date_de_naissance: "2011-05-28",
    sexe: "M",
    courriel: "Lou-Annemail_contact@domain.tld",
    telephone: TEL_CFA,
    libelle: LIBELLE_DECLARE,
  },
  {
    key: "CDT11",
    profil: "INSCRIT_54",
    nom: "KLICVELA",
    prenom: "Marie-Ange",
    ine: "120156231KE",
    date_de_naissance: "2011-01-28",
    sexe: "M",
    courriel: "Marie-Angeemail_contact@domain.tld",
    telephone: TEL_CFA,
    libelle: LIBELLE_INSCRIT,
  },
  {
    key: "CDT12",
    profil: "DECLARE_55",
    nom: "FRIJPURO",
    prenom: "Lili-Rose",
    ine: null,
    date_de_naissance: "2011-04-26",
    sexe: "M",
    courriel: "Lili-Roseemail_contact@domain.tld",
    telephone: TEL_CFA,
    libelle: LIBELLE_DECLARE,
  },
  {
    key: "CDT13",
    profil: "DECA_88",
    nom: "PROLAINI",
    prenom: "Anne-Sophie",
    ine: null,
    date_de_naissance: "2011-05-31",
    sexe: "M",
    courriel: "Anne-Sophie.bernard@example.com",
    telephone: TEL_DECA,
    libelle: LIBELLE_DECA,
    decaRawId: "26220a2b3c4d5e6f7a8b9c11",
  },
  {
    key: "CDT14",
    profil: "DECLARE_55",
    nom: "CIPCIRA",
    prenom: "Alima",
    ine: null,
    date_de_naissance: "2011-06-14",
    sexe: "M",
    courriel: "Alimaemail_contact@domain.tld",
    telephone: TEL_CFA,
    libelle: LIBELLE_DECLARE,
  },
  {
    key: "CDT15",
    profil: "INSCRIT_54",
    nom: "NIMAINE",
    prenom: "Louis-Marie",
    ine: null,
    date_de_naissance: "2011-06-24",
    sexe: "M",
    courriel: "Louis-Marieemail_contact@domain.tld",
    telephone: TEL_CFA,
    libelle: LIBELLE_INSCRIT,
  },
  {
    key: "CDT16",
    profil: "DECA_88",
    nom: "DREMRACU",
    prenom: "Cheick-Oumar",
    ine: null,
    date_de_naissance: "2011-12-09",
    sexe: "M",
    courriel: "Cheick-Oumar.bernard@example.com",
    telephone: TEL_DECA,
    libelle: LIBELLE_DECA,
    decaRawId: "46666a2b3c4d5e6f7a8b9c11",
  },
  {
    key: "XOSMOA",
    profil: "INSCRIT_54",
    nom: "XOSMOA",
    prenom: "Abdramane",
    ine: "120156231KE",
    date_de_naissance: "2010-10-12",
    sexe: "M",
    courriel: "Abdramaneemail_contact@domain.tld",
    telephone: TEL_CFA,
    libelle: LIBELLE_INSCRIT,
  },
  {
    key: "DRIFNUDU",
    profil: "DECLARE_55",
    nom: "DRIFNUDU",
    prenom: "Oriane",
    ine: null,
    date_de_naissance: "2011-08-15",
    sexe: "M",
    courriel: "Orianeemail_contact@domain.tld",
    telephone: TEL_CFA,
    libelle: LIBELLE_DECLARE,
  },
  {
    key: "FABBORI",
    profil: "DECLARE_55_0550861M",
    nom: "FABBORI",
    prenom: "Mustapha",
    ine: "130187884JE",
    date_de_naissance: "2010-05-07",
    sexe: "M",
    courriel: "Mustaphaemail_contact@domain.tld",
    telephone: TEL_CFA,
    libelle: "1CAP2  BOULANGER",
  },
  {
    key: "GLARCINE",
    profil: "DECA_88",
    nom: "GLARCINE",
    prenom: "Safa",
    ine: null,
    date_de_naissance: "2011-12-09",
    sexe: "M",
    courriel: "Safa.bernard@example.com",
    telephone: TEL_DECA,
    libelle: LIBELLE_DECA,
  },
  {
    key: "DRILGIPI",
    profil: "DECA_55_0550861M",
    nom: "DRILGIPI",
    prenom: "Stephane",
    ine: null,
    date_de_naissance: "2010-08-06",
    sexe: "M",
    courriel: "Stephane.bernard@example.com",
    telephone: TEL_DECA,
    libelle: LIBELLE_INSCRIT,
  },
];

interface SeedMaj {
  key: string;
  profil: keyof typeof PROFILS;
  mode: "remplace" | "ajoute";
}

const MISES_A_JOUR: SeedMaj[] = [
  { key: "CDT09", profil: "DECLARE_54", mode: "remplace" },
  { key: "CDT10", profil: "DECA_55_0550892W", mode: "ajoute" },
  { key: "CDT13", profil: "DECA_88_RUPTURE", mode: "remplace" },
];

const markerId = (key: string) => `${MARKER}_${key}`;
const profilOf = (record: SeedRecord): SeedProfil => PROFILS[record.profil];

function recordOf(key: string): SeedRecord {
  const record = RECORDS.find((r) => r.key === key);
  if (!record) throw new Error(`Enregistrement ${key} introuvable dans RECORDS`);
  return record;
}

function cibleMaj(maj: SeedMaj): SeedRecord {
  const record = recordOf(maj.key);
  const key = maj.mode === "ajoute" ? `${record.key}_${PROFILS[maj.profil].kind}` : record.key;
  return { ...record, key, profil: maj.profil };
}

function recordsAttendus(maj: boolean): SeedRecord[] {
  if (!maj) return RECORDS;
  const cibles = new Map(MISES_A_JOUR.map((m) => [m.key, cibleMaj(m)]));
  return RECORDS.map((record) => cibles.get(record.key) ?? record);
}

function buildApprenant(record: SeedRecord) {
  return {
    nom: record.nom,
    prenom: record.prenom,
    ine: record.ine,
    date_de_naissance: d(record.date_de_naissance),
    sexe: record.sexe,
    courriel: record.courriel,
    telephone: record.telephone,
    has_nir: false,
    historique_statut: [],
  };
}

function buildFormation(record: SeedRecord) {
  const { formation } = profilOf(record);
  return {
    cfd: formation.cfd,
    rncp: formation.rncp,
    libelle_long: record.libelle,
    libelle_court: record.libelle,
    niveau: NIVEAU,
    niveau_libelle: NIVEAU_LIBELLE,
    periode: [2026, 2027],
    date_inscription: d(formation.date_inscription),
    date_entree: d(formation.date_entree),
    date_fin: d(formation.date_fin),
  };
}

function buildContrats(record: SeedRecord) {
  const { contrat } = profilOf(record);
  if (!contrat) return [];
  return [
    {
      ...contrat.employeur,
      date_debut: d(contrat.date_debut),
      date_fin: d(contrat.date_fin),
      date_rupture: contrat.date_rupture ? d(contrat.date_rupture) : null,
    },
  ];
}

async function cleanup(): Promise<{ effectifs: number; effectifsDECA: number }> {
  const filter = { id_erp_apprenant: { $regex: `^${MARKER}_` } };
  const [eff, deca] = await Promise.all([effectifsDb().deleteMany(filter), effectifsDECADb().deleteMany(filter)]);
  logger.info(
    { effectifs: eff.deletedCount, effectifsDECA: deca.deletedCount },
    "Cleanup effectifs de test SIPA Nancy"
  );
  return { effectifs: eff.deletedCount ?? 0, effectifsDECA: deca.deletedCount ?? 0 };
}

async function buildEffectif(record: SeedRecord, now: Date) {
  const profil = profilOf(record);
  const organisme = await getOrganismeByUAIAndSIRET(profil.uai, profil.siret);
  if (!organisme) {
    logger.error({ key: record.key, uai: profil.uai, siret: profil.siret }, "Organisme introuvable (UAI+SIRET)");
    return null;
  }

  const base = {
    organisme_id: organisme._id,
    organisme_responsable_id: organisme._id,
    organisme_formateur_id: organisme._id,
    id_erp_apprenant: markerId(record.key),
    source_organisme_id: MARKER, // pas un id d'organisme : second marqueur des données de test
    annee_scolaire: ANNEE_SCOLAIRE,
    apprenant: buildApprenant(record),
    formation: buildFormation(record),
    contrats: buildContrats(record),
    is_lock: false,
    validation_errors: [],
    created_at: now,
    updated_at: now,
    transmitted_at: now,
  };

  if (profil.kind === "DECA") {
    const effectif = (await withComputedFields(
      {
        ...base,
        source: SOURCE_APPRENANT.DECA,
        deca_raw_id: record.decaRawId ? new ObjectId(record.decaRawId) : new ObjectId(),
      } as WithoutId<IEffectifDECA>,
      { organisme, certification: null }
    )) as WithoutId<IEffectifDECA>;
    return { organisme, kind: "DECA" as const, effectif };
  }
  const effectif = (await withComputedFields({ ...base, source: SOURCE_APPRENANT.ERP } as WithoutId<IEffectif>, {
    organisme,
    certification: null,
  })) as WithoutId<IEffectif>;
  return { organisme, kind: "CFA" as const, effectif };
}

async function saveEffectif(built: NonNullable<Awaited<ReturnType<typeof buildEffectif>>>) {
  const filter = { id_erp_apprenant: built.effectif.id_erp_apprenant };
  if (built.kind === "DECA") {
    const existing = await effectifsDECADb().findOne(filter, { projection: { created_at: 1 } });
    if (existing) {
      await effectifsDECADb().replaceOne({ _id: existing._id }, { ...built.effectif, created_at: existing.created_at });
    } else {
      await effectifsDECADb().insertOne({ ...built.effectif, _id: new ObjectId() });
    }
    return;
  }
  const existing = await effectifsDb().findOne(filter, { projection: { created_at: 1 } });
  if (existing) {
    await effectifsDb().replaceOne({ _id: existing._id }, { ...built.effectif, created_at: existing.created_at });
  } else {
    await effectifsDb().insertOne({ ...built.effectif, _id: new ObjectId() });
  }
}

async function insertRecords(dryRun: boolean): Promise<{ inserted: number; skipped: string[] }> {
  const now = new Date();
  const skipped: string[] = [];
  let inserted = 0;

  for (const record of RECORDS) {
    const built = await buildEffectif(record, now);
    if (!built) {
      skipped.push(record.key);
      continue;
    }
    if (!dryRun) await saveEffectif(built);

    const { organisme } = built;
    inserted++;
    logger.info(
      {
        key: record.key,
        profil: record.profil,
        organisme: organisme.nom,
        departement: organisme.adresse?.departement,
        dryRun,
      },
      "Effectif de test préparé"
    );
  }

  logger.info({ inserted, skipped, dryRun }, dryRun ? "Insertion simulée (dry-run)" : "Insertion terminée");
  return { inserted, skipped };
}

async function applyMaj(dryRun: boolean): Promise<void> {
  for (const maj of MISES_A_JOUR) {
    const depart = recordOf(maj.key);
    const collection = profilOf(depart).kind === "DECA" ? effectifsDECADb() : effectifsDb();
    if (!(await collection.countDocuments({ id_erp_apprenant: markerId(depart.key) }))) {
      throw new Error(`Dossier de départ ${depart.key} absent : lancer d'abord le seed sans option`);
    }
  }

  const now = new Date();
  for (const maj of MISES_A_JOUR) {
    const cible = cibleMaj(maj);
    const built = await buildEffectif(cible, now);
    if (!built) throw new Error(`Organisme introuvable pour ${cible.key} (profil ${cible.profil})`);
    if (!dryRun) await saveEffectif(built);
    logger.info({ key: cible.key, profil: cible.profil, mode: maj.mode, dryRun }, "Mise à jour appliquée");
  }
}

// Récupère toutes les pages : dès que la rentrée 2026 sera transmise par les ERP, la fenêtre
// peut dépasser 1000 éléments et les élèves de test tomber au-delà de la page 1.
type SipaEffectifs = Awaited<ReturnType<typeof getSuiviSipaEffectifs>>["effectifs"];

async function fetchAllSipaEffectifs(): Promise<{ totalElements: number; effectifs: SipaEffectifs }> {
  const params = {
    dateMin: d(VERIF_DATE_MIN),
    dateMax: d(VERIF_DATE_MAX),
    departementsDb: VERIF_DEPARTEMENTS,
  };
  const first = await getSuiviSipaEffectifs({ ...params, page: 1 });
  const effectifs: SipaEffectifs = [...first.effectifs];
  for (let page = 2; page <= first.metadonnees.totalPages; page++) {
    const next = await getSuiviSipaEffectifs({ ...params, page });
    effectifs.push(...next.effectifs);
  }
  return { totalElements: first.metadonnees.totalElements, effectifs };
}

// Même clé que la dédup SIPA (nom + prénom + date de naissance), pour ne pas confondre
// un élève de test avec un homonyme réel présent dans la fenêtre.
const verifKey = (nom: unknown, prenom: unknown, ddn: unknown) =>
  `${String(nom ?? "")
    .trim()
    .toLowerCase()}|${String(prenom ?? "")
    .trim()
    .toLowerCase()}|${ddn ?? ""}`;

async function verify(maj: boolean): Promise<void> {
  const records = recordsAttendus(maj);
  const { totalElements, effectifs } = await fetchAllSipaEffectifs();

  logger.info({ totalElements, departements: VERIF_DEPARTEMENTS }, "Vérification SIPA — résultat de l'agrégation");

  const byKey = new Map<string, SipaEffectifs[number]>(
    effectifs.map((e) => [verifKey(e.apprenant?.nom, e.apprenant?.prenom, e.apprenant?.dateNaissance), e] as const)
  );
  let ok = 0;
  const failures: string[] = [];

  for (const record of records) {
    const profil = profilOf(record);
    const found = byKey.get(verifKey(record.nom, record.prenom, record.date_de_naissance));
    const expectedDept = profil.expectedDepartement.padStart(3, "0");
    const expectedSource = profil.kind;
    const problems: string[] = [];

    if (!found) {
      problems.push("absent du résultat SIPA");
    } else {
      if (found.apprenant?.nom !== record.nom || found.apprenant?.prenom !== record.prenom) {
        problems.push(`nom/prénom altérés : ${found.apprenant?.nom} ${found.apprenant?.prenom}`);
      }
      if (found.organismeFormation?.departement !== expectedDept) {
        problems.push(`département ${found.organismeFormation?.departement} (attendu ${expectedDept})`);
      }
      if (found.source !== expectedSource) {
        problems.push(`source ${found.source} (attendu ${expectedSource})`);
      }
      const foundIne = found.apprenant?.ine ?? null;
      if (foundIne !== record.ine) {
        problems.push(`INE ${foundIne ?? "absent"} (attendu ${record.ine ?? "absent"})`);
      }
      const { contrat } = profil;
      if (!contrat || !found.contrats) {
        if (!!found.contrats !== !!contrat) {
          problems.push(`contrat ${found.contrats ? "présent" : "absent"} (attendu ${contrat ? "présent" : "absent"})`);
        }
      } else {
        const attendus = {
          dateDebutContrat: contrat.date_debut,
          dateFinContrat: contrat.date_fin,
          dateRuptureContrat: contrat.date_rupture,
        };
        for (const [champ, attendu] of Object.entries(attendus) as [keyof typeof attendus, string | null][]) {
          if (found.contrats[champ] !== attendu) {
            problems.push(`${champ} ${found.contrats[champ]} (attendu ${attendu})`);
          }
        }
      }
    }

    if (problems.length === 0) {
      ok++;
      logger.info(
        {
          eleve: record.key,
          departement: found?.organismeFormation?.departement,
          source: found?.source,
          ine: found?.apprenant?.ine ?? null,
          contrat: found?.contrats ?? null,
          etablissement: found?.organismeFormation?.denomination,
        },
        "✅ OK"
      );
    } else {
      failures.push(`${record.key}: ${problems.join(", ")}`);
      logger.error({ eleve: record.key, problems }, "❌ ÉCART");
    }
  }

  logger.info(
    { ok, total: records.length, maj, failures },
    failures.length === 0
      ? "✅ Vérification SIPA : tous les élèves ressortent correctement"
      : "❌ Vérification SIPA : écarts détectés"
  );
}

interface Options {
  cleanup?: boolean;
  verify?: boolean;
  dryRun?: boolean;
  maj?: boolean;
}

export async function seedSipaTestNancy({
  cleanup: cleanupOnly,
  verify: verifyOnly,
  dryRun = false,
  maj = false,
}: Options): Promise<number> {
  if (cleanupOnly) {
    await cleanup();
    return 0;
  }

  if (verifyOnly) {
    await verify(maj);
    return 0;
  }

  if (maj) {
    await applyMaj(dryRun);
  } else {
    // Insertion idempotente : purge des anciens enregistrements tagués avant réinsertion.
    if (!dryRun) {
      await cleanup();
    }
    await insertRecords(dryRun);
  }

  if (!dryRun) {
    try {
      await verify(maj);
    } catch (err) {
      logger.error({ err }, "Vérification SIPA échouée (non bloquant, le seed reste appliqué)");
    }
  }

  return 0;
}
