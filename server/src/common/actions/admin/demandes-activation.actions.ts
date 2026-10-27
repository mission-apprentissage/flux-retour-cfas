import * as Boom from "@hapi/boom";
import AdmZip from "adm-zip";
import { parse } from "csv-parse/sync";
import escapeStringRegexp from "escape-string-regexp";
import { ObjectId } from "mongodb";
import { NATURE_ORGANISME_DE_FORMATION } from "shared/constants";
import {
  BrancheDemandeActivation,
  IDemandeActivationCfa,
  MotifDemandeActivation,
  MOTIFS_DEMANDE_ACTIVATION,
  MOTIFS_LEVES_PAR_BRANCHE_FORCEE,
} from "shared/models/data/demandesActivationCfa.model";
import { IOrganisme } from "shared/models/data/organismes.model";
import {
  IDemandeActivationLigne,
  IDemandesActivationResponse,
  IModificationDemandeActivation,
  VUES_DEMANDES_ACTIVATION,
  VueDemandeActivation,
} from "shared/models/routes/admin/demandes-activation.api";
import { getActiveAnneesScolaires } from "shared/utils/anneeScolaire";
import { z } from "zod";

import { checkEligibilityForLoaded } from "@/common/actions/organismes/deca-cfa-eligibility";
import {
  demandesActivationCfaDb,
  effectifsDb,
  effectifsDECADb,
  organisationsDb,
  organismesDb,
  usersMigrationDb,
} from "@/common/model/collections";

export const TAILLE_MAX_IMPORT_DEMANDES = 1024 * 1024;

const MESSAGERIES_GRAND_PUBLIC = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.fr",
  "yahoo.com",
  "hotmail.fr",
  "hotmail.com",
  "outlook.fr",
  "outlook.com",
  "live.fr",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "aol.com",
  "orange.fr",
  "wanadoo.fr",
  "free.fr",
  "sfr.fr",
  "neuf.fr",
  "bbox.fr",
  "laposte.net",
  "gmx.fr",
  "protonmail.com",
  "proton.me",
]);

const COLONNES = {
  horodatage: ["horodat"],
  email: ["email", "mail"],
  siret: ["siret"],
  fonction: ["fonction"],
  commentaire: ["remarque", "question"],
} as const;

type Colonne = keyof typeof COLONNES;

const HORODATEUR = /^(\d{4})\/(\d{2})\/(\d{2}) (\d{1,2}):(\d{2}):(\d{2}) (AM|PM) UTC([+-]\d{1,2})$/;

const PROJECTION_ORGANISME = {
  _id: 1,
  siret: 1,
  uai: 1,
  nature: 1,
  ferme: 1,
  is_allowed_deca: 1,
  deca_activation_queued_at: 1,
  nom: 1,
  raison_sociale: 1,
  enseigne: 1,
} as const;

type OrganismeDemande = Pick<
  IOrganisme,
  | "_id"
  | "siret"
  | "uai"
  | "nature"
  | "ferme"
  | "is_allowed_deca"
  | "deca_activation_queued_at"
  | "nom"
  | "raison_sociale"
  | "enseigne"
>;

type ProvenanceDemande = Pick<
  IDemandeActivationCfa,
  "horodatage_brut" | "horodatage" | "email" | "fonction" | "siret_saisi_brut" | "siret_saisi" | "commentaire"
>;

type EvaluationDemande = Pick<
  IDemandeActivationCfa,
  | "siret"
  | "uai"
  | "siret_propose"
  | "organisme_id"
  | "organisation_id"
  | "user_id"
  | "effectifs_erp"
  | "effectifs_deca"
  | "motifs"
  | "domaine_inconnu"
  | "branche"
  | "evalue_at"
>;

export interface BilanImportDemandes {
  creees: number;
  misesAJour: number;
  fusionnees: number;
  inchangees: number;
  erreurs: number;
}

const sansAccents = (valeur: string) => valeur.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const texteOuNull = (valeur: string | undefined) => (valeur?.trim() ? valeur.trim() : null);

export const normaliserEmail = (valeur: string | undefined) => (valeur ?? "").toLowerCase().replace(/\s+/g, "");

export const normaliserSiret = (valeur: string | undefined) => (valeur ?? "").replace(/\D/g, "");

