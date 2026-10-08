import { randomUUID } from "node:crypto";

import { addHours } from "date-fns";
import type { IMissionLocaleEffectif } from "shared/models";
import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import { MISSION_LOCALE_LOG_EVENT } from "shared/models/data/missionLocaleEffectifLog.model";
import type { IWhatsAppContact, IWhatsAppMessageHistory } from "shared/models/data/whatsappContact.model";

import {
  buildCallbackMessage,
  buildNoHelpMessage,
  buildPrequalifNoMessage,
  buildPrequalifYesWithUrlInlineMessage,
  buildStopConfirmationMessage,
} from "@/common/services/brevo/whatsapp/messages";

import { buildLog, jour, type SeedContext, telephoneFictif } from "../factories";
import type { MlHostCode } from "../hosts";
import { identite } from "../identites";

import { rupture, traiter } from "./helpers";
import type { SeedCase } from "./types";
import { userId } from "./utilisateurs";

const MODELE_CLASSIFIER = "2026-03-16";
const RDV_REDIRECT_URL = "https://rdv.seed.recette.invalid/ml-a";

const logN = (n: number) => n * 10;
const telephone = (n: number) => `+33${telephoneFictif(n).slice(1)}`;

type Envoi = Pick<IWhatsAppContact, "message_status" | "conversation_state"> & {
  template: "injoignables" | "prequalif";
  jour: number;
};

export function contact(
  ctx: SeedContext,
  n: number,
  envoi: Envoi,
  suite: Partial<IWhatsAppContact> = {},
  destinataire: { prenom: string; ml: MlHostCode } = { prenom: identite(n).prenom, ml: "ML_A" }
): IWhatsAppContact {
  const envoye = addHours(jour(ctx, envoi.jour), 10);
  const { prenom } = destinataire;
  const ml = ctx.missionsLocales[destinataire.ml].nom;
  const initial: IWhatsAppMessageHistory = {
    direction: "outbound",
    content:
      envoi.template === "injoignables"
        ? `[Template injoignables_recemment] prenom=${prenom}, mission_locale=${ml}`
        : `[Template prequalif_initial] prenom=${prenom}, mission_locale=${ml}`,
    sent_at: envoye,
    brevo_message_id: `seed-recette-${n}`,
  };

  return {
    phone_normalized: telephone(n),
    last_message_sent_at: envoye,
    message_id: `seed-recette-${n}`,
    message_status: envoi.message_status,
    status_updated_at: addHours(envoye, 1),
    conversation_state: envoi.conversation_state,
    template_type: envoi.template,
    sent_via: "daily",
    opted_out: false,
    auto_reply_sent: false,
    rdv_clicks: [],
    ...suite,
    messages_history: [initial, ...(suite.messages_history ?? [])],
  };
}

export function reponse(
  ctx: SeedContext,
  jourReponse: number,
  entrant: string,
  sortant: string
): IWhatsAppMessageHistory[] {
  const recu = addHours(jour(ctx, jourReponse), 18);
  return [
    { direction: "inbound", content: entrant, sent_at: recu },
    { direction: "outbound", content: sortant, sent_at: addHours(recu, 0.01), brevo_message_id: null },
  ];
}

const infoMl = (ctx: SeedContext) => ({ nom: ctx.missionsLocales.ML_A.nom });

type Classification = NonNullable<IMissionLocaleEffectif["classification_reponse_appel"]>;

export const score = (ctx: SeedContext, valeur: number): Classification => ({
  score: valeur,
  model: MODELE_CLASSIFIER,
  scored_at: jour(ctx, -4),
});

async function injoignable(ctx: SeedContext, n: number, jourContact = -4) {
  const r = await rupture(ctx, { n, cfa: "CFA_SANS", joursDepuisRupture: 70 });
  const logs = traiter(
    ctx,
    r.dossier,
    [
      {
        jour: jourContact,
        par: userId(n % 2 === 0 ? "ML_A_CONSEIL_1" : "ML_A_CONSEIL_2"),
        situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR,
        commentaires: "Pas de réponse, message vocal laissé.",
      },
    ],
    logN(n)
  );
  return { r, logs };
}

const envoiInjoignable = (
  n: number,
  code: string,
  titre: string,
  message_status: IWhatsAppContact["message_status"],
  conversation_state: IWhatsAppContact["conversation_state"]
): SeedCase => ({
  n,
  code,
  titre,
  attendu: { ml: { ml: "ML_A", liste: "a_traiter_ou_recontacter", indicateurs: { injoignable: true } } },
  build: async (ctx) => {
    const { r, logs } = await injoignable(ctx, n);
    r.dossier.whatsapp_contact = contact(ctx, n, {
      template: "injoignables",
      jour: -3,
      message_status,
      conversation_state,
    });
    return { ...r.docs, logs };
  },
});

