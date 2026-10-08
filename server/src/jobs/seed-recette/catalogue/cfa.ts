import {
  ACC_CONJOINT_MOTIF_ENUM,
  CFA_RISQUE_RUPTURE_ENUM,
  CFA_SITUATION_TYPE_ENUM,
  CONNAISSANCE_ML_ENUM,
  RQTH_DECLARE_ENUM,
  SITUATION_ENUM,
} from "shared/models/data/missionLocaleEffectif.model";
import type { IMissionLocaleEffectifLog } from "shared/models/data/missionLocaleEffectifLog.model";
import { CFA_COLLAB_STATUS } from "shared/models/routes/organismes/cfa/cfa.api";

import {
  buildEffectifDeca,
  buildEffectifErp,
  buildPersonne,
  jour,
  type SeedContext,
  type SeedParcoursInput,
} from "../factories";
import { CFA_HOST_CODES_SANS_ACTIVITE, type CfaHostCode } from "../hosts";
import { email, identite } from "../identites";
import { seedId } from "../seed-ids";

import { collaborer, parcoursEnContrat, rupture, traiter, type CollaborationCfa, type RuptureInput } from "./helpers";
import type { SeedCase } from "./types";
import { type CodeCompte, userId } from "./utilisateurs";

const logN = (n: number) => n * 10;

interface ScenarioCfa {
  rupture: RuptureInput;
  collaboration?: Omit<CollaborationCfa, "par"> & {
    par?: CodeCompte;
  };
  declaration?: { jourRupture: number; jour: number };
  actionMl?: { jour: number; situation: SITUATION_ENUM };
}

const PAR_DEFAUT = {
  CFA_ON: "CFA_ON_ADMIN",
  CFA_SUSP: "CFA_SUSP_ADMIN",
  CFA_OFF: "CFA_OFF_ADMIN",
  CFA_SANS: "CFA_ON_ADMIN",
  CFA_DECA: "CFA_DECA_ADMIN",
} as const;

async function scenario(ctx: SeedContext, s: ScenarioCfa) {
  const r = await rupture(ctx, s.rupture);
  const logs: IMissionLocaleEffectifLog[] = [];

  if (s.collaboration) {
    const { par, ...collaboration } = s.collaboration;
    collaborer(ctx, r.dossier, { ...collaboration, par: userId(par ?? PAR_DEFAUT[s.rupture.cfa]) });
  }

  if (s.declaration) {
    const dateRupture = jour(ctx, s.declaration.jourRupture);
    r.dossier.cfa_rupture_declaration = {
      date_rupture: dateRupture,
      declared_at: jour(ctx, s.declaration.jour),
      declared_by: userId(PAR_DEFAUT[s.rupture.cfa]),
    };
    r.dossier.date_rupture = dateRupture;
    r.dossier.organisme_data = {
      has_unread_notification: false,
      rupture: true,
      reponse_at: jour(ctx, s.declaration.jour),
    };
  }

  if (s.actionMl) {
    logs.push(
      ...traiter(
        ctx,
        r.dossier,
        [
          {
            jour: s.actionMl.jour,
            par: userId("ML_A_CONSEIL_1"),
            situation: s.actionMl.situation,
            connaissance_ml: CONNAISSANCE_ML_ENUM.NON_CONNU,
          },
        ],
        logN(s.rupture.n)
      )
    );
  }

  return { ...r.docs, logs };
}