export function lireHorodatage(brut: string | null): Date | null {
  const morceaux = brut ? HORODATEUR.exec(brut.trim()) : null;
  if (!morceaux) return null;
  const [, annee, mois, jour, heure, minute, seconde, meridien, decalage] = morceaux;
  const heure24 = (Number(heure) % 12) + (meridien === "PM" ? 12 : 0);
  return new Date(
    Date.UTC(Number(annee), Number(mois) - 1, Number(jour), heure24 - Number(decalage), Number(minute), Number(seconde))
  );
}

function extraireCsv({ buffer, originalname }: { buffer: Buffer; originalname: string }): Buffer {
  const estArchive = originalname.toLowerCase().endsWith(".zip") || buffer.subarray(0, 2).toString() === "PK";
  if (!estArchive) return buffer;

  let csvs: AdmZip.IZipEntry[];
  try {
    csvs = new AdmZip(buffer)
      .getEntries()
      .filter((entree) => !entree.isDirectory && entree.entryName.toLowerCase().endsWith(".csv"));
  } catch {
    throw Boom.badRequest("Archive illisible");
  }
  if (csvs.length !== 1) {
    throw Boom.badRequest("L'archive doit contenir un seul fichier CSV");
  }
  if (csvs[0].header.size > TAILLE_MAX_IMPORT_DEMANDES) {
    throw Boom.badRequest("Fichier trop volumineux (1 Mo maximum)");
  }
  return csvs[0].getData();
}

function lireLignes(csv: Buffer): Record<string, string>[] {
  const premiereLigne = csv.toString("utf8").split(/\r?\n/, 1)[0];
  const delimiter = (premiereLigne.match(/;/g)?.length ?? 0) > (premiereLigne.match(/,/g)?.length ?? 0) ? ";" : ",";
  try {
    return parse<Record<string, string>>(csv, {
      bom: true,
      delimiter,
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
    });
  } catch (err) {
    throw Boom.badRequest(`Fichier CSV illisible : ${(err as Error).message}`);
  }
}

function reconnaitreColonnes(entetes: string[]): Partial<Record<Colonne, string>> {
  const colonnes: Partial<Record<Colonne, string>> = {};
  for (const [colonne, motsCles] of Object.entries(COLONNES) as [Colonne, readonly string[]][]) {
    colonnes[colonne] = entetes.find((entete) => motsCles.some((motCle) => sansAccents(entete).includes(motCle)));
  }
  if (!colonnes.email || !colonnes.siret) {
    throw Boom.badRequest(
      "Colonnes attendues : horodateur, adresse email, SIRET, fonction, remarques. Les colonnes email et SIRET sont obligatoires."
    );
  }
  return colonnes;
}

function lireProvenance(ligne: Record<string, string>, colonnes: Partial<Record<Colonne, string>>): ProvenanceDemande {
  const valeur = (colonne: Colonne) => {
    const entete = colonnes[colonne];
    return entete ? ligne[entete] : undefined;
  };
  const horodatageBrut = texteOuNull(valeur("horodatage"));
  return {
    horodatage_brut: horodatageBrut,
    horodatage: lireHorodatage(horodatageBrut),
    email: normaliserEmail(valeur("email")),
    fonction: texteOuNull(valeur("fonction")),
    siret_saisi_brut: (valeur("siret") ?? "").trim(),
    siret_saisi: normaliserSiret(valeur("siret")),
    commentaire: texteOuNull(valeur("commentaire")),
  };
}

async function compterEffectifs(organismeId: ObjectId) {
  const annees = getActiveAnneesScolaires(new Date());
  const [erp, deca] = await Promise.all([
    effectifsDb().countDocuments({ organisme_id: organismeId, annee_scolaire: { $in: annees } }),
    effectifsDECADb().countDocuments({ organisme_id: organismeId, annee_scolaire: { $in: annees } }),
  ]);
  return erp + deca;
}

async function choisirOrganisme(ouverts: OrganismeDemande[]): Promise<OrganismeDemande> {
  const avecUai = ouverts.filter((organisme) => organisme.uai);
  if (avecUai.length <= 1) return avecUai[0] ?? ouverts[0];
  const effectifs = await Promise.all(avecUai.map((organisme) => compterEffectifs(organisme._id)));
  return avecUai[effectifs.indexOf(Math.max(...effectifs))];
}

async function siretOuvertDeMemeUai(fermes: OrganismeDemande[]): Promise<string | null> {
  const uai = fermes.find((organisme) => organisme.uai)?.uai;
  if (!uai) return null;
  const ouvert = await organismesDb().findOne(
    { uai, ferme: { $ne: true }, siret: { $nin: fermes.map((organisme) => organisme.siret) } },
    { projection: { siret: 1 } }
  );
  return ouvert?.siret ?? null;
}

