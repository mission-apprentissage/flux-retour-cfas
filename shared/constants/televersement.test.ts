import { describe, expect, it } from "vitest";

import { dossierApprenantSchemaFichier } from "../models/parts/dossierApprenantSchemaV3";

import {
  CATALOGUE_CHAMPS_TELEVERSEMENT,
  CHAMPS_TELEVERSEMENT_PAR_CLE,
  ERREURS_TELEVERSEMENT,
  normaliserEnTeteTeleversement,
} from "./televersement";

const OBLIGATOIRES_ANNEXE_F = [
  "nom_apprenant",
  "prenom_apprenant",
  "date_de_naissance_apprenant",
  "annee_scolaire",
  "date_inscription_formation",
  "date_entree_formation",
  "date_fin_formation",
  "etablissement_responsable_uai",
  "etablissement_responsable_siret",
  "etablissement_formateur_uai",
  "etablissement_formateur_siret",
];

const PAIRES_ANNEXE_F = [
  ["formation_rncp", "formation_cfd", "50022145"],
  ["code_postal_apprenant", "code_commune_insee_apprenant", "60057"],
  ["email_contact", "tel_apprenant", "0612345678"],
];

const ligneMinimale: Record<string, unknown> = {
  id_erp_apprenant: "identifiant",
  nom_apprenant: "Dupuis",
  prenom_apprenant: "Gaston",
  date_de_naissance_apprenant: "2006-03-15",
  annee_scolaire: "2026-2027",
  date_inscription_formation: "2026-09-01",
  date_entree_formation: "2026-09-01",
  date_fin_formation: "2028-06-30",
  etablissement_responsable_uai: "0600071B",
  etablissement_responsable_siret: "78050719000012",
  etablissement_formateur_uai: "0600071B",
  etablissement_formateur_siret: "78050719000012",
  formation_rncp: "RNCP12345",
  code_postal_apprenant: "60000",
  email_contact: "gaston.dupuis@domaine.fr",
};

const schemaFichier = dossierApprenantSchemaFichier;

const sans = (...cles: string[]) =>
  Object.fromEntries(Object.entries(ligneMinimale).filter(([cle]) => !cles.includes(cle)));

const cheminsEnErreur = (ligne: Record<string, unknown>) => {
  const resultat = schemaFichier.safeParse(ligne);
  return resultat.success ? [] : resultat.error.issues.map(({ path }) => path.join("."));
};

