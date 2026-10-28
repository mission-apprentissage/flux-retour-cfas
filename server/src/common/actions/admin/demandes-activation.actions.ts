import * as Boom from "@hapi/boom";
import AdmZip from "adm-zip";
import { parse } from "csv-parse/sync";
import { format } from "date-fns";
import escapeStringRegexp from "escape-string-regexp";
import { addJob } from "job-processor";
import { ObjectId } from "mongodb";
import { NATURE_ORGANISME_DE_FORMATION } from "shared/constants";
import {
  BrancheDemandeActivation,
  estRenvoyable,
  IDemandeActivationCfa,
  MotifDemandeActivation,
  MOTIFS_LEVES_PAR_BRANCHE_FORCEE,
  refusAvecMail,
} from "shared/models/data/demandesActivationCfa.model";
import { IInvitation } from "shared/models/data/invitations.model";
import { IOrganisme } from "shared/models/data/organismes.model";
import { IUsersMigration } from "shared/models/data/usersMigration.model";
import {
  IBilanEnvoiDemandes,
  IBilanImportDemandes,
  IDemandeActivationLigne,
  IDemandesActivationResponse,
  IModificationDemandeActivation,
  VUES_DEMANDES_ACTIVATION,
  VueDemandeActivation,
} from "shared/models/routes/admin/demandes-activation.api";
import { normalize } from "shared/utils";
import { getActiveAnneesScolaires } from "shared/utils/anneeScolaire";
import { z } from "zod";

import {
  confirmMembre,
  getOrganisationOrganismeByOrganismeId,
  lienInscriptionCfa,
} from "@/common/actions/organisations.actions";
import { checkEligibilityForLoaded } from "@/common/actions/organismes/deca-cfa-eligibility";
import {
  activerDecaOrganisme,
  poserGardeActivationDeca,
  retirerGardeActivationDeca,
} from "@/common/actions/organismes/organismes.admin.actions";
import { adminUpdateUserRole, resendConfirmationEmail } from "@/common/actions/users.actions";
import parentLogger from "@/common/logger";
import {
  demandesActivationCfaDb,
  effectifsDb,
  effectifsDECADb,
  invitationsDb,
  organisationsDb,
  organismesDb,
  usersMigrationDb,
} from "@/common/model/collections";
import { sendTransactionalEmail } from "@/common/services/brevo/brevo";
import { generateKey } from "@/common/utils/cryptoUtils";
import config from "@/config";

const logger = parentLogger.child({ module: "demandes-activation" });

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
  | "branche_forcee"
  | "evalue_at"
>;

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
      .filter(
        (entree) =>
          !entree.isDirectory &&
          !entree.entryName.startsWith("__MACOSX/") &&
          !entree.name.startsWith("._") &&
          entree.entryName.toLowerCase().endsWith(".csv")
      );
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
    colonnes[colonne] = entetes.find((entete) => motsCles.some((motCle) => normalize(entete).includes(motCle)));
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

  const brancheForcee = branche_forcee === "activation" && compteDansOrganisation ? "compte_existant" : branche_forcee;
  if (brancheForcee === "refus") {
    motifs.add("refus_force");
  } else if (brancheForcee) {
    for (const motif of MOTIFS_LEVES_PAR_BRANCHE_FORCEE) motifs.delete(motif);
  }

  const branche: BrancheDemandeActivation =
    motifs.size > 0 ? "refus" : (brancheForcee ?? (compteDansOrganisation ? "compte_existant" : "activation"));

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
    branche_forcee: brancheForcee ?? null,
    evalue_at: new Date(),
  };
}

