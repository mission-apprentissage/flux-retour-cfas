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

interface SeedRecord {
  key: string;
  kind: "CFA" | "DECA";
  uai: string;
  siret: string;
  expectedDepartement: string;
  apprenant: {
    nom: string;
    prenom: string;
    ine: string | null;
    date_de_naissance: string;
    sexe: "M" | "F";
    courriel: string;
    telephone: string;
  };
  formation: {
    cfd: string;
    rncp: string;
    libelle: string;
    date_inscription: string;
    date_entree: string;
    date_fin: string;
  };
  contrat: { date_debut: string; date_fin: string; date_rupture: string | null } | null;
}

const RECORDS: SeedRecord[] = [
  {
    key: "XOSMOA",
    kind: "CFA",
    uai: "0540081V",
    siret: "19540081700019",
    expectedDepartement: "54",
    apprenant: {
      nom: "XOSMOA",
      prenom: "Abdramane",
      ine: "120156231KE",
      date_de_naissance: "2010-10-12",
      sexe: "M",
      courriel: "Abdramaneemail_contact@domain.tld",
      telephone: "0628000000",
    },
    formation: {
      cfd: "50022141",
      rncp: "RNCP4637",
      libelle: "1CAP2  MAINT.VEHIC.OPT.VEHIC.LEGERS",
      date_inscription: "2026-09-02",
      date_entree: "2026-09-02",
      date_fin: "2027-08-31",
    },
    contrat: null, // inscription CFA sans contrat
  },
  {
    key: "DRIFNUDU",
    kind: "CFA",
    uai: "0550892W",
    siret: "78341511000015",
    expectedDepartement: "55",
    apprenant: {
      nom: "DRIFNUDU",
      prenom: "Oriane",
      ine: null, // contrat déclaré sans INE
      date_de_naissance: "2011-08-15",
      sexe: "M",
      courriel: "Orianeemail_contact@domain.tld",
      telephone: "0628000000",
    },
    formation: {
      cfd: "50022141",
      rncp: "RNCP4637",
      libelle: "1CAP2  MAINT.MATERIELS OPT.C ESP. VERTS",
      date_inscription: "2026-09-02",
      date_entree: "2026-09-02",
      date_fin: "2027-08-31",
    },
    contrat: { date_debut: "2026-09-01", date_fin: "2027-08-31", date_rupture: null },
  },
  {
    key: "FABBORI",
    kind: "CFA",
    uai: "0550861M",
    siret: "30019718300027",
    expectedDepartement: "55",
    apprenant: {
      nom: "FABBORI",
      prenom: "Mustapha",
      ine: "130187884JE",
      date_de_naissance: "2010-05-07",
      sexe: "M",
      courriel: "Mustaphaemail_contact@domain.tld",
      telephone: "0628000000",
    },
    formation: {
      cfd: "50022141",
      rncp: "RNCP4637",
      libelle: "1CAP2  BOULANGER",
      date_inscription: "2026-09-02",
      date_entree: "2026-09-02",
      date_fin: "2027-08-31",
    },
    contrat: { date_debut: "2026-09-01", date_fin: "2027-08-31", date_rupture: null },
  },
  {
    key: "GLARCINE",
    kind: "DECA",
    uai: "0881269B",
    siret: "78334702400086",
    expectedDepartement: "88",
    apprenant: {
      nom: "GLARCINE",
      prenom: "Safa",
      ine: null,
      date_de_naissance: "2011-12-09",
      sexe: "M",
      courriel: "Safa.bernard@example.com",
      telephone: "0690000000",
    },
    formation: {
      cfd: "40025503",
      rncp: "RNCP38596",
      libelle: "1CAP2  MACON",
      date_inscription: "2026-09-02",
      date_entree: "2026-09-02",
      date_fin: "2027-06-30",
    },
    contrat: { date_debut: "2026-09-01", date_fin: "2027-06-30", date_rupture: "2027-07-15" },
  },
  {
    key: "DRILGIPI",
    kind: "DECA",
    uai: "0550861M",
    siret: "30019718300027",
    expectedDepartement: "55",
    apprenant: {
      nom: "DRILGIPI",
      prenom: "Stephane",
      ine: null,
      date_de_naissance: "2010-08-06",
      sexe: "M",
      courriel: "Stephane.bernard@example.com",
      telephone: "0690000000",
    },
    formation: {
      cfd: "40025503",
      rncp: "RNCP38596",
      libelle: "1CAP2  MAINT.VEHIC.OPT.VEHIC.LEGERS",
      date_inscription: "2026-09-02",
      date_entree: "2026-09-02",
      date_fin: "2027-06-30",
    },
    contrat: { date_debut: "2026-09-01", date_fin: "2027-06-30", date_rupture: "2027-07-15" },
  },
];

const markerId = (key: string) => `${MARKER}_${key}`;

function buildApprenant(record: SeedRecord) {
  return {
    nom: record.apprenant.nom,
    prenom: record.apprenant.prenom,
    ine: record.apprenant.ine,
    date_de_naissance: d(record.apprenant.date_de_naissance),
    sexe: record.apprenant.sexe,
    courriel: record.apprenant.courriel,
    telephone: record.apprenant.telephone,
    has_nir: false,
    historique_statut: [],
  };
}

function buildFormation(record: SeedRecord) {
  return {
    cfd: record.formation.cfd,
    rncp: record.formation.rncp,
    libelle_long: record.formation.libelle,
    libelle_court: record.formation.libelle,
    niveau: NIVEAU,
    niveau_libelle: NIVEAU_LIBELLE,
    periode: [2026, 2027],
    date_inscription: d(record.formation.date_inscription),
    date_entree: d(record.formation.date_entree),
    date_fin: d(record.formation.date_fin),
  };
}

