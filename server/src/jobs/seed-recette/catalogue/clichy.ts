import { addHours, addMinutes, addSeconds } from "date-fns";
import type { IMissionLocaleEffectif } from "shared/models";
import {
  ACC_CONJOINT_MOTIF_ENUM,
  CFA_RISQUE_RUPTURE_ENUM,
  CFA_SITUATION_TYPE_ENUM,
  CONNAISSANCE_ML_ENUM,
  RQTH_DECLARE_ENUM,
  SITUATION_ENUM,
} from "shared/models/data/missionLocaleEffectif.model";
import {
  type IMissionLocaleEffectifLog,
  MISSION_LOCALE_LOG_EVENT,
} from "shared/models/data/missionLocaleEffectifLog.model";
import { CFA_COLLAB_STATUS } from "shared/models/routes/organismes/cfa/cfa.api";

import {
  buildDossierMl,
  buildEffectifDeca,
  buildEffectifErp,
  buildLog,
  dateDeNaissanceLibre,
  jour,
  type SeedContext,
  type SeedEffectifInput,
  type SeedPersonne,
  telephoneFictif,
} from "../factories";
import { email } from "../identites";

import {
  type CategorieClichy,
  COMMUNES_CLICHY,
  EMPLOYEURS_CLICHY,
  FORMATIONS_CLICHY,
  JEUNES_CLICHY,
  type JeuneClichy,
  RUES_CLICHY,
} from "./clichy-jeunes";
import { collaborer, type CollaborationCfa } from "./helpers";
import type { AttenduCfa, AttenduMl, SeedCase, SeedDocs } from "./types";
import { COMPTES, userId } from "./utilisateurs";
import { contact, reponse, score } from "./whatsapp";

const N_CLICHY = 1000;
const logN = (n: number) => n * 10;

interface Categorie {
  titre: string;
  attendu: Omit<AttenduMl, "ml">;
  suiviAftral?: Pick<AttenduCfa, "collabStatus" | "suivi">;
  collaboration?: Omit<CollaborationCfa, "par" | "complement"> & { note?: string; jourCreation?: number };
}

const A_TRAITER = "a_traiter_ou_recontacter";