export async function importerDemandesActivation(
  fichier: { buffer: Buffer; originalname: string },
  source: string
): Promise<IBilanImportDemandes> {
  const lignes = lireLignes(extraireCsv(fichier));
  const colonnes = reconnaitreColonnes(Object.keys(lignes[0] ?? {}));
  const bilan: IBilanImportDemandes = { creees: 0, misesAJour: 0, fusionnees: 0, inchangees: 0, erreurs: 0 };

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
      const { matchedCount } = await demandesActivationCfaDb().updateOne(
        { _id: existante._id, updated_at: existante.updated_at },
        { $set: { ...provenance, ...evaluation, source, updated_at: maintenant } }
      );
      if (matchedCount === 1) bilan.misesAJour++;
      else bilan.inchangees++;
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
  demande.statut === "pret" || estRenvoyable(demande.statut) || refusEnvoye(demande);

export const estCochable = (demande: IDemandeActivationCfa) =>
  demande.statut === "pret"
    ? demande.branche !== "refus" || refusAvecMail(demande.motifs)
    : refusEnvoye(demande) && demande.branche !== "refus";

function vueDemande(demande: IDemandeActivationCfa): VueDemandeActivation {
  if (estRenvoyable(demande.statut)) return "echecs";
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

async function enregistrer(
  lue: IDemandeActivationCfa,
  modifiee: IDemandeActivationCfa
): Promise<IDemandeActivationCfa | null> {
  const { _id, ...champs } = modifiee;
  const { matchedCount } = await demandesActivationCfaDb().updateOne(
    { _id, updated_at: lue.updated_at },
    { $set: champs }
  );
  return matchedCount === 1 ? modifiee : null;
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
            nom: organisme.nom || organisme.enseigne || organisme.raison_sociale || null,
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
    const evaluee = aReevaluer(demande) ? await enregistrer(demande, await reevaluer(demande)) : demande;
    const affichee = evaluee ?? (await demandesActivationCfaDb().findOne({ _id: demande._id }));
    if (affichee) demandes.push(affichee);
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
  if (modification.branche_forcee && !branchesForcables(misAJour).includes(modification.branche_forcee)) {
    throw Boom.badRequest("Branche non permise pour cette demande");
  }
  if (modification.a_envoyer !== undefined) {
    if (modification.a_envoyer && !estCochable(misAJour)) {
      throw Boom.badRequest("Cette demande ne peut pas être envoyée");
    }
    misAJour = { ...misAJour, a_envoyer: modification.a_envoyer, updated_at: new Date() };
  }

  const enregistree = await enregistrer(demande, misAJour);
  if (!enregistree) {
    throw Boom.conflict("La demande a changé entre-temps : rechargez la page");
  }
  const [ligne] = await versLignes([enregistree]);
  return ligne;
}

export const DUREE_INVITATION_DEMANDE_MS = 14 * 24 * 3600 * 1000;

class EchecEnvoi extends Error {}

const MOTIFS_ECHEC_ACTIVATION = {
  non_eligible: "L'établissement n'est plus éligible à DECA",
  annule: "Activation DECA annulée par une désactivation",
} as const;

type Expediteur = { _id: ObjectId; email: string };

export const nomOrganisme = (organisme: Pick<IOrganisme, "nom" | "raison_sociale" | "enseigne"> | null | undefined) =>
  organisme?.nom || organisme?.enseigne || organisme?.raison_sociale || "votre établissement";

export async function envoyerEmailBrevo(
  templateId: number,
  destinataire: string,
  params: Record<string, unknown>,
  redirection: string | null | undefined
) {
  if (!templateId) {
    throw new EchecEnvoi("Template Brevo non configuré");
  }
  let reponse: unknown;
  try {
    reponse = await sendTransactionalEmail(destinataire, templateId, params, {
      redirectRecipientInNonProdTo: redirection ?? undefined,
    });
  } catch (err) {
    throw new EchecEnvoi(`Envoi Brevo impossible : ${(err as Error).message}`);
  }
  if (!reponse) {
    throw new EchecEnvoi("Envoi Brevo en échec");
  }
}

async function nomOrganismeDeLOrganisation(organisationId: ObjectId) {
  const organisation = await organisationsDb().findOne({ _id: organisationId });
  const organismeId = organisation?.type === "ORGANISME_FORMATION" ? organisation.organisme_id : null;
  const organisme = organismeId
    ? await organismesDb().findOne(
        { _id: new ObjectId(organismeId) },
        { projection: { nom: 1, raison_sociale: 1, enseigne: 1 } }
      )
    : null;
  return nomOrganisme(organisme);
}

async function inviterAdminDemande({
  email,
  organisationId,
  auteurId,
  demandeId,
}: {
  email: string;
  organisationId: ObjectId;
  auteurId: ObjectId;
  demandeId: ObjectId;
}): Promise<IInvitation> {
  const expires_at = new Date(Date.now() + DUREE_INVITATION_DEMANDE_MS);
  const existante = await invitationsDb().findOne({ email, organisation_id: organisationId });
  if (existante) {
    const reprise = { role: "admin" as const, author_id: auteurId, demande_id: demandeId, expires_at };
    await invitationsDb().updateOne({ _id: existante._id }, { $set: reprise });
    return { ...existante, ...reprise };
  }
  const invitation: IInvitation = {
    _id: new ObjectId(),
    token: generateKey(50, "hex"),
    email,
    organisation_id: organisationId,
    author_id: auteurId,
    role: "admin",
    demande_id: demandeId,
    created_at: new Date(),
    expires_at,
  };
  await invitationsDb().insertOne(invitation);
  return invitation;
}

async function envoyerInvitationAdminDemande(
  invitation: Pick<IInvitation, "email" | "token" | "organisation_id">,
  expiresAt: Date,
  redirection: string | null | undefined
) {
  await envoyerEmailBrevo(
    config.brevo.templatesDemandesActivation.activationSansCompte,
    invitation.email,
    {
      NOM_CFA: await nomOrganismeDeLOrganisation(invitation.organisation_id),
      LIEN_INSCRIPTION: lienInscriptionCfa(invitation.token),
      DATE_EXPIRATION: format(expiresAt, "dd/MM/yyyy"),
    },
    redirection
  );
}

export async function renvoyerInvitationAdminDemande(invitation: IInvitation): Promise<Date> {
  const demande = invitation.demande_id
    ? await demandesActivationCfaDb().findOne({ _id: invitation.demande_id })
    : null;
  const expiresAt = new Date(Date.now() + DUREE_INVITATION_DEMANDE_MS);
  try {
    await envoyerInvitationAdminDemande(invitation, expiresAt, demande?.envoye_par_email);
  } catch (err) {
    throw err instanceof EchecEnvoi ? Boom.internal(err.message) : err;
  }
  await invitationsDb().updateOne({ _id: invitation._id }, { $set: { expires_at: expiresAt } });
  if (demande?.statut === "invitation_expiree") {
    await demandesActivationCfaDb().updateOne(
      { _id: demande._id, statut: "invitation_expiree" },
      { $set: { statut: "envoyee", envoyee_at: new Date(), updated_at: new Date() } }
    );
  }
  return expiresAt;
}

async function mettreEnCoursDEnvoi(demande: IDemandeActivationCfa, expediteur: Expediteur): Promise<boolean> {
  const maintenant = new Date();
  const { modifiedCount } = await demandesActivationCfaDb().updateOne(
    { _id: demande._id, statut: demande.statut, updated_at: demande.updated_at },
    {
      $set: {
        statut: "envoi_en_cours",
        a_envoyer: false,
        envoi_en_cours_at: maintenant,
        envoye_par_id: expediteur._id,
        envoye_par_email: expediteur.email,
        motif_echec: null,
        updated_at: maintenant,
      },
    }
  );
  return modifiedCount === 1;
}

async function planifierEnvois(demandes: IDemandeActivationCfa[]) {
  const organismes = new Set(demandes.map((demande) => demande.organisme_id?.toString() ?? null));
  for (const organismeId of organismes) {
    await addJob({ name: "demandes-activation:envoyer", payload: { organismeId }, queued: true });
  }
  return organismes.size;
}

export async function envoyerDemandesActivation(expediteur: Expediteur): Promise<IBilanEnvoiDemandes> {
  const cochees = await demandesActivationCfaDb()
    .find({ a_envoyer: true, statut: { $in: ["pret", "envoyee"] } })
    .toArray();
  const enCours: IDemandeActivationCfa[] = [];
  for (const demande of cochees) {
    const evaluee = await enregistrer(demande, await reevaluer(demande));
    if (evaluee?.a_envoyer && (await mettreEnCoursDEnvoi(evaluee, expediteur))) {
      enCours.push(evaluee);
    }
  }
  return { demandes: enCours.length, organismes: await planifierEnvois(enCours) };
}

export async function renvoyerDemandeActivation(id: ObjectId, expediteur: Expediteur) {
  const demande = await demandesActivationCfaDb().findOne({ _id: id });
  if (!demande) {
    throw Boom.notFound("Demande introuvable");
  }
  if (!estRenvoyable(demande.statut)) {
    throw Boom.badRequest("Seule une demande en échec ou dont l'invitation a expiré peut être renvoyée");
  }
  const evaluee = await enregistrer(demande, await reevaluer(demande));
  if (evaluee?.branche === "refus" && !refusAvecMail(evaluee.motifs)) {
    throw Boom.badRequest("Cette demande est refusée sans mail : corrigez-la avant de la renvoyer");
  }
  if (!evaluee || !(await mettreEnCoursDEnvoi(evaluee, expediteur))) {
    throw Boom.conflict("Un envoi est déjà en cours pour cette demande");
  }
  await planifierEnvois([evaluee]);
  const enCours = await demandesActivationCfaDb().findOne({ _id: id });
  const [ligne] = await versLignes(enCours ? [enCours] : []);
  return ligne;
}

async function activerPourEnvois(organismeId: ObjectId, ignorerEffectifs: boolean): Promise<string | null> {
  if (!(await poserGardeActivationDeca(organismeId))) {
    return "Activation DECA déjà en cours pour cet établissement : renvoyer plus tard";
  }
  try {
    const resultat = await activerDecaOrganisme(organismeId, { flecher: config.deca.flechageAuto, ignorerEffectifs });
    return resultat === "flag_pose" || resultat === "deja_actif" ? null : MOTIFS_ECHEC_ACTIVATION[resultat];
  } catch (err) {
    return `Activation DECA en échec : ${(err as Error).message}`;
  } finally {
    await retirerGardeActivationDeca(organismeId);
  }
}

type Organisation = NonNullable<Awaited<ReturnType<typeof getOrganisationOrganismeByOrganismeId>>>;

async function verifierInvariants(demande: IDemandeActivationCfa, organisation: Organisation | null) {
  if (!organisation) {
    throw new EchecEnvoi("Établissement introuvable");
  }
  const compte = await usersMigrationDb().findOne({ email: demande.email });
  if (compte && !compte.organisation_id.equals(organisation._id)) {
    throw new EchecEnvoi("Le demandeur a un compte rattaché à une autre organisation");
  }
  if (demande.branche === "compte_existant" && !compte) {
    throw new EchecEnvoi("Le compte du demandeur n'existe plus");
  }
  return compte;
}

function brancheEnvoyee(demande: IDemandeActivationCfa, compte: IUsersMigration | null): BrancheDemandeActivation {
  if (demande.branche === "refus") return "refus";
  return compte ? "compte_existant" : "activation";
}

function templateDeLEnvoi(demande: IDemandeActivationCfa, compte: IUsersMigration | null): number | null {
  const templates = config.brevo.templatesDemandesActivation;
  if (demande.branche === "refus") return templates.refus;
  if (!compte) return templates.activationSansCompte;
  return compte.account_status === "PENDING_EMAIL_VALIDATION" ? null : templates.activationAvecCompte;
}

async function traiterDemande(
  demande: IDemandeActivationCfa,
  organisme: Pick<IOrganisme, "_id" | "nom" | "raison_sociale" | "enseigne"> | null,
  organisation: Organisation | null,
  compte: IUsersMigration | null,
  etapes: NonNullable<IDemandeActivationCfa["etapes"]>
) {
  const templates = config.brevo.templatesDemandesActivation;
  const params = { NOM_CFA: nomOrganisme(organisme) };

  if (demande.branche === "refus") {
    if (!refusAvecMail(demande.motifs)) {
      throw new EchecEnvoi("Refus sans mail : rien n'est envoyé");
    }
    await envoyerEmailBrevo(
      templates.refus,
      demande.email,
      { ...params, EMAIL_CONTACT: demande.envoye_par_email ?? "" },
      demande.envoye_par_email
    );
  } else if (compte) {
    if (compte.organisation_role !== "admin") {
      await adminUpdateUserRole(compte._id.toString(), "admin");
    }
    if (compte.account_status === "PENDING_ADMIN_VALIDATION") {
      await confirmMembre(compte._id, { notifier: false });
    }
    etapes.compte_at = new Date();
    if (compte.account_status === "PENDING_EMAIL_VALIDATION") {
      await resendConfirmationEmail(compte._id);
    } else {
      await envoyerEmailBrevo(
        templates.activationAvecCompte,
        demande.email,
        { ...params, PRENOM: compte.prenom ?? "", LIEN_CONNEXION: `${config.publicUrl}/auth/connexion` },
        demande.envoye_par_email
      );
    }
  } else {
    if (!organisation || !demande.envoye_par_id) {
      throw new EchecEnvoi("Établissement ou expéditeur de l'envoi introuvable");
    }
    const invitation = await inviterAdminDemande({
      email: demande.email,
      organisationId: organisation._id,
      auteurId: demande.envoye_par_id,
      demandeId: demande._id,
    });
    etapes.invitation_at = new Date();
    await demandesActivationCfaDb().updateOne({ _id: demande._id }, { $set: { invitation_id: invitation._id } });
    await envoyerInvitationAdminDemande(invitation, invitation.expires_at ?? new Date(), demande.envoye_par_email);
  }
  etapes.email_at = new Date();
}

async function marquerEchec(
  demande: IDemandeActivationCfa,
  err: unknown,
  etapes: NonNullable<IDemandeActivationCfa["etapes"]>
) {
  if (!(err instanceof EchecEnvoi)) {
    logger.error({ err, demandeId: demande._id }, "Envoi d'une demande d'activation en échec");
  }
  await demandesActivationCfaDb().updateOne(
    { _id: demande._id, statut: "envoi_en_cours" },
    {
      $set: {
        statut: "echec",
        motif_echec: err instanceof EchecEnvoi ? err.message : `Erreur inattendue : ${(err as Error).message}`,
        etapes,
        updated_at: new Date(),
      },
    }
  );
}

export async function traiterEnvoisDemandesActivation(organismeId: ObjectId | null) {
  const demandes = await demandesActivationCfaDb()
    .find({ statut: "envoi_en_cours", organisme_id: organismeId })
    .toArray();
  if (demandes.length === 0) return;

  const organisme = organismeId
    ? await organismesDb().findOne({ _id: organismeId }, { projection: { nom: 1, raison_sociale: 1, enseigne: 1 } })
    : null;
  const organisation = organisme ? await getOrganisationOrganismeByOrganismeId(organisme._id) : null;

  const preparees: { demande: IDemandeActivationCfa; compte: IUsersMigration | null }[] = [];
  for (const demande of demandes) {
    try {
      const compte = demande.branche === "refus" ? null : await verifierInvariants(demande, organisation);
      if (templateDeLEnvoi(demande, compte) === 0) {
        throw new EchecEnvoi("Template Brevo non configuré");
      }
      preparees.push({ demande, compte });
    } catch (err) {
      await marquerEchec(demande, err, { ...demande.etapes });
    }
  }

  const activees = preparees.filter(({ demande }) => demande.branche !== "refus");
  const echecActivation =
    organismeId && activees.length > 0
      ? await activerPourEnvois(
          organismeId,
          activees.some(({ demande }) => !!demande.branche_forcee)
        )
      : null;

  for (const { demande, compte } of preparees) {
    const etapes = { ...demande.etapes };
    try {
      if (demande.branche !== "refus") {
        if (echecActivation) throw new EchecEnvoi(echecActivation);
        etapes.flag_at ??= new Date();
      }
      await traiterDemande(demande, organisme, organisation, compte, etapes);
      await demandesActivationCfaDb().updateOne(
        { _id: demande._id, statut: "envoi_en_cours" },
        {
          $set: {
            statut: "envoyee",
            branche: brancheEnvoyee(demande, compte),
            branche_envoyee: brancheEnvoyee(demande, compte),
            organisation_id: organisation?._id ?? demande.organisation_id ?? null,
            envoyee_at: new Date(),
            etapes,
            motif_echec: null,
            updated_at: new Date(),
          },
        }
      );
    } catch (err) {
      await marquerEchec(demande, err, etapes);
    }
  }
}