export const WHATSAPP_CASES: SeedCase[] = [
  {
    n: 5,
    code: "A05 SOUHAITE UN RDV",
    titre: "A répondu oui au message de préqualification et a cliqué sur le lien de prise de RDV",
    attendu: {
      ml: {
        ml: "ML_A",
        liste: "a_traiter_ou_recontacter",
        dansPrioritaires: true,
        indicateurs: { a_traiter: true, souhaite_rdv: true },
      },
    },
    build: async (ctx) => {
      const r = await rupture(ctx, { n: 5, cfa: "CFA_SANS", joursDepuisRupture: 55 });
      const repondu = addHours(jour(ctx, -2), 18);
      Object.assign(r.dossier, {
        classification_reponse_appel: score(ctx, 0.86),
        souhaite_rdv: true,
        souhaite_rdv_at: repondu,
        souhaite_rdv_source: "whatsapp_prequalif",
        whatsapp_contact: contact(
          ctx,
          5,
          { template: "prequalif", jour: -3, message_status: "read", conversation_state: "closed" },
          {
            user_response: "prequalif_yes",
            user_response_at: repondu,
            user_response_raw: "Oui",
            prequalif_notif_sent_at: repondu,
            rdv_redirect_token: randomUUID(),
            rdv_redirect_token_created_at: repondu,
            rdv_clicks: [{ clicked_at: addHours(repondu, 1), redirect_url: RDV_REDIRECT_URL }],
            messages_history: reponse(
              ctx,
              -2,
              "Oui",
              buildPrequalifYesWithUrlInlineMessage(identite(5).prenom, infoMl(ctx), RDV_REDIRECT_URL)
            ),
          }
        ),
      });
      const log = buildLog({
        n: logN(5),
        dossierId: r.dossier._id,
        createdAt: repondu,
        situation: null,
        event: MISSION_LOCALE_LOG_EVENT.WHATSAPP_PREQUALIF_YES,
      });
      return { ...r.docs, logs: [log] };
    },
  },
  {
    n: 6,
    code: "A06 RAPPEL DEMANDE",
    titre: "A demandé à être rappelé en réponse au message WhatsApp",
    attendu: {
      ml: {
        ml: "ML_A",
        liste: "a_traiter_ou_recontacter",
        dansPrioritaires: true,
        indicateurs: { injoignable: true, souhaite_rdv: true },
      },
    },
    build: async (ctx) => {
      const { r, logs } = await injoignable(ctx, 6, -5);
      const repondu = addHours(jour(ctx, -1), 18);
      Object.assign(r.dossier, {
        date_dernier_passage_a_recontacter: repondu,
        whatsapp_callback_requested: true,
        whatsapp_callback_requested_at: repondu,
        souhaite_rdv: true,
        souhaite_rdv_at: repondu,
        souhaite_rdv_source: "whatsapp_callback",
        whatsapp_contact: contact(
          ctx,
          6,
          { template: "injoignables", jour: -4, message_status: "read", conversation_state: "callback_requested" },
          {
            user_response: "callback",
            user_response_at: repondu,
            user_response_raw: "Oui je veux bien être rappelé",
            messages_history: reponse(
              ctx,
              -1,
              "Oui je veux bien être rappelé",
              buildCallbackMessage(identite(6).prenom, infoMl(ctx))
            ),
          }
        ),
      });
      logs.push(
        buildLog({
          n: logN(6) + 5,
          dossierId: r.dossier._id,
          createdAt: repondu,
          situation: null,
          event: MISSION_LOCALE_LOG_EVENT.WHATSAPP_YES_HELP,
        })
      );
      return { ...r.docs, logs };
    },
  },
  {
    n: 7,
    code: "A07 CONTACT OPPORTUN",
    titre: "Score de réponse élevé (0,82) : bon moment pour appeler",
    attendu: { ml: { ml: "ML_A", liste: "a_traiter_ou_recontacter", indicateurs: { a_traiter: true } } },
    build: async (ctx) => {
      const r = await rupture(ctx, { n: 7, cfa: "CFA_SANS", joursDepuisRupture: 48 });
      r.dossier.classification_reponse_appel = score(ctx, 0.82);
      return r.docs;
    },
  },
  {
    n: 8,
    code: "A08 SCORE FAIBLE AVEC AVIS",
    titre: "Score de réponse faible (0,40), le conseiller a donné son avis sur l'indice",
    attendu: { ml: { ml: "ML_A", liste: "a_traiter_ou_recontacter", indicateurs: { a_traiter: true } } },
    build: async (ctx) => {
      const r = await rupture(ctx, { n: 8, cfa: "CFA_SANS", joursDepuisRupture: 52 });
      r.dossier.classification_reponse_appel = {
        ...score(ctx, 0.4),
        feedback: {
          meilleure_reactivite: false,
          confiance_indice: 3,
          utilite_indice: 4,
          responded_at: jour(ctx, -1),
          responded_by: userId("ML_A_CONSEIL_1"),
        },
      };
      return r.docs;
    },
  },
  envoiInjoignable(44, "H44 WHATSAPP ENVOYE", "Message WhatsApp envoyé, pas encore distribué", "sent", "initial_sent"),
  envoiInjoignable(45, "H45 WHATSAPP DISTRIBUE", "Message WhatsApp distribué", "delivered", "initial_sent"),
  envoiInjoignable(46, "H46 WHATSAPP LU", "Message WhatsApp lu, sans réponse", "read", "initial_sent"),
  envoiInjoignable(47, "H47 WHATSAPP ECHEC", "Échec d'envoi du message WhatsApp", "failed", "closed"),
  {
    n: 48,
    code: "H48 PAS BESOIN D AIDE",
    titre: "A répondu ne pas avoir besoin d'aide → dossier clos",
    attendu: { ml: { ml: "ML_A", liste: "traite" } },
    build: async (ctx) => {
      const { r, logs } = await injoignable(ctx, 48, -6);
      const repondu = addHours(jour(ctx, -3), 18);
      Object.assign(r.dossier, {
        situation: SITUATION_ENUM.NE_SOUHAITE_PAS_ETRE_RECONTACTE,
        date_traitement: repondu,
        whatsapp_no_help_responded: true,
        whatsapp_no_help_responded_at: repondu,
        whatsapp_contact: contact(
          ctx,
          48,
          { template: "injoignables", jour: -5, message_status: "read", conversation_state: "closed" },
          {
            user_response: "no_help",
            user_response_at: repondu,
            user_response_raw: "Non merci",
            messages_history: reponse(ctx, -3, "Non merci", buildNoHelpMessage(identite(48).prenom, infoMl(ctx))),
          }
        ),
      });
      logs.push(
        buildLog({
          n: logN(48) + 5,
          dossierId: r.dossier._id,
          createdAt: repondu,
          situation: SITUATION_ENUM.NE_SOUHAITE_PAS_ETRE_RECONTACTE,
          event: MISSION_LOCALE_LOG_EVENT.WHATSAPP_NO_HELP,
        })
      );
      return { ...r.docs, logs };
    },
  },
  {
    n: 49,
    code: "H49 STOP WHATSAPP",
    titre: "A répondu STOP : ne reçoit plus de messages",
    attendu: { ml: { ml: "ML_A", liste: "a_traiter_ou_recontacter", indicateurs: { injoignable: true } } },
    build: async (ctx) => {
      const { r, logs } = await injoignable(ctx, 49, -8);
      const repondu = addHours(jour(ctx, -6), 18);
      r.dossier.whatsapp_contact = contact(
        ctx,
        49,
        { template: "injoignables", jour: -7, message_status: "read", conversation_state: "closed" },
        {
          opted_out: true,
          opted_out_at: repondu,
          messages_history: reponse(ctx, -6, "STOP", buildStopConfirmationMessage()),
        }
      );
      return { ...r.docs, logs };
    },
  },
  {
    n: 50,
    code: "H50 PREQUALIF NON",
    titre: "A répondu non au message de préqualification → dossier clos",
    attendu: { ml: { ml: "ML_A", liste: "traite" } },
    build: async (ctx) => {
      const r = await rupture(ctx, { n: 50, cfa: "CFA_SANS", joursDepuisRupture: 58 });
      const repondu = addHours(jour(ctx, -4), 18);
      const ml = ctx.missionsLocales.ML_A;
      Object.assign(r.dossier, {
        classification_reponse_appel: score(ctx, 0.78),
        situation: SITUATION_ENUM.NE_SOUHAITE_PAS_ETRE_RECONTACTE,
        date_traitement: repondu,
        whatsapp_contact: contact(
          ctx,
          50,
          { template: "prequalif", jour: -5, message_status: "read", conversation_state: "closed" },
          {
            user_response: "prequalif_no",
            user_response_at: repondu,
            user_response_raw: "Non",
            messages_history: reponse(
              ctx,
              -4,
              "Non",
              buildPrequalifNoMessage(identite(50).prenom, { nom: ml.nom, email: ml.email ?? undefined })
            ),
          }
        ),
      });
      const log = buildLog({
        n: logN(50),
        dossierId: r.dossier._id,
        createdAt: repondu,
        situation: SITUATION_ENUM.NE_SOUHAITE_PAS_ETRE_RECONTACTE,
        event: MISSION_LOCALE_LOG_EVENT.WHATSAPP_PREQUALIF_NO,
      });
      return { ...r.docs, logs: [log] };
    },
  },
  {
    n: 51,
    code: "H51 PREQUALIF SANS REPONSE",
    titre: "Message de préqualification distribué, sans réponse",
    attendu: { ml: { ml: "ML_A", liste: "a_traiter_ou_recontacter", indicateurs: { a_traiter: true } } },
    build: async (ctx) => {
      const r = await rupture(ctx, { n: 51, cfa: "CFA_SANS", joursDepuisRupture: 47 });
      r.dossier.classification_reponse_appel = score(ctx, 0.79);
      r.dossier.whatsapp_contact = contact(ctx, 51, {
        template: "prequalif",
        jour: -1,
        message_status: "delivered",
        conversation_state: "initial_sent",
      });
      return r.docs;
    },
  },
];