export const COLLAB_CASES: SeedCase[] = [
  {
    n: 26,
    code: "D26 COLLAB EN CONTRAT RISQUE FAIBLE",
    titre: "Collaboration sur un jeune encore en contrat, risque faible",
    attendu: {
      ml: {
        ml: "ML_A",
        liste: "a_traiter_ou_recontacter",
        dansPrioritaires: true,
        dansCollaborations: true,
        indicateurs: { a_traiter: true, nouveau_contrat: false, situation_dossier: "BESOIN_AIDE_HORS_RUPTURE" },
      },
      cfa: { cfa: "CFA_ON", ruptures: null, collabStatus: CFA_COLLAB_STATUS.COLLAB_DEMANDEE, suivi: "collab" },
    },
    build: (ctx) =>
      scenario(ctx, {
        rupture: { n: 26, cfa: "CFA_ON", parcours: parcoursEnContrat(ctx), createdAt: jour(ctx, -5) },
        collaboration: {
          jour: -5,
          situationType: CFA_SITUATION_TYPE_ENUM.EN_CONTRAT,
          risque: CFA_RISQUE_RUPTURE_ENUM.FAIBLE,
          motifs: [ACC_CONJOINT_MOTIF_ENUM.MOBILITE, ACC_CONJOINT_MOTIF_ENUM.LOGEMENT],
          commentaires: "Trajets longs depuis le domicile, cherche un logement plus proche de l'entreprise.",
        },
      }),
  },
  {
    n: 27,
    code: "D27 COLLAB EN CONTRAT RISQUE ELEVE",
    titre: "Collaboration sur un jeune encore en contrat, risque très élevé",
    attendu: {
      ml: {
        ml: "ML_A",
        liste: "a_traiter_ou_recontacter",
        dansPrioritaires: true,
        dansCollaborations: true,
        indicateurs: { a_traiter: true, situation_dossier: "PREVENTION_RUPTURE", relance_urgente: false },
      },
      cfa: { cfa: "CFA_ON", ruptures: null, collabStatus: CFA_COLLAB_STATUS.COLLAB_DEMANDEE, suivi: "collab" },
    },
    build: (ctx) =>
      scenario(ctx, {
        rupture: { n: 27, cfa: "CFA_ON", parcours: parcoursEnContrat(ctx), createdAt: jour(ctx, -5) },
        collaboration: {
          jour: -5,
          situationType: CFA_SITUATION_TYPE_ENUM.EN_CONTRAT,
          risque: CFA_RISQUE_RUPTURE_ENUM.TRES_ELEVE,
          motifs: [ACC_CONJOINT_MOTIF_ENUM.SOCIAL_FAMILIAL],
          commentaires: "Tensions avec le maître d'apprentissage, absences répétées ce mois-ci.",
        },
      }),
  },
  {
    n: 28,
    code: "D28 COLLAB RUPTURE TOUJOURS AU CFA",
    titre: "Collaboration après rupture, le jeune suit toujours sa formation",
    attendu: {
      ml: {
        ml: "ML_A",
        liste: "a_traiter_ou_recontacter",
        dansPrioritaires: true,
        dansCollaborations: true,
        indicateurs: { a_traiter: true, situation_dossier: "RUPTURE" },
      },
      cfa: { cfa: "CFA_ON", ruptures: "moins_45j", collabStatus: CFA_COLLAB_STATUS.COLLAB_DEMANDEE, suivi: "collab" },
    },
    build: (ctx) =>
      scenario(ctx, {
        rupture: { n: 28, cfa: "CFA_ON", joursDepuisRupture: 20 },
        collaboration: {
          jour: -3,
          situationType: CFA_SITUATION_TYPE_ENUM.RUPTURE_OU_SORTIE,
          toujoursAuCfa: true,
          jourRupture: -20,
          causeRupture: "Désaccord avec l'employeur sur les horaires de travail.",
          motifs: [ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI],
          commentaires: "Motivé pour retrouver une entreprise rapidement.",
        },
      }),
  },
  {
    n: 29,
    code: "D29 COLLAB SORTI DU CFA",
    titre: "Collaboration après rupture, le jeune a quitté le CFA",
    attendu: {
      ml: {
        ml: "ML_A",
        liste: "a_traiter_ou_recontacter",
        dansPrioritaires: true,
        dansCollaborations: true,
        indicateurs: { a_traiter: true, situation_dossier: "ABANDON", relance_urgente: true },
      },
      cfa: { cfa: "CFA_ON", ruptures: "moins_45j", collabStatus: CFA_COLLAB_STATUS.COLLAB_DEMANDEE, suivi: "collab" },
    },
    build: (ctx) =>
      scenario(ctx, {
        rupture: { n: 29, cfa: "CFA_ON", joursDepuisRupture: 30 },
        collaboration: {
          jour: -12,
          situationType: CFA_SITUATION_TYPE_ENUM.RUPTURE_OU_SORTIE,
          toujoursAuCfa: false,
          jourRupture: -30,
          jourAbandon: -15,
          causeRupture: "Rupture pendant la période d'essai.",
          motifs: [ACC_CONJOINT_MOTIF_ENUM.REORIENTATION],
          commentaires: "Souhaite se réorienter vers les métiers de la logistique.",
        },
      }),
  },
  {
    n: 30,
    code: "D30 COLLAB TRAITEE PAR LA ML",
    titre: "Collaboration traitée par la ML, notification non lue côté CFA",
    attendu: {
      ml: { ml: "ML_A", liste: "traite", dansCollaborations: true },
      cfa: { cfa: "CFA_ON", ruptures: "moins_45j", collabStatus: CFA_COLLAB_STATUS.TRAITE_PAR_ML, suivi: "collab" },
    },
    build: (ctx) =>
      scenario(ctx, {
        rupture: { n: 30, cfa: "CFA_ON", joursDepuisRupture: 40 },
        collaboration: {
          jour: -30,
          situationType: CFA_SITUATION_TYPE_ENUM.RUPTURE_OU_SORTIE,
          toujoursAuCfa: true,
          jourRupture: -40,
          causeRupture: "Liquidation judiciaire de l'entreprise.",
          motifs: [ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI, ACC_CONJOINT_MOTIF_ENUM.FINANCE],
          commentaires: "Plus de rémunération depuis la fermeture de l'entreprise.",
        },
        actionMl: { jour: -10, situation: SITUATION_ENUM.RDV_PRIS },
      }),
  },
  {
    n: 31,
    code: "D31 COLLAB A RECONTACTER",
    titre: "Collaboration contactée sans retour depuis 9 jours → relance urgente",
    attendu: {
      ml: {
        ml: "ML_A",
        liste: "a_traiter_ou_recontacter",
        dansPrioritaires: true,
        dansCollaborations: true,
        indicateurs: { injoignable: true, relance_urgente: true },
      },
      cfa: { cfa: "CFA_ON", ruptures: "moins_45j", collabStatus: CFA_COLLAB_STATUS.COLLAB_DEMANDEE, suivi: "collab" },
    },
    build: (ctx) =>
      scenario(ctx, {
        rupture: { n: 31, cfa: "CFA_ON", joursDepuisRupture: 35 },
        collaboration: {
          jour: -25,
          situationType: CFA_SITUATION_TYPE_ENUM.RUPTURE_OU_SORTIE,
          toujoursAuCfa: true,
          jourRupture: -35,
          causeRupture: "Accord commun entre le jeune et l'employeur.",
          motifs: [ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI],
          commentaires: "Joignable plutôt en fin de journée.",
        },
        actionMl: { jour: -9, situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR },
      }),
  },
  {
    n: 32,
    code: "D32 RUPTURE MOINS DE 45 J",
    titre: "Rupture récente non transmise : invisible côté ML, à démarrer côté CFA",
    attendu: {
      ml: { ml: "ML_A", liste: null },
      cfa: { cfa: "CFA_ON", ruptures: "moins_45j", collabStatus: CFA_COLLAB_STATUS.DEMARRER_COLLAB, suivi: null },
    },
    build: (ctx) => scenario(ctx, { rupture: { n: 32, cfa: "CFA_ON", joursDepuisRupture: 20 } }),
  },
  {
    n: 33,
    code: "D33 RUPTURE PLUS DE 45 J",
    titre: "Rupture de plus de 45 jours transmise automatiquement à la ML",
    attendu: {
      ml: { ml: "ML_A", liste: "a_traiter_ou_recontacter", indicateurs: { a_traiter: true } },
      cfa: { cfa: "CFA_ON", ruptures: "plus_45j", collabStatus: CFA_COLLAB_STATUS.DEMARRER_COLLAB, suivi: null },
    },
    build: (ctx) => scenario(ctx, { rupture: { n: 33, cfa: "CFA_ON", joursDepuisRupture: 50 } }),
  },
  {
    n: 35,
    code: "D35 RUPTURE DECLAREE PAR LE CFA",
    titre: "Rupture déclarée par le CFA alors que l'ERP le voit encore en contrat",
    attendu: {
      ml: { ml: "ML_A", liste: null },
      cfa: { cfa: "CFA_ON", ruptures: "moins_45j", collabStatus: CFA_COLLAB_STATUS.DEMARRER_COLLAB, suivi: null },
    },
    build: (ctx) =>
      scenario(ctx, {
        rupture: { n: 35, cfa: "CFA_ON", parcours: parcoursEnContrat(ctx), createdAt: jour(ctx, -2) },
        declaration: { jourRupture: -10, jour: -2 },
      }),
  },
  {
    n: 36,
    code: "D36 CONTACTE PAR LA ML HORS COLLAB",
    titre: "Rupture transmise automatiquement puis traitée par la ML, sans collaboration",
    attendu: {
      ml: { ml: "ML_A", liste: "traite" },
      cfa: {
        cfa: "CFA_ON",
        ruptures: "plus_45j",
        collabStatus: CFA_COLLAB_STATUS.CONTACTE_PAR_ML_HORS_COLLAB,
        suivi: "hors_collab",
      },
    },
    build: (ctx) =>
      scenario(ctx, {
        rupture: { n: 36, cfa: "CFA_ON", joursDepuisRupture: 60 },
        actionMl: { jour: -10, situation: SITUATION_ENUM.RDV_PRIS },
      }),
  },
  {
    n: 37,
    code: "D37 COLLAB COMPLETE MINEUR",
    titre: "Collaboration complète d'un mineur : motifs commentés, infos vérifiées, référent tiers",
    attendu: {
      ml: {
        ml: "ML_A",
        liste: "a_traiter_ou_recontacter",
        dansPrioritaires: true,
        dansCollaborations: true,
        indicateurs: { a_traiter: true, mineur: true },
      },
      cfa: { cfa: "CFA_ON", ruptures: "moins_45j", collabStatus: CFA_COLLAB_STATUS.COLLAB_DEMANDEE, suivi: "collab" },
    },
    build: (ctx) =>
      scenario(ctx, {
        rupture: { n: 37, cfa: "CFA_ON", age: 17, joursDepuisRupture: 25 },
        collaboration: {
          jour: -2,
          par: "CFA_ON_MEMBRE",
          situationType: CFA_SITUATION_TYPE_ENUM.RUPTURE_OU_SORTIE,
          toujoursAuCfa: true,
          jourRupture: -25,
          causeRupture: "L'employeur a mis fin au contrat après plusieurs retards.",
          motifs: [
            ACC_CONJOINT_MOTIF_ENUM.SANTE,
            ACC_CONJOINT_MOTIF_ENUM.FINANCE,
            ACC_CONJOINT_MOTIF_ENUM.ADMINISTRATIF,
          ],
          commentaires: "Situation fragile, merci de le contacter rapidement.",
          complement: {
            commentaires_par_motif: {
              [ACC_CONJOINT_MOTIF_ENUM.SANTE]: "Suivi médical en cours, fatigue importante.",
              [ACC_CONJOINT_MOTIF_ENUM.FINANCE]: "Doit rembourser un trop-perçu d'aide au permis.",
              [ACC_CONJOINT_MOTIF_ENUM.ADMINISTRATIF]: "Carte vitale et attestation CAF à refaire.",
            },
            referent_type: "other",
            referent_coordonnees: "Julien Carpentier, chargé de relations entreprises – 01 99 00 12 34",
            note_complementaire: "Le jeune préfère être contacté par SMS.",
            verified_info: {
              telephone: "0600000037",
              courriel: email(identite(37).prenom, identite(37).nom),
              adresse_rue: "12 rue Marat",
              adresse_code_postal: "94200",
              adresse_commune: "Ivry-sur-Seine",
              formation_libelle: "CAP Maintenance des véhicules",
              rqth_declare: RQTH_DECLARE_ENUM.NON,
              responsable_legal: {
                nom: `Nathalie ${identite(37).nom}`,
                telephone: "0199004321",
                courriel: email("Nathalie", identite(37).nom),
              },
            },
            form_feedback: { note: 4, remarque: "Formulaire clair.", responded_at: jour(ctx, -2) },
          },
        },
      }),
  },
  {
    n: 38,
    code: "E38 SUSPENDU RUPTURE RECENTE",
    titre: "CFA suspendu : une rupture récente est visible tout de suite côté ML",
    attendu: {
      ml: { ml: "ML_A", liste: "a_traiter_ou_recontacter", indicateurs: { a_traiter: true } },
      cfa: { cfa: "CFA_SUSP", ruptures: "moins_45j", collabStatus: CFA_COLLAB_STATUS.DEMARRER_COLLAB, suivi: null },
    },
    build: (ctx) => scenario(ctx, { rupture: { n: 38, cfa: "CFA_SUSP", joursDepuisRupture: 20 } }),
  },
  {
    n: 39,
    code: "E39 SUSPENDU COLLAB ANTERIEURE",
    titre: "CFA suspendu : collaboration envoyée avant la suspension",
    attendu: {
      ml: {
        ml: "ML_A",
        liste: "a_traiter_ou_recontacter",
        dansPrioritaires: true,
        dansCollaborations: true,
        indicateurs: { a_traiter: true, relance_urgente: true },
      },
      cfa: { cfa: "CFA_SUSP", ruptures: "plus_45j", collabStatus: CFA_COLLAB_STATUS.COLLAB_DEMANDEE, suivi: "collab" },
    },
    build: (ctx) =>
      scenario(ctx, {
        rupture: { n: 39, cfa: "CFA_SUSP", joursDepuisRupture: 80 },
        collaboration: {
          jour: -60,
          situationType: CFA_SITUATION_TYPE_ENUM.RUPTURE_OU_SORTIE,
          toujoursAuCfa: false,
          jourRupture: -80,
          jourAbandon: -70,
          causeRupture: "Démission du jeune.",
          motifs: [ACC_CONJOINT_MOTIF_ENUM.AUTRE],
          commentaires: "Souhaite une pause avant de reprendre une formation.",
        },
      }),
  },
  {
    n: 40,
    code: "F40 CFA SANS COLLAB RUPTURE",
    titre: "CFA qui utilise le TDB sans collaboration : rupture visible côté ML",
    attendu: {
      ml: { ml: "ML_A", liste: "a_traiter_ou_recontacter", indicateurs: { a_traiter: true } },
      cfa: { cfa: "CFA_OFF", ruptures: "moins_45j", collabStatus: CFA_COLLAB_STATUS.DEMARRER_COLLAB, suivi: null },
    },
    build: (ctx) => scenario(ctx, { rupture: { n: 40, cfa: "CFA_OFF", joursDepuisRupture: 30 } }),
  },
  {
    n: 41,
    code: "F41 CFA SANS COLLAB CONTACTE",
    titre: "CFA sans collaboration : dossier traité par la ML",
    attendu: {
      ml: { ml: "ML_A", liste: "traite" },
      cfa: {
        cfa: "CFA_OFF",
        ruptures: "moins_45j",
        collabStatus: CFA_COLLAB_STATUS.CONTACTE_PAR_ML_HORS_COLLAB,
        suivi: "hors_collab",
      },
    },
    build: (ctx) =>
      scenario(ctx, {
        rupture: { n: 41, cfa: "CFA_OFF", joursDepuisRupture: 40 },
        actionMl: { jour: -5, situation: SITUATION_ENUM.RDV_PRIS },
      }),
  },
  {
    n: 42,
    code: "G42 DECA VISIBLE COTE CFA",
    source: "DECA",
    titre: "Rupture DECA visible côté CFA (pilote DECA)",
    attendu: {
      ml: { ml: "ML_A", liste: "a_traiter_ou_recontacter", indicateurs: { a_traiter: true } },
      cfa: { cfa: "CFA_DECA", ruptures: "plus_45j", collabStatus: CFA_COLLAB_STATUS.DEMARRER_COLLAB, suivi: null },
    },
    build: (ctx) => scenario(ctx, { rupture: { n: 42, cfa: "CFA_DECA", deca: true, joursDepuisRupture: 50 } }),
  },
  {
    n: 43,
    code: "G43 DECA COLLAB",
    source: "DECA",
    titre: "Collaboration sur une rupture DECA",
    attendu: {
      ml: {
        ml: "ML_A",
        liste: "a_traiter_ou_recontacter",
        dansPrioritaires: true,
        dansCollaborations: true,
        indicateurs: { a_traiter: true, situation_dossier: "ABANDON" },
      },
      cfa: { cfa: "CFA_DECA", ruptures: "moins_45j", collabStatus: CFA_COLLAB_STATUS.COLLAB_DEMANDEE, suivi: "collab" },
    },
    build: (ctx) =>
      scenario(ctx, {
        rupture: { n: 43, cfa: "CFA_DECA", deca: true, joursDepuisRupture: 15 },
        collaboration: {
          jour: -4,
          situationType: CFA_SITUATION_TYPE_ENUM.RUPTURE_OU_SORTIE,
          toujoursAuCfa: false,
          jourRupture: -15,
          jourAbandon: -10,
          causeRupture: "Rupture à l'initiative de l'employeur.",
          motifs: [ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI, ACC_CONJOINT_MOTIF_ENUM.MOBILITE],
          commentaires: "N'a pas le permis, cherche une entreprise accessible en transports.",
        },
      }),
  },
];