async function domaineConnu(domaine: string): Promise<boolean> {
  const fin = new RegExp(`@${escapeStringRegexp(domaine)}$`, "i");
  return (
    !!(await usersMigrationDb().findOne({ email: fin }, { projection: { _id: 1 } })) ||
    !!(await organismesDb().findOne({ "contacts_from_referentiel.email": fin }, { projection: { _id: 1 } }))
  );
}

export async function evaluerDemande({
  email,
  siret_saisi,
  siret_corrige,
  branche_forcee,
}: Pick<
  IDemandeActivationCfa,
  "email" | "siret_saisi" | "siret_corrige" | "branche_forcee"
>): Promise<EvaluationDemande> {
  const motifs = new Set<MotifDemandeActivation>();
  const siret = siret_corrige || siret_saisi;
  let organisme: OrganismeDemande | null = null;
  let siretPropose: string | null = null;
  let effectifs: { effectifsErpCount?: number; effectifsDecaCount?: number } | undefined;

  if (!/^\d{14}$/.test(siret)) {
    motifs.add("siret_mal_forme");
  } else {
    const candidats = await organismesDb().find({ siret }, { projection: PROJECTION_ORGANISME }).toArray();
    const ouverts = candidats.filter((candidat) => !candidat.ferme);
    if (candidats.length === 0) {
      motifs.add("siret_inconnu");
    } else if (ouverts.length === 0) {
      motifs.add("ferme");
      organisme = candidats[0];
      siretPropose = await siretOuvertDeMemeUai(candidats);
    } else {
      organisme = await choisirOrganisme(ouverts);
    }
  }

  if (organisme && !organisme.ferme) {
    const { checks } = await checkEligibilityForLoaded(organisme);
    if (!checks.exists_with_siret_uai.passed) {
      motifs.add("sans_uai");
    } else {
      if (!checks.nature.passed) {
        motifs.add(
          organisme.nature === NATURE_ORGANISME_DE_FORMATION.RESPONSABLE ? "responsable_pur" : "nature_inconnue"
        );
      }
      if (!checks.has_effectifs.passed) motifs.add("aucun_effectif");
      effectifs = checks.has_effectifs.details;
    }
  }

  const organisation = organisme
    ? await organisationsDb().findOne(
        { type: "ORGANISME_FORMATION", organisme_id: organisme._id.toString() },
        { projection: { _id: 1 } }
      )
    : null;

  const domaine = email.split("@")[1] ?? "";
  const emailValide = z.string().email().safeParse(email).success;
  if (!emailValide) {
    motifs.add("email_mal_forme");
  } else if (MESSAGERIES_GRAND_PUBLIC.has(domaine)) {
    motifs.add("messagerie_grand_public");
  }
  const domaineInconnu = emailValide && !MESSAGERIES_GRAND_PUBLIC.has(domaine) && !(await domaineConnu(domaine));

  const compte = email
    ? await usersMigrationDb().findOne({ email }, { projection: { _id: 1, organisation_id: 1 } })
    : null;
  const compteDansOrganisation =
    !!compte && !!organisation && compte.organisation_id?.equals(organisation._id) === true;
  if (compte && !compteDansOrganisation) motifs.add("compte_autre_organisation");

  if (branche_forcee === "refus") {
    motifs.add("refus_force");
  } else if (branche_forcee) {
    for (const motif of MOTIFS_LEVES_PAR_BRANCHE_FORCEE) motifs.delete(motif);
  }

  const branche: BrancheDemandeActivation =
    motifs.size > 0 ? "refus" : (branche_forcee ?? (compteDansOrganisation ? "compte_existant" : "activation"));

  return {
    siret: organisme?.siret ?? (siret || null),
    uai: organisme?.uai ?? null,
    siret_propose: siretPropose,
    organisme_id: organisme?._id ?? null,
    organisation_id: organisation?._id ?? null,
    user_id: compte?._id ?? null,
    effectifs_erp: effectifs?.effectifsErpCount ?? null,
    effectifs_deca: effectifs?.effectifsDecaCount ?? null,
    motifs: [...motifs],
    domaine_inconnu: domaineInconnu,
    branche,
    evalue_at: new Date(),
  };
}

