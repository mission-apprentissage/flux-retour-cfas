import type { Metadata } from "next";

export interface IPage {
  getPath: (args?: any) => string;
  title: string;
  getMetadata?: (args?: any) => Metadata;
}

interface IPages {
  static: Record<string, IPage>;
  dynamic: Record<string, (props: any) => IPage>;
}

const SITE_NAME = "Tableau de bord de l'apprentissage";

type TypePublic =
  | "missions_locales"
  | "operateur_public"
  | "organisme_formation"
  | "tete_de_reseau"
  | "france_travail"
  | "autre";

export const PAGES = {
  static: {
    home: {
      getPath: () => "/",
      title: "Accueil",
      getMetadata: () => ({
        title: `Accueil | ${SITE_NAME}`,
      }),
    },
    accueilCfa: {
      getPath: () => "/accueil-cfa",
      title: "Établissement de formation (CFA)",
      getMetadata: () => ({
        title: `Accueil CFA | ${SITE_NAME}`,
      }),
    },
    accueilMissionLocale: {
      getPath: () => "/accueil-mission-locale",
      title: "Missions Locales",
      getMetadata: () => ({
        title: `Accueil mission locale | ${SITE_NAME}`,
      }),
    },
    accueilTerritoire: {
      getPath: () => "/accueil-territoire",
      title: "Collectivités et acteurs de l'apprentissage",
      getMetadata: () => ({
        title: `Accueil territoire | ${SITE_NAME}`,
      }),
    },
    webinaires: {
      getPath: () => "/webinaires",
      title: "Webinaires",
      getMetadata: () => ({
        title: `Webinaires | ${SITE_NAME}`,
      }),
    },
    contact: {
      getPath: () => "/contact",
      title: "Contact",
      getMetadata: () => ({
        title: `Contacter l’équipe support | ${SITE_NAME}`,
      }),
    },
    referencementOrganisme: {
      getPath: () => "/referencement-organisme",
      title: "Référencement de votre organisme",
      getMetadata: () => ({
        title: `Comment bien référencer son établissement et ses formations ? | ${SITE_NAME}`,
      }),
    },
    glossaire: {
      getPath: () => "/glossaire",
      title: "Glossaire",
      getMetadata: () => ({
        title: `Glossaire | ${SITE_NAME}`,
      }),
    },
    accessibilite: {
      getPath: () => "/accessibilite",
      title: "Déclaration d’accessibilité",
      getMetadata: () => ({
        title: `Déclaration d’accessibilité | ${SITE_NAME}`,
      }),
    },
    mentionsLegales: {
      getPath: () => "/mentions-legales",
      title: "Mentions légales",
      getMetadata: () => ({
        title: `Mentions légales | ${SITE_NAME}`,
      }),
    },
    cgu: {
      getPath: () => "/cgu",
      title: "Conditions générales d’utilisation",
      getMetadata: () => ({
        title: `Conditions générales d’utilisation | ${SITE_NAME}`,
      }),
    },
    authConnexion: {
      getPath: () => "/auth/connexion",
      title: "Connexion",
      getMetadata: () => ({
        title: `Connexion | ${SITE_NAME}`,
      }),
    },
    authInscriptionCfa: {
      getPath: () => "/auth/inscription-cfa",
      title: "Création de compte CFA",
      getMetadata: () => ({
        title: `Création de compte CFA | ${SITE_NAME}`,
      }),
    },
    authBienvenue: {
      getPath: () => "/auth/bienvenue",
      title: "Bienvenue",
      getMetadata: () => ({
        title: `Bienvenue | ${SITE_NAME}`,
      }),
    },
    authMotDePasseOublie: {
      getPath: () => "/auth/mot-de-passe-oublie",
      title: "Mot de passe oublié",
      getMetadata: () => ({
        title: `Mot de passe oublié | ${SITE_NAME}`,
      }),
    },
  },
  dynamic: {
    authInscription: ({ typeOrganisation }: { typeOrganisation?: TypePublic } = {}): IPage => ({
      getPath: () => (typeOrganisation ? `/auth/inscription/${typeOrganisation}` : "/auth/inscription"),
      title: "Inscription",
      getMetadata: () => ({
        title: `Inscription | ${SITE_NAME}`,
      }),
    }),
  },
} as const satisfies IPages;