const CATEGORIES: Record<CategorieClichy, Categorie> = {
  mineur: {
    titre: "Jeune mineur, prioritaire",
    attendu: { liste: A_TRAITER, dansPrioritaires: true, indicateurs: { mineur: true } },
  },
  rqth: {
    titre: "Jeune RQTH, prioritaire",
    attendu: { liste: A_TRAITER, dansPrioritaires: true, indicateurs: { a_traiter: true } },
  },
  confirme: {
    titre: "A confirmé vouloir être contacté (visible sur la fiche)",
    attendu: { liste: A_TRAITER, indicateurs: { a_traiter: true, prioritaire: false } },
  },
  rdv_whatsapp: {
    titre: "A demandé un RDV en réponse au WhatsApp de préqualification",
    attendu: { liste: A_TRAITER, dansPrioritaires: true, indicateurs: { souhaite_rdv: true } },
  },
  rappel_whatsapp: {
    titre: "Injoignable, a demandé à être rappelé par WhatsApp",
    attendu: { liste: A_TRAITER, indicateurs: { injoignable: true } },
  },
  collab_rupture: {
    titre: "Collaboration AFTRAL après rupture",
    attendu: { liste: A_TRAITER, dansPrioritaires: true, dansCollaborations: true },
    suiviAftral: { collabStatus: CFA_COLLAB_STATUS.COLLAB_DEMANDEE, suivi: "collab" },
    collaboration: {
      jour: -6,
      situationType: CFA_SITUATION_TYPE_ENUM.RUPTURE_OU_SORTIE,
      motifs: [ACC_CONJOINT_MOTIF_ENUM.MOBILITE, ACC_CONJOINT_MOTIF_ENUM.LOGEMENT],
      commentaires:
        "Rupture à l'initiative de l'employeur. La jeune est motivée mais n'a plus de solution de transport ni de logement stable.",
      causeRupture: "Retards répétés liés à l'éloignement du lieu de travail, fin de période d'essai.",
      note: "Disponible pour un point téléphonique le mardi ou le jeudi après-midi.",
      toujoursAuCfa: true,
    },
  },
  collab_en_contrat: {
    titre: "Collaboration AFTRAL, encore en contrat, risque très élevé",
    attendu: {
      liste: A_TRAITER,
      dansPrioritaires: true,
      dansCollaborations: true,
      indicateurs: { situation_dossier: "PREVENTION_RUPTURE" },
    },
    suiviAftral: { collabStatus: CFA_COLLAB_STATUS.COLLAB_DEMANDEE, suivi: "collab" },
    collaboration: {
      jour: -4,
      jourCreation: -4,
      situationType: CFA_SITUATION_TYPE_ENUM.EN_CONTRAT,
      risque: CFA_RISQUE_RUPTURE_ENUM.TRES_ELEVE,
      motifs: [ACC_CONJOINT_MOTIF_ENUM.SANTE, ACC_CONJOINT_MOTIF_ENUM.FINANCE],
      commentaires:
        "Encore en contrat mais absences répétées depuis un mois. L'employeur envisage une rupture d'ici la fin du mois.",
      note: "Le jeune est d'accord pour être contacté par la Mission Locale.",
      toujoursAuCfa: true,
    },
  },
  a_traiter: {
    titre: "Rupture à traiter",
    attendu: { liste: A_TRAITER, indicateurs: { a_traiter: true, prioritaire: false } },
  },
  contact_opportun: {
    titre: "Rupture à traiter, score de réponse élevé",
    attendu: { liste: A_TRAITER, indicateurs: { a_traiter: true, prioritaire: false } },
  },
  injoignable: {
    titre: "Contacté sans retour",
    attendu: { liste: A_TRAITER, indicateurs: { injoignable: true } },
  },
  injoignable_whatsapp: {
    titre: "Contacté sans retour, relance WhatsApp envoyée",
    attendu: { liste: A_TRAITER, indicateurs: { injoignable: true } },
  },
  pas_besoin_whatsapp: {
    titre: "Contacté sans retour, a répondu « pas besoin » au WhatsApp",
    attendu: { liste: A_TRAITER, indicateurs: { injoignable: true } },
  },
  traite: {
    titre: "Dossier traité",
    attendu: { liste: "traite" },
    suiviAftral: { collabStatus: CFA_COLLAB_STATUS.CONTACTE_PAR_ML_HORS_COLLAB, suivi: "hors_collab" },
  },
  traite_collab: {
    titre: "Collaboration AFTRAL traitée par la ML",
    attendu: { liste: "traite", dansCollaborations: true },
    suiviAftral: { collabStatus: CFA_COLLAB_STATUS.TRAITE_PAR_ML, suivi: "collab" },
    collaboration: {
      jour: -6,
      jourCreation: -9,
      situationType: CFA_SITUATION_TYPE_ENUM.RUPTURE_OU_SORTIE,
      motifs: [ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI],
      commentaires: "Bon élément, l'entreprise a fermé. Il cherche un nouvel employeur pour poursuivre son BTS.",
      causeRupture: "Liquidation judiciaire de l'entreprise.",
      toujoursAuCfa: true,
    },
  },
};

const enContrat = (jeune: JeuneClichy) => jeune.categorie === "collab_en_contrat";

function attenduAftral(jeune: JeuneClichy): AttenduCfa | undefined {
  if (jeune.cfa !== "CFA_AFTRAL") return undefined;
  return {
    cfa: "CFA_AFTRAL",
    ruptures: enContrat(jeune) ? null : jeune.joursDepuisRupture < 45 ? "moins_45j" : "plus_45j",
    ...(CATEGORIES[jeune.categorie].suiviAftral ?? { collabStatus: CFA_COLLAB_STATUS.DEMARRER_COLLAB, suivi: null }),
  };
}

function dateDeNaissance(ctx: SeedContext, jeune: JeuneClichy): Date {
  const { jour: jourNaissance, mois } = jeune.naissance;
  const annee = ctx.today.getUTCFullYear();
  const anniversairePasse = Date.UTC(annee, mois - 1, jourNaissance) <= ctx.today.getTime();
  return new Date(Date.UTC(annee - jeune.age - (anniversairePasse ? 0 : 1), mois - 1, jourNaissance));
}

function personneClichy(ctx: SeedContext, jeune: JeuneClichy, n: number): SeedPersonne {
  const prenom = jeune.deca ? jeune.prenom.toUpperCase() : jeune.prenom;
  const courriel = email(jeune.prenom, jeune.nom);
  return {
    nom: jeune.nom,
    prenom,
    date_de_naissance: dateDeNaissanceLibre(ctx, jeune.nom, prenom, dateDeNaissance(ctx, jeune)),
    sexe: jeune.sexe,
    telephone: telephoneFictif(n),
    courriel: jeune.deca ? courriel.toUpperCase() : courriel,
    rqth: jeune.rqth ?? false,
  };
}