export async function importerDemandesActivation(
  fichier: { buffer: Buffer; originalname: string },
  source: string
): Promise<BilanImportDemandes> {
  const lignes = lireLignes(extraireCsv(fichier));
  const colonnes = reconnaitreColonnes(Object.keys(lignes[0] ?? {}));
  const bilan: BilanImportDemandes = { creees: 0, misesAJour: 0, fusionnees: 0, inchangees: 0, erreurs: 0 };

  const parCle = new Map<string, ProvenanceDemande>();
  for (const ligne of lignes) {
    const provenance = lireProvenance(ligne, colonnes);
    if (!provenance.email && !provenance.siret_saisi) {
      bilan.erreurs++;
      continue;
    }
    const cle = `${provenance.email}|${provenance.siret_saisi}`;
    if (parCle.has(cle)) bilan.fusionnees++;
    parCle.set(cle, provenance);
  }

  for (const provenance of parCle.values()) {
    const maintenant = new Date();
    const existante = await demandesActivationCfaDb().findOne({
      email: provenance.email,
      siret_saisi: provenance.siret_saisi,
    });
    if (existante && (existante.statut === "envoi_en_cours" || existante.statut === "envoyee")) {
      bilan.inchangees++;
      continue;
    }

    const evaluation = await evaluerDemande({
      ...provenance,
      siret_corrige: existante?.siret_corrige,
      branche_forcee: existante?.branche_forcee,
    });
    if (existante) {
      await demandesActivationCfaDb().updateOne(
        { _id: existante._id },
        { $set: { ...provenance, ...evaluation, source, updated_at: maintenant } }
      );
      bilan.misesAJour++;
    } else {
      await demandesActivationCfaDb().insertOne({
        _id: new ObjectId(),
        ...provenance,
        ...evaluation,
        source,
        branche_initiale: evaluation.branche,
        a_envoyer: false,
        statut: "pret",
        created_at: maintenant,
        updated_at: maintenant,
      });
      bilan.creees++;
    }
  }

  return bilan;
}

const refusEnvoye = (demande: IDemandeActivationCfa) =>
  demande.statut === "envoyee" && demande.branche_envoyee === "refus";

const aReevaluer = (demande: IDemandeActivationCfa) =>
  demande.statut === "pret" ||
  demande.statut === "echec" ||
  demande.statut === "invitation_expiree" ||
  refusEnvoye(demande);

export const estCochable = (demande: IDemandeActivationCfa) =>
  (demande.statut === "pret" || refusEnvoye(demande)) &&
  (demande.branche !== "refus" || demande.motifs.every((motif) => MOTIFS_DEMANDE_ACTIVATION[motif].avecMail));

function vueDemande(demande: IDemandeActivationCfa): VueDemandeActivation {
  if (demande.statut === "echec" || demande.statut === "invitation_expiree") return "echecs";
  if (demande.statut === "envoi_en_cours") return "a_envoyer";
  const refuseeAvant =
    demande.statut === "envoyee" ? demande.branche_envoyee === "refus" : demande.branche_initiale === "refus";
  if (demande.branche === "refus") return "refus";
  if (refuseeAvant) return "devenus_eligibles";
  return demande.statut === "envoyee" ? "envoyees" : "a_envoyer";
}

function branchesForcables(demande: Pick<IDemandeActivationCfa, "user_id" | "motifs">): BrancheDemandeActivation[] {
  if (!demande.user_id) return ["activation", "refus"];
  return demande.motifs.includes("compte_autre_organisation") ? ["refus"] : ["compte_existant", "refus"];
}

async function reevaluer(demande: IDemandeActivationCfa, modifications: Partial<IDemandeActivationCfa> = {}) {
  const evaluee = { ...demande, ...modifications, ...(await evaluerDemande({ ...demande, ...modifications })) };
  return { ...evaluee, a_envoyer: evaluee.a_envoyer && estCochable(evaluee), updated_at: new Date() };
}

async function enregistrer(demande: IDemandeActivationCfa) {
  const { _id, ...champs } = demande;
  await demandesActivationCfaDb().updateOne({ _id }, { $set: champs });
  return demande;
}

