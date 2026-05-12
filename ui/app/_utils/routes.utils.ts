import type { Metadata } from "next";

export interface IPage {
  getPath: (args?: any) => string;
  title: string;
  index?: boolean;
  getMetadata?: (args?: any) => Metadata;
}

interface IPages {
  static: Record<string, IPage>;
  dynamic: Record<string, (props: any) => IPage>;
}

const SITE_NAME = "Tableau de bord de l'apprentissage";

type TypePublic = "missions_locales" | "operateur_public" | "organisme_formation";

export const PAGES = {
  static: {
    home: {
      getPath: () => "/",
      title: "Accueil",
      index: true,
      getMetadata: () => ({
        title: `Accueil | ${SITE_NAME}`,
      }),
    },
    accueilCfa: {
      getPath: () => "/accueil-cfa",
      title: "Établissement de formation (CFA)",
      index: true,
      getMetadata: () => ({
        title: `Accueil CFA | ${SITE_NAME}`,
      }),
    },
    accueilMissionLocale: {
      getPath: () => "/accueil-mission-locale",
      title: "Missions Locales",
      index: true,
      getMetadata: () => ({
        title: `Accueil mission locale | ${SITE_NAME}`,
      }),
    },
    accueilTerritoire: {
      getPath: () => "/accueil-territoire",
      title: "Collectivités et acteurs de l'apprentissage",
      index: true,
      getMetadata: () => ({
        title: `Accueil territoire | ${SITE_NAME}`,
      }),
    },
    authConnexion: {
      getPath: () => "/auth/connexion",
      title: "Connexion",
      index: false,
      getMetadata: () => ({
        title: `Connexion | ${SITE_NAME}`,
      }),
    },
    authInscriptionCfa: {
      getPath: () => "/auth/inscription-cfa",
      title: "Création de compte CFA",
      index: false,
      getMetadata: () => ({
        title: `Création de compte CFA | ${SITE_NAME}`,
      }),
    },
    authBienvenue: {
      getPath: () => "/auth/bienvenue",
      title: "Bienvenue",
      index: false,
      getMetadata: () => ({
        title: `Bienvenue | ${SITE_NAME}`,
      }),
    },
    authMotDePasseOublie: {
      getPath: () => "/auth/mot-de-passe-oublie",
      title: "Mot de passe oublié",
      index: false,
      getMetadata: () => ({
        title: `Mot de passe oublié | ${SITE_NAME}`,
      }),
    },
  },
  dynamic: {
    authInscription: ({ typeOrganisation }: { typeOrganisation?: TypePublic } = {}): IPage => ({
      getPath: () => (typeOrganisation ? `/auth/inscription/${typeOrganisation}` : "/auth/inscription"),
      title: "Inscription",
      index: false,
      getMetadata: () => ({
        title: `Inscription | ${SITE_NAME}`,
      }),
    }),
  },
} as const satisfies IPages;
