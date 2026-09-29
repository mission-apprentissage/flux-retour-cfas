import { subDays, subYears } from "date-fns";
import {
  CONNAISSANCE_ML_ENUM,
  PROBLEME_TYPE_ENUM,
  SITUATION_ENUM,
} from "shared/models/data/missionLocaleEffectif.model";

import { jour, type SeedContext } from "../factories";

import { rupture, traiter, type EtapeMl } from "./helpers";
import type { SeedCase } from "./types";
import { userId } from "./utilisateurs";

const logN = (n: number) => n * 10;

async function ruptureTraitee(
  ctx: SeedContext,
  n: number,
  etapes: Omit<EtapeMl, "par">[],
  options: { ml?: "ML_A" | "ML_B"; joursDepuisRupture?: number } = {}
) {
  const r = await rupture(ctx, {
    n,
    cfa: "CFA_SANS",
    ml: options.ml,
    joursDepuisRupture: options.joursDepuisRupture ?? 75,
  });
  const par = options.ml === "ML_B" ? null : userId(n % 2 === 0 ? "ML_A_CONSEIL_1" : "ML_A_CONSEIL_2");
  const logs = traiter(
    ctx,
    r.dossier,
    etapes.map((e) => ({ ...e, par })),
    logN(n)
  );
  return { ...r.docs, logs };
}

const traite = (
  n: number,
  code: string,
  titre: string,
  etapes: Omit<EtapeMl, "par">[],
  options: { ml?: "ML_A" | "ML_B" } = {}
): SeedCase => ({
  n,
  code,
  titre,
  attendu: { ml: { ml: options.ml ?? "ML_A", liste: "traite", indicateurs: { a_traiter: false, injoignable: false } } },
  build: (ctx) => ruptureTraitee(ctx, n, etapes, options),
});