async function versLignes(demandes: IDemandeActivationCfa[]): Promise<IDemandeActivationLigne[]> {
  const organismeIds = demandes.flatMap((demande) => (demande.organisme_id ? [demande.organisme_id] : []));
  const userIds = demandes.flatMap((demande) => (demande.user_id ? [demande.user_id] : []));
  const [organismes, comptes] = await Promise.all([
    organismesDb()
      .find({ _id: { $in: organismeIds } }, { projection: { nom: 1, raison_sociale: 1, enseigne: 1 } })
      .toArray(),
    usersMigrationDb()
      .find({ _id: { $in: userIds } }, { projection: { prenom: 1, nom: 1, account_status: 1 } })
      .toArray(),
  ]);
  const organismeParId = new Map(organismes.map((organisme) => [organisme._id.toString(), organisme]));
  const compteParId = new Map(comptes.map((compte) => [compte._id.toString(), compte]));

  return demandes.map((demande) => {
    const organisme = demande.organisme_id ? organismeParId.get(demande.organisme_id.toString()) : undefined;
    const compte = demande.user_id ? compteParId.get(demande.user_id.toString()) : undefined;
    return {
      _id: demande._id.toString(),
      source: demande.source,
      horodatage: demande.horodatage?.toISOString() ?? null,
      horodatage_brut: demande.horodatage_brut ?? null,
      email: demande.email,
      fonction: demande.fonction ?? null,
      commentaire: demande.commentaire ?? null,
      siret_saisi_brut: demande.siret_saisi_brut,
      siret_corrige: demande.siret_corrige ?? null,
      branche_forcee: demande.branche_forcee ?? null,
      siret: demande.siret ?? null,
      uai: demande.uai ?? null,
      siret_propose: demande.siret_propose ?? null,
      organisme: organisme
        ? {
            _id: organisme._id.toString(),
            nom: organisme.enseigne ?? organisme.raison_sociale ?? organisme.nom ?? null,
          }
        : null,
      compte: compte
        ? { prenom: compte.prenom ?? null, nom: compte.nom ?? null, account_status: compte.account_status }
        : null,
      effectifs_erp: demande.effectifs_erp ?? null,
      effectifs_deca: demande.effectifs_deca ?? null,
      motifs: demande.motifs,
      domaine_inconnu: demande.domaine_inconnu,
      branche: demande.branche,
      statut: demande.statut,
      motif_echec: demande.motif_echec ?? null,
      a_envoyer: demande.a_envoyer,
      vue: vueDemande(demande),
      cochable: estCochable(demande),
      branches_forcables: branchesForcables(demande),
    };
  });
}

export async function listerDemandesActivation(): Promise<IDemandesActivationResponse> {
  const demandes: IDemandeActivationCfa[] = [];
  for (const demande of await demandesActivationCfaDb().find({}).toArray()) {
    demandes.push(aReevaluer(demande) ? await enregistrer(await reevaluer(demande)) : demande);
  }

  const lignes = (await versLignes(demandes)).sort(
    (a, b) =>
      (a.organisme?.nom ?? a.siret ?? "").localeCompare(b.organisme?.nom ?? b.siret ?? "") ||
      a.email.localeCompare(b.email)
  );
  const compteParVue = Object.fromEntries(VUES_DEMANDES_ACTIVATION.map((vue) => [vue, 0])) as Record<
    VueDemandeActivation,
    number
  >;
  for (const ligne of lignes) compteParVue[ligne.vue]++;

  return { demandes: lignes, compteParVue };
}

export async function modifierDemandeActivation(
  id: ObjectId,
  modification: IModificationDemandeActivation
): Promise<IDemandeActivationLigne> {
  const demande = await demandesActivationCfaDb().findOne({ _id: id });
  if (!demande) {
    throw Boom.notFound("Demande introuvable");
  }
  if (demande.statut === "envoi_en_cours") {
    throw Boom.conflict("Envoi en cours : la demande ne peut pas être modifiée");
  }

  const modifications: Partial<IDemandeActivationCfa> = {};
  if (modification.siret_corrige !== undefined) {
    modifications.siret_corrige = normaliserSiret(modification.siret_corrige ?? "") || null;
  }
  if (modification.branche_forcee !== undefined) {
    modifications.branche_forcee = modification.branche_forcee;
  }

  let misAJour = Object.keys(modifications).length > 0 ? await reevaluer(demande, modifications) : demande;
  if (misAJour.branche_forcee && !branchesForcables(misAJour).includes(misAJour.branche_forcee)) {
    throw Boom.badRequest("Branche non permise pour cette demande");
  }
  if (modification.a_envoyer !== undefined) {
    if (modification.a_envoyer && !estCochable(misAJour)) {
      throw Boom.badRequest("Cette demande ne peut pas être envoyée");
    }
    misAJour = { ...misAJour, a_envoyer: modification.a_envoyer, updated_at: new Date() };
  }

  const [ligne] = await versLignes([await enregistrer(misAJour)]);
  return ligne;
}