function complementCollab(jeune: JeuneClichy, personne: SeedPersonne, note?: string) {
  const referent = COMPTES.CFA_AFTRAL_ADMIN;
  const { libelle_long } = FORMATIONS_CLICHY[jeune.formation];
  return {
    referent_coordonnees: `${referent.prenom} ${referent.nom} — ${referent.email} — 01 99 00 12 34`,
    ...(note ? { note_complementaire: note } : {}),
    verified_info: {
      telephone: personne.telephone,
      courriel: personne.courriel,
      formation_libelle: libelle_long,
      rqth_declare: jeune.rqth ? RQTH_DECLARE_ENUM.OUI : RQTH_DECLARE_ENUM.NON,
    },
  };
}

async function buildJeune(ctx: SeedContext, jeune: JeuneClichy, i: number): Promise<Partial<SeedDocs>> {
  const n = N_CLICHY + i;
  const { dureeMois, ...formation } = FORMATIONS_CLICHY[jeune.formation];
  const rupture = jour(ctx, -jeune.joursDepuisRupture);
  const debut = new Date(rupture);
  debut.setUTCMonth(debut.getUTCMonth() - jeune.moisDeContrat);
  const fin = new Date(debut.getTime() + Math.round(dureeMois * 30.4) * 86_400_000);
  const jourRecu = -jeune.joursDepuisRupture + 1 + (i % 3);
  const personne = personneClichy(ctx, jeune, n);

  const effectifInput: SeedEffectifInput = {
    n,
    cfa: jeune.cfa,
    ml: "ML_CLICHY",
    personne,
    commune: COMMUNES_CLICHY[jeune.commune],
    adresse: { numero: (i % 60) + 1, voie: RUES_CLICHY[i % RUES_CLICHY.length] },
    formation,
    parcours: {
      dateEntree: debut,
      dateFin: fin,
      contrats: [
        { debut, fin, ...(enContrat(jeune) ? {} : { rupture }), employeur: EMPLOYEURS_CLICHY[jeune.employeur] },
      ],
    },
  };
  const effectif = jeune.deca
    ? await buildEffectifDeca(ctx, effectifInput)
    : await buildEffectifErp(ctx, effectifInput);
  const { collaboration } = CATEGORIES[jeune.categorie];
  const jourCreation = collaboration?.jourCreation;
  const dossier: IMissionLocaleEffectif = buildDossierMl(ctx, {
    n,
    effectif,
    ml: "ML_CLICHY",
    cfa: jeune.cfa,
    createdAt: jourCreation !== undefined ? jour(ctx, jourCreation) : addSeconds(addHours(jour(ctx, jourRecu), 5), 36),
  });

  const logs: IMissionLocaleEffectifLog[] = [];
  const traiterLe = (jourTraitement: number) => {
    if (!jeune.situation) throw new Error(`Situation manquante pour ${jeune.prenom} ${jeune.nom}`);
    const at = addMinutes(addHours(jour(ctx, jourTraitement), 10 + (i % 6)), 15 + (i % 40));
    const connaissance_ml = jeune.connaissance_ml ?? CONNAISSANCE_ML_ENUM.NON_CONNU;
    const champs = {
      situation: jeune.situation,
      situation_autre: jeune.situation_autre ?? null,
      deja_connu: connaissance_ml !== CONNAISSANCE_ML_ENUM.NON_CONNU,
      connaissance_ml,
      commentaires: jeune.commentaires ?? "",
      probleme_type: jeune.probleme_type ?? null,
      probleme_detail: null,
    };
    Object.assign(dossier, champs, {
      date_traitement: at,
      date_derniere_action_ml: at,
      ...(jeune.situation === SITUATION_ENUM.CONTACTE_SANS_RETOUR ? { date_dernier_passage_a_recontacter: at } : {}),
      updated_at: at,
    });
    if (dossier.organisme_data?.acc_conjoint) {
      dossier.organisme_data.has_unread_notification = true;
    }
    logs.push(buildLog({ n: logN(n), dossierId: dossier._id, createdAt: at, created_by: ctx.auteurClichy, ...champs }));
  };
  const evenement = (at: Date, event: IMissionLocaleEffectifLog["event"]) =>
    logs.push(buildLog({ n: logN(n) + 5, dossierId: dossier._id, createdAt: at, event }));

  if (collaboration) {
    const { note, jourCreation: _jourCreation, ...collab } = collaboration;
    collaborer(ctx, dossier, {
      ...collab,
      par: userId("CFA_AFTRAL_ADMIN"),
      complement: complementCollab(jeune, personne, note),
    });
  }

  const destinataire = { prenom: jeune.prenom, ml: "ML_CLICHY" as const };
  switch (jeune.categorie) {
    case "mineur":
    case "rqth":
    case "a_traiter":
    case "collab_rupture":
    case "collab_en_contrat":
      break;
    case "confirme":
      dossier.effectif_choice = {
        confirmation: true,
        confirmation_created_at: addSeconds(addHours(jour(ctx, jourRecu + 2), 5), 36),
        confirmation_expired_at: addSeconds(addHours(jour(ctx, jourRecu + 32), 5), 36),
        telephone: personne.telephone,
      };
      break;
    case "contact_opportun":
      dossier.classification_reponse_appel = score(ctx, 0.82);
      break;
    case "rdv_whatsapp": {
      const jourEnvoi = jourRecu + 3;
      const repondu = addHours(jour(ctx, jourEnvoi), 18);
      Object.assign(dossier, {
        souhaite_rdv: true,
        souhaite_rdv_at: repondu,
        souhaite_rdv_source: "whatsapp_prequalif",
        whatsapp_contact: contact(
          ctx,
          n,
          { template: "prequalif", jour: jourEnvoi, message_status: "read", conversation_state: "user_responded" },
          {
            user_response: "prequalif_yes",
            user_response_at: repondu,
            user_response_raw: "Oui je veux bien un rendez-vous",
            auto_reply_sent: true,
            auto_reply_sent_at: repondu,
            messages_history: reponse(ctx, jourEnvoi, "Oui je veux bien un rendez-vous", "[Auto-reply prequalif_yes]"),
          },
          destinataire
        ),
      });
      evenement(repondu, MISSION_LOCALE_LOG_EVENT.WHATSAPP_PREQUALIF_YES);
      break;
    }
    case "rappel_whatsapp": {
      traiterLe(jourRecu + 5);
      const jourReponse = jourRecu + 8;
      const repondu = addHours(jour(ctx, jourReponse), 18);
      Object.assign(dossier, {
        whatsapp_callback_requested: true,
        whatsapp_callback_requested_at: repondu,
        whatsapp_contact: contact(
          ctx,
          n,
          {
            template: "injoignables",
            jour: jourRecu + 7,
            message_status: "read",
            conversation_state: "callback_requested",
          },
          {
            user_response: "callback",
            user_response_at: repondu,
            user_response_raw: "Oui rappelez-moi svp",
            auto_reply_sent: true,
            auto_reply_sent_at: repondu,
            messages_history: reponse(ctx, jourReponse, "Oui rappelez-moi svp", "[Auto-reply callback]"),
          },
          destinataire
        ),
      });
      evenement(repondu, MISSION_LOCALE_LOG_EVENT.WHATSAPP_YES_HELP);
      break;
    }
    case "injoignable":
      traiterLe(jourRecu + 4);
      break;
    case "injoignable_whatsapp":
      traiterLe(jourRecu + 3);
      dossier.whatsapp_contact = contact(
        ctx,
        n,
        {
          template: "injoignables",
          jour: jourRecu + 5,
          message_status: "delivered",
          conversation_state: "initial_sent",
        },
        {},
        destinataire
      );
      break;
    case "pas_besoin_whatsapp": {
      traiterLe(jourRecu + 3);
      const jourEnvoi = jourRecu + 5;
      const repondu = addHours(jour(ctx, jourEnvoi), 18);
      Object.assign(dossier, {
        whatsapp_no_help_responded: true,
        whatsapp_no_help_responded_at: repondu,
        whatsapp_contact: contact(
          ctx,
          n,
          { template: "injoignables", jour: jourEnvoi, message_status: "read", conversation_state: "closed" },
          {
            user_response: "no_help",
            user_response_at: repondu,
            user_response_raw: "Non merci ça va",
            auto_reply_sent: true,
            auto_reply_sent_at: repondu,
            messages_history: reponse(ctx, jourEnvoi, "Non merci ça va", "[Auto-reply no_help]"),
          },
          destinataire
        ),
      });
      evenement(repondu, MISSION_LOCALE_LOG_EVENT.WHATSAPP_NO_HELP);
      break;
    }
    case "traite":
      traiterLe(jourRecu + 2 + (i % 6));
      break;
    case "traite_collab":
      traiterLe(jourRecu + 3);
      break;
  }

  return { dossiers: [dossier], logs };
}

export const CLICHY_CASES: SeedCase[] = JEUNES_CLICHY.map((jeune, index) => {
  const i = index + 1;
  return {
    n: N_CLICHY + i,
    code: `Z${String(i).padStart(2, "0")} CLICHY`,
    titre: CATEGORIES[jeune.categorie].titre,
    identite: { prenom: jeune.prenom, nom: jeune.nom },
    ...(jeune.deca ? { source: "DECA" as const } : {}),
    attendu: { ml: { ml: "ML_CLICHY", ...CATEGORIES[jeune.categorie].attendu }, cfa: attenduAftral(jeune) },
    build: (ctx) => buildJeune(ctx, jeune, i),
  };
});