describe("catalogue des champs de l'import par fichier", () => {
  it("a une clé, un libellé et des alias uniques", () => {
    const cles = CATALOGUE_CHAMPS_TELEVERSEMENT.map(({ cle }) => cle);
    const enTetes = CATALOGUE_CHAMPS_TELEVERSEMENT.flatMap(({ libelle, alias }) => [libelle, ...alias]).map((enTete) =>
      enTete.toLowerCase()
    );

    expect(new Set(cles).size).toBe(cles.length);
    expect(new Set(enTetes).size).toBe(enTetes.length);
  });

  it("ne rattache aucun en-tête normalisé à deux champs", () => {
    const champsParEnTete = new Map<string, Set<string>>();
    CATALOGUE_CHAMPS_TELEVERSEMENT.forEach(({ cle, libelle, alias }) =>
      [cle, libelle, ...alias].forEach((enTete) => {
        const normalise = normaliserEnTeteTeleversement(enTete);
        champsParEnTete.set(normalise, new Set([...(champsParEnTete.get(normalise) ?? []), cle]));
      })
    );

    expect([...champsParEnTete].filter(([, cles]) => cles.size > 1)).toEqual([]);
  });

  it("normalise sans casse, accents, espaces, soulignés, astérisques ni petits mots", () => {
    expect(normaliserEnTeteTeleversement("Date de début de contrat *")).toBe("datedebutcontrat");
    expect(normaliserEnTeteTeleversement("date_debut_contrat")).toBe("datedebutcontrat");
    expect(normaliserEnTeteTeleversement("Date de fin de la formation")).toBe("datefinformation");
    expect(normaliserEnTeteTeleversement("Email de l’apprenant")).toBe("emailapprenant");
    expect(normaliserEnTeteTeleversement("Date d'entrée")).toBe("datedentree");
  });

  it("suit l'annexe F pour les obligations", () => {
    const obligatoires = CATALOGUE_CHAMPS_TELEVERSEMENT.filter(({ obligation }) => obligation === "obligatoire").map(
      ({ cle }) => cle
    );
    const paires = CATALOGUE_CHAMPS_TELEVERSEMENT.filter(({ obligation }) => obligation === "un_des_deux").map(
      ({ cle, avec }) => [cle, avec].sort().join("|")
    );

    expect(obligatoires.sort()).toEqual([...OBLIGATOIRES_ANNEXE_F].sort());
    expect(new Set(paires)).toEqual(
      new Set(PAIRES_ANNEXE_F.map(([premier, second]) => [premier, second].sort().join("|")))
    );
  });

  it("accepte une ligne qui ne porte que les champs obligatoires", () => {
    expect(cheminsEnErreur(ligneMinimale)).toEqual([]);
  });

  it.each(OBLIGATOIRES_ANNEXE_F)("refuse une ligne sans %s", (cle) => {
    expect(cheminsEnErreur(sans(cle))).toContain(cle);
  });

  it.each(PAIRES_ANNEXE_F)("exige %s ou %s, et se contente de l'un des deux", (premier, second, valeur) => {
    expect(cheminsEnErreur(sans(premier, second))).toEqual([premier]);
    expect(cheminsEnErreur({ ...sans(premier), [second]: valeur })).toEqual([]);
  });
});

describe("messages de l'import par fichier", () => {
  it("nomment l'organisme et l'établissement hors périmètre", () => {
    expect(ERREURS_TELEVERSEMENT.hors_perimetre({ uai: "0922455U", organisme: "CFA de test" })).toBe(
      "L'établissement 0922455U n'est pas rattaché à CFA de test. Ses apprenants ne peuvent pas être importés ici."
    );
  });

  it("disent combien de fois un apprenant revient dans le fichier", () => {
    expect(ERREURS_TELEVERSEMENT.doublon_fichier({ apprenant: "Camille Martin", lignes: [12, 48] })).toBe(
      "Camille Martin apparaît deux fois (lignes 12 et 48) pour la même année. Gardez une seule ligne."
    );
    expect(ERREURS_TELEVERSEMENT.doublon_fichier({ apprenant: "Camille Martin", lignes: [3, 7, 9] })).toBe(
      "Camille Martin apparaît 3 fois (lignes 3, 7 et 9) pour la même année. Gardez une seule ligne."
    );
  });

  it("donnent le nombre de lignes et le maximum", () => {
    const message = ERREURS_TELEVERSEMENT.trop_de_lignes({ lignes: 5214, maximum: 5000 });
    expect(message).toMatch(
      /^Votre fichier contient 5\s214 apprenants\. Le maximum est 5\s000 : coupez-le en deux fichiers\.$/
    );
  });
});

const messagesEnErreur = (ligne: Record<string, unknown>) => {
  const resultat = schemaFichier.safeParse(ligne);
  return resultat.success ? [] : resultat.error.issues.map(({ path, message }) => [path.join("."), message]);
};