const PANEL: Array<{ k: number; libelle: string; statut: string; parcours: (ctx: SeedContext) => SeedParcoursInput }> =
  [
    {
      k: 0,
      libelle: "inscrit, entrée à venir",
      statut: "INSCRIT",
      parcours: (ctx) => ({ dateEntree: jour(ctx, 20), dateFin: jour(ctx, 700), contrats: [] }),
    },
    {
      k: 1,
      libelle: "inscrit sans contrat",
      statut: "INSCRIT",
      parcours: (ctx) => ({ dateEntree: jour(ctx, -30), dateFin: jour(ctx, 700), contrats: [] }),
    },
    {
      k: 2,
      libelle: "apprenti",
      statut: "APPRENTI",
      parcours: (ctx) => parcoursEnContrat(ctx),
    },
    {
      k: 3,
      libelle: "abandon (exclusion)",
      statut: "ABANDON",
      parcours: (ctx) => ({
        dateEntree: jour(ctx, -200),
        dateFin: jour(ctx, 500),
        dateExclusion: jour(ctx, -20),
        contrats: [{ debut: jour(ctx, -190), fin: jour(ctx, 500), rupture: jour(ctx, -25) }],
      }),
    },
    {
      k: 4,
      libelle: "fin de formation",
      statut: "FIN_DE_FORMATION",
      parcours: (ctx) => ({
        dateEntree: jour(ctx, -700),
        dateFin: jour(ctx, -5),
        contrats: [{ debut: jour(ctx, -690), fin: jour(ctx, -5) }],
      }),
    },
  ];