export const ML_CASES: SeedCase[] = [
  {
    n: 1,
    code: "A01 STANDARD",
    titre: "Rupture récente, CFA sans compte",
    attendu: {
      ml: { ml: "ML_A", liste: "a_traiter_ou_recontacter", indicateurs: { a_traiter: true, prioritaire: false } },
    },
    build: async (ctx) => (await rupture(ctx, { n: 1, cfa: "CFA_SANS" })).docs,
  },
  {
    n: 2,
    code: "A02 DECA",
    titre: "Rupture remontée par DECA (CFA sans DECA côté CFA)",
    attendu: { ml: { ml: "ML_A", liste: "a_traiter_ou_recontacter", indicateurs: { a_traiter: true } } },
    build: async (ctx) => (await rupture(ctx, { n: 2, cfa: "CFA_SANS", deca: true })).docs,
  },
  {
    n: 3,
    code: "A03 MINEUR",
    titre: "Jeune de 17 ans → prioritaire",
    attendu: {
      ml: {
        ml: "ML_A",
        liste: "a_traiter_ou_recontacter",
        dansPrioritaires: true,
        indicateurs: { a_traiter: true, mineur: true, prioritaire: true },
      },
    },
    build: async (ctx) => (await rupture(ctx, { n: 3, cfa: "CFA_SANS", age: 17 })).docs,
  },
  {
    n: 4,
    code: "A04 RQTH",
    titre: "Jeune de 28 ans avec RQTH → visible et prioritaire",
    attendu: {
      ml: {
        ml: "ML_A",
        liste: "a_traiter_ou_recontacter",
        dansPrioritaires: true,
        indicateurs: { a_traiter: true, prioritaire: true },
      },
    },
    build: async (ctx) => (await rupture(ctx, { n: 4, cfa: "CFA_SANS", age: 28, rqth: true })).docs,
  },
  {
    n: 9,
    code: "A09 A CONTACTER",
    titre: "Le jeune a confirmé vouloir être contacté (badge « à contacter »)",
    attendu: { ml: { ml: "ML_A", liste: "a_traiter_ou_recontacter", indicateurs: { a_traiter: true } } },
    build: async (ctx) =>
      (
        await rupture(ctx, {
          n: 9,
          cfa: "CFA_SANS",
          dossier: {
            effectif_choice: { confirmation: true, confirmation_created_at: jour(ctx, -2), telephone: "0639980009" },
          },
        })
      ).docs,
  },
  {
    n: 10,
    code: "A10 PLUS DE 180 J",
    titre: "Rupture il y a 200 jours, jeune passé en abandon → groupe « plus de 180 j »",
    attendu: { ml: { ml: "ML_A", liste: "a_traiter_ou_recontacter", indicateurs: { a_traiter: true } } },
    build: async (ctx) => (await rupture(ctx, { n: 10, cfa: "CFA_SANS", joursDepuisRupture: 200 })).docs,
  },
  {
    n: 11,
    code: "A11 NOUVEAU CONTRAT",
    titre: "Jeune reparti en contrat depuis la rupture → bandeau « nouveau contrat »",
    attendu: {
      ml: { ml: "ML_A", liste: "a_traiter_ou_recontacter", indicateurs: { a_traiter: true, nouveau_contrat: true } },
    },
    build: async (ctx) =>
      (
        await rupture(ctx, {
          n: 11,
          cfa: "CFA_SANS",
          parcours: {
            dateEntree: jour(ctx, -300),
            dateFin: jour(ctx, 400),
            contrats: [
              { debut: jour(ctx, -290), fin: jour(ctx, 400), rupture: jour(ctx, -60) },
              { debut: jour(ctx, -20), fin: jour(ctx, 400) },
            ],
          },
        })
      ).docs,
  },
  {
    n: 12,
    code: "B12 FIN DE FORMATION",
    titre: "À recontacter, formation terminée depuis",
    attendu: { ml: { ml: "ML_A", liste: "a_traiter_ou_recontacter", indicateurs: { injoignable: true } } },
    build: async (ctx) => {
      const r = await rupture(ctx, {
        n: 12,
        cfa: "CFA_SANS",
        parcours: {
          dateEntree: jour(ctx, -420),
          dateFin: jour(ctx, -10),
          contrats: [
            { debut: jour(ctx, -410), fin: jour(ctx, -10), rupture: jour(ctx, -120) },
            { debut: jour(ctx, -90), fin: jour(ctx, -10) },
          ],
        },
      });
      const logs = traiter(
        ctx,
        r.dossier,
        [{ jour: -5, par: userId("ML_A_CONSEIL_1"), situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR }],
        logN(12)
      );
      return { ...r.docs, logs };
    },
  },
  {
    n: 13,
    code: "B13 RECONTACTER",
    titre: "Contacté sans retour il y a 2 jours",
    attendu: {
      ml: {
        ml: "ML_A",
        liste: "a_traiter_ou_recontacter",
        indicateurs: { injoignable: true, relance_urgente: false },
      },
    },
    build: (ctx) =>
      ruptureTraitee(ctx, 13, [
        {
          jour: -2,
          situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR,
          commentaires: "Message laissé sur le répondeur",
        },
      ]),
  },
  {
    n: 14,
    code: "B14 RELANCE URGENTE",
    titre: "Contacté sans retour il y a 10 jours → « Relance urgente »",
    attendu: {
      ml: {
        ml: "ML_A",
        liste: "a_traiter_ou_recontacter",
        indicateurs: { injoignable: true, relance_urgente: true },
      },
    },
    build: (ctx) =>
      ruptureTraitee(ctx, 14, [
        { jour: -10, situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR, commentaires: "Pas de réponse au SMS" },
      ]),
  },
  traite(15, "C15 RDV PRIS", "Rendez-vous pris", [
    { jour: -20, situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR, commentaires: "Répondeur" },
    {
      jour: -8,
      situation: SITUATION_ENUM.RDV_PRIS,
      connaissance_ml: CONNAISSANCE_ML_ENUM.NON_CONNU,
      commentaires: "RDV fixé la semaine prochaine",
    },
  ]),
  traite(16, "C16 NOUVEAU PROJET", "Nouveau projet", [
    { jour: -12, situation: SITUATION_ENUM.NOUVEAU_PROJET, connaissance_ml: CONNAISSANCE_ML_ENUM.CONNU_NON_ACCOMPAGNE },
  ]),
  traite(17, "C17 DEJA ACCOMPAGNE", "Déjà accompagné par la ML", [
    {
      jour: -15,
      situation: SITUATION_ENUM.DEJA_ACCOMPAGNE,
      connaissance_ml: CONNAISSANCE_ML_ENUM.DEJA_ACCOMPAGNE_ACTIVEMENT,
    },
  ]),
  traite(18, "C18 COORDONNEES INCORRECTES", "Coordonnées incorrectes", [
    {
      jour: -9,
      situation: SITUATION_ENUM.COORDONNEES_INCORRECT,
      probleme_type: PROBLEME_TYPE_ENUM.COORDONNEES_INCORRECTES,
      probleme_detail: "Numéro non attribué",
    },
  ]),
  traite(19, "C19 INJOIGNABLE", "Injoignable après relances", [
    { jour: -40, situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR },
    { jour: -25, situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR, commentaires: "Deuxième relance" },
    { jour: -5, situation: SITUATION_ENUM.INJOIGNABLE_APRES_RELANCES },
  ]),
  traite(20, "C20 NOUVEAU CONTRAT", "A retrouvé un contrat (déclaré par la ML)", [
    { jour: -6, situation: SITUATION_ENUM.NOUVEAU_CONTRAT, connaissance_ml: CONNAISSANCE_ML_ENUM.NON_CONNU },
  ]),
  traite(21, "C21 NE SOUHAITE PAS", "Ne souhaite pas être recontacté", [
    { jour: -11, situation: SITUATION_ENUM.NE_SOUHAITE_PAS_ETRE_RECONTACTE },
  ]),
  traite(22, "C22 AUTRE", "Autre situation, précisée", [
    { jour: -7, situation: SITUATION_ENUM.AUTRE, situation_autre: "Déménagement hors du territoire" },
  ]),
  traite(23, "C23 CHERCHE CONTRAT", "Cherche un nouveau contrat", [
    {
      jour: -14,
      situation: SITUATION_ENUM.CHERCHE_CONTRAT,
      connaissance_ml: CONNAISSANCE_ML_ENUM.CONNU_NON_ACCOMPAGNE,
    },
  ]),
  traite(24, "C24 REORIENTATION", "Réorientation", [{ jour: -16, situation: SITUATION_ENUM.REORIENTATION }]),
  traite(25, "C25 NE VEUT PAS ACCOMPAGNEMENT", "Ne veut pas d'accompagnement", [
    { jour: -4, situation: SITUATION_ENUM.NE_VEUT_PAS_ACCOMPAGNEMENT, connaissance_ml: CONNAISSANCE_ML_ENUM.NON_CONNU },
  ]),
  {
    n: 54,
    code: "I54 ML B A TRAITER",
    titre: "ML non activée : dossier à traiter",
    attendu: { ml: { ml: "ML_B", liste: "a_traiter_ou_recontacter", indicateurs: { a_traiter: true } } },
    build: async (ctx) => (await rupture(ctx, { n: 54, cfa: "CFA_SANS", ml: "ML_B" })).docs,
  },
  traite(55, "I55 ML B TRAITE", "ML non activée : dossier traité", [{ jour: -3, situation: SITUATION_ENUM.RDV_PRIS }], {
    ml: "ML_B",
  }),
  {
    n: 56,
    code: "I56 ML B ANCIENNE",
    titre: "ML non activée : rupture ancienne, sans fenêtre d'activation",
    attendu: { ml: { ml: "ML_B", liste: "a_traiter_ou_recontacter", indicateurs: { a_traiter: true } } },
    build: async (ctx) => (await rupture(ctx, { n: 56, cfa: "CFA_SANS", ml: "ML_B", joursDepuisRupture: 300 })).docs,
  },
  {
    n: 63,
    code: "K63 PLUS DE 26 ANS",
    titre: "A eu 26 ans depuis la création du dossier, sans RQTH → absent",
    attendu: { ml: { ml: "ML_A", liste: null } },
    build: async (ctx) =>
      (
        await rupture(ctx, {
          n: 63,
          cfa: "CFA_SANS",
          dateDeNaissance: subDays(subYears(ctx.today, 26), 10),
        })
      ).docs,
  },
  {
    n: 64,
    code: "K64 MOINS DE 16 ANS",
    titre: "Jeune de 15 ans → absent",
    attendu: { ml: { ml: "ML_A", liste: null } },
    build: async (ctx) => (await rupture(ctx, { n: 64, cfa: "CFA_SANS", age: 15 })).docs,
  },
];