describe("contrôles du schéma fichier", () => {
  it("refuse une fin de formation avant l'entrée", () => {
    expect(messagesEnErreur({ ...ligneMinimale, date_fin_formation: "2026-01-01" })).toEqual([
      ["date_fin_formation", "La fin de formation (01/01/2026) est avant l'entrée en formation (01/09/2026)."],
    ]);
  });

  it("refuse un contrat sans date de début, pour chacun des quatre contrats", () => {
    expect(
      messagesEnErreur({ ...ligneMinimale, contrat_date_rupture: "2026-12-01", cause_rupture_contrat_3: "Démission" })
    ).toEqual([
      ["contrat_date_debut", ERREURS_TELEVERSEMENT.contrat_incomplet()],
      ["contrat_date_debut_3", ERREURS_TELEVERSEMENT.contrat_incomplet()],
    ]);
  });

  it.each([
    ["siret_employeur", "1234"],
    ["duree_theorique_formation_mois", "60"],
    ["code_postal_de_naissance_apprenant", "Paris"],
  ])("signale %s mal formé au lieu de le vider", (cle, valeur) => {
    const [[chemin, message]] = messagesEnErreur({ ...ligneMinimale, [cle]: valeur });
    expect(chemin).toBe(cle);
    expect(message).toContain(`valeur mal formée (${valeur})`);
  });

  it("accepte un SIRET employeur écrit avec des espaces", () => {
    expect(messagesEnErreur({ ...ligneMinimale, siret_employeur: "780 507 190 00012" })).toEqual([]);
  });
});

const EN_TETES_ANCIEN_MODELE = [
  "nom_apprenant *",
  "prenom_apprenant *",
  "date_de_naissance_apprenant *",
  "sexe_apprenant *",
  "code_postal_de_naissance_apprenant",
  "email_contact *",
  "adresse_apprenant *",
  "code_postal_apprenant *",
  "ine_apprenant",
  "tel_apprenant",
  "rqth_apprenant",
  "date_rqth_apprenant",
  "responsable_apprenant_mail1",
  "responsable_apprenant_mail2",
  "dernier_organisme_uai",
  "derniere_situation",
  "type_cfa",
  "etablissement_responsable_uai *",
  "etablissement_responsable_siret *",
  "etablissement_formateur_uai *",
  "etablissement_formateur_siret *",
  "etablissement_lieu_de_formation_uai",
  "etablissement_lieu_de_formation_siret",
  "etablissement_lieu_de_formation_adresse",
  "etablissement_lieu_de_formation_code_postal",
  "annee_scolaire *",
  "annee_formation *",
  "formation_rncp *",
  "formation_cfd",
  "date_inscription_formation *",
  "date_entree_formation *",
  "date_fin_formation *",
  "duree_theorique_formation_mois *",
  "libelle_court_formation",
  "obtention_diplome_formation",
  "date_obtention_diplome_formation",
  "date_exclusion_formation **",
  "cause_exclusion_formation",
  "formation_presentielle",
  "nom_referent_handicap_formation",
  "prenom_referent_handicap_formation",
  "email_referent_handicap_formation",
  "contrat_date_debut **",
  "contrat_date_fin **",
  "siret_employeur **",
  "contrat_date_rupture **",
  "cause_rupture_contrat",
  "contrat_date_debut_2 **",
  "contrat_date_fin_2**",
  "siret_employeur_2 **",
  "contrat_date_rupture_2 **",
  "cause_rupture_contrat_2",
  "contrat_date_debut_3 **",
  "contrat_date_fin_3 **",
  "siret_employeur_3 **",
  "contrat_date_rupture_3 **",
  "cause_rupture_contrat_3",
  "contrat_date_debut_4 **",
  "contrat_date_fin_4 **",
  "siret_employeur_4 **",
  "contrat_date_rupture_4 **",
  "cause_rupture_contrat_4",
];

describe("ancien modèle Excel (modele-import-29012025.xlsx)", () => {
  it("n'a que des colonnes connues du catalogue", () => {
    const cles = EN_TETES_ANCIEN_MODELE.map((enTete) => enTete.replace(/\*/g, "").trim());

    expect(cles).toHaveLength(62);
    expect(cles.filter((cle) => !CHAMPS_TELEVERSEMENT_PAR_CLE[cle])).toEqual([]);
  });
});
