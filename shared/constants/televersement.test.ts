import { describe, expect, it } from "vitest";

import { dossierApprenantSchemaV3WithMoreRequiredFieldsValidatingUAISiret } from "../models/parts/dossierApprenantSchemaV3";

import { CATALOGUE_CHAMPS_TELEVERSEMENT, ERREURS_TELEVERSEMENT } from "./televersement";

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

const schemaFichier = dossierApprenantSchemaV3WithMoreRequiredFieldsValidatingUAISiret([], []);

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
  });

  it("donnent le nombre de lignes et le maximum", () => {
    const message = ERREURS_TELEVERSEMENT.trop_de_lignes({ lignes: 5214, maximum: 5000 });
    expect(message).toMatch(
      /^Votre fichier contient 5\s214 apprenants\. Le maximum est 5\s000 : coupez-le en deux fichiers\.$/
    );
  });
});