const panelN = (cfa: CfaHostCode, k: number) => 100 + CFA_HOST_CODES_SANS_ACTIVITE.indexOf(cfa) * 10 + k;

export const EFFECTIFS_CASES: SeedCase[] = CFA_HOST_CODES_SANS_ACTIVITE.flatMap((cfa) =>
  PANEL.map(({ k, libelle, statut, parcours }) => {
    const n = panelN(cfa, k);
    return {
      n,
      code: `J${n} ${cfa} ${libelle.toUpperCase()}`,
      titre: `Tableau des effectifs ${cfa} : ${libelle}`,
      ...(cfa === "CFA_DECA" ? { source: "DECA" as const } : {}),
      attendu: { cfa: { cfa, ruptures: null, dansEffectifs: true, statutEffectif: statut } },
      build: async (ctx: SeedContext) => {
        const personne = buildPersonne(ctx, { n, age: 19 });
        const input = { n, cfa, ml: "ML_A" as const, personne, parcours: parcours(ctx) };
        return cfa === "CFA_DECA"
          ? { effectifsDeca: [await buildEffectifDeca(ctx, input)] }
          : { effectifs: [await buildEffectifErp(ctx, input)] };
      },
    };
  })
);

export const INVITATION_CASES: SeedCase[] = [
  {
    n: 65,
    code: "L65 INVITATION CFA",
    titre: "La ML a déjà invité le CFA sans collaboration à collaborer",
    attendu: {},
    build: async (ctx) => {
      const { organisme, organisation } = ctx.cfas.CFA_OFF;
      return {
        invitations: [
          {
            _id: seedId("invitation", 65),
            mission_locale_id: ctx.missionsLocales.ML_A._id,
            author_id: userId("ML_A_CONSEIL_1"),
            organisme_id: organisme._id,
            organisation_id: organisation._id,
            siret: organisme.siret,
            uai: organisme.uai ?? null,
            destinataires: [{ user_id: userId("CFA_OFF_ADMIN"), email: email("Pierre", "Lemoine") }],
            note: "Plusieurs de vos apprentis sont suivis par notre Mission Locale, travaillons ensemble sur leur suivi.",
            cc_email: email("Claire", "Fontaine"),
            created_at: jour(ctx, -6),
          },
        ],
      };
    },
  },
];