function buildContrats(record: SeedRecord) {
  if (!record.contrat) return [];
  return [
    {
      date_debut: d(record.contrat.date_debut),
      date_fin: d(record.contrat.date_fin),
      date_rupture: record.contrat.date_rupture ? d(record.contrat.date_rupture) : null,
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

async function insertRecords(dryRun: boolean): Promise<{ inserted: number; skipped: string[] }> {
  const now = new Date();
  const skipped: string[] = [];
  let inserted = 0;

  for (const record of RECORDS) {
    const organisme = await getOrganismeByUAIAndSIRET(record.uai, record.siret);
    if (!organisme) {
      logger.error(
        { key: record.key, uai: record.uai, siret: record.siret },
        "Organisme introuvable (UAI+SIRET) — skip"
      );
      skipped.push(record.key);
      continue;
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

    if (record.kind === "DECA") {
      const effectif = (await withComputedFields(
        { ...base, source: SOURCE_APPRENANT.DECA, deca_raw_id: new ObjectId() } as WithoutId<IEffectifDECA>,
        { organisme, certification: null }
      )) as WithoutId<IEffectifDECA>;
      if (!dryRun) await effectifsDECADb().insertOne({ ...effectif, _id: new ObjectId() });
    } else {
      const effectif = (await withComputedFields({ ...base, source: SOURCE_APPRENANT.ERP } as WithoutId<IEffectif>, {
        organisme,
        certification: null,
      })) as WithoutId<IEffectif>;
      if (!dryRun) await effectifsDb().insertOne({ ...effectif, _id: new ObjectId() });
    }

    inserted++;
    logger.info(
      {
        key: record.key,
        kind: record.kind,
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

// Récupère toutes les pages : dès que la rentrée 2026 sera transmise par les ERP, la fenêtre
// peut dépasser 1000 éléments et les élèves de test tomber au-delà de la page 1.
async function fetchAllSipaEffectifs(): Promise<{ totalElements: number; effectifs: any[] }> {
  const params = {
    dateMin: d(VERIF_DATE_MIN),
    dateMax: d(VERIF_DATE_MAX),
    departementsDb: VERIF_DEPARTEMENTS,
  };
  const first = await getSuiviSipaEffectifs({ ...params, page: 1 });
  const effectifs: any[] = [...first.effectifs];
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

async function verify(): Promise<void> {
  const { totalElements, effectifs } = await fetchAllSipaEffectifs();

  logger.info({ totalElements, departements: VERIF_DEPARTEMENTS }, "Vérification SIPA — résultat de l'agrégation");

  const byKey = new Map(
    effectifs.map((e: any) => [verifKey(e.apprenant?.nom, e.apprenant?.prenom, e.apprenant?.dateNaissance), e])
  );
  let ok = 0;
  const failures: string[] = [];

  for (const record of RECORDS) {
    const found: any = byKey.get(
      verifKey(record.apprenant.nom, record.apprenant.prenom, record.apprenant.date_de_naissance)
    );
    const expectedDept = record.expectedDepartement.padStart(3, "0");
    const expectedSource = record.kind;
    const problems: string[] = [];

    if (!found) {
      problems.push("absent du résultat SIPA");
    } else {
      if (found.organismeFormation?.departement !== expectedDept) {
        problems.push(`département ${found.organismeFormation?.departement} (attendu ${expectedDept})`);
      }
      if (found.source !== expectedSource) {
        problems.push(`source ${found.source} (attendu ${expectedSource})`);
      }
      const foundIne = found.apprenant?.ine ?? null;
      if (foundIne !== record.apprenant.ine) {
        problems.push(`INE ${foundIne ?? "absent"} (attendu ${record.apprenant.ine ?? "absent"})`);
      }
      const expectHasContrat = !!record.contrat;
      if (!!found.contrats !== expectHasContrat) {
        problems.push(
          `contrat ${found.contrats ? "présent" : "absent"} (attendu ${expectHasContrat ? "présent" : "absent"})`
        );
      }
    }

    if (problems.length === 0) {
      ok++;
      logger.info(
        {
          eleve: record.key,
          departement: found.organismeFormation?.departement,
          source: found.source,
          ine: found.apprenant?.ine ?? null,
          contrat: found.contrats ?? null,
          etablissement: found.organismeFormation?.denomination,
        },
        "✅ OK"
      );
    } else {
      failures.push(`${record.key}: ${problems.join(", ")}`);
      logger.error({ eleve: record.key, problems }, "❌ ÉCART");
    }
  }

  logger.info(
    { ok, total: RECORDS.length, failures },
    failures.length === 0
      ? "✅ Vérification SIPA : tous les élèves ressortent correctement"
      : "❌ Vérification SIPA : écarts détectés"
  );
}

interface Options {
  cleanup?: boolean;
  verify?: boolean;
  dryRun?: boolean;
}

export async function seedSipaTestNancy({
  cleanup: cleanupOnly,
  verify: verifyOnly,
  dryRun = false,
}: Options): Promise<number> {
  if (cleanupOnly) {
    await cleanup();
    return 0;
  }

  if (verifyOnly) {
    await verify();
    return 0;
  }

  // Insertion idempotente : purge des anciens enregistrements tagués avant réinsertion.
  if (!dryRun) {
    await cleanup();
  }
  await insertRecords(dryRun);

  if (!dryRun) {
    await verify();
  }

  return 0;
}
