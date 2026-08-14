import type { Metadata } from "next";

export interface IPage {
  getPath: (args?: any) => string;
  title: string;
  getMetadata: (args?: any) => Metadata;
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
    docsFaq: {
      getPath: () => "/docs/faq",
      title: "Page d’aide & FAQ",
      getMetadata: () => ({
        title: `Page d’aide & FAQ | ${SITE_NAME}`,
      }),
    },
    docsKitDeploiementTbaOp: {
      getPath: () => "/docs/kit-deploiement-tba-op",
      title: "Kit de déploiement : Opérateurs Publics",
      getMetadata: () => ({
        title: `Kit de déploiement : Opérateurs Publics | ${SITE_NAME}`,
      }),
    },
    docsKitDeploiementTbaReseaux: {
      getPath: () => "/docs/kit-deploiement-tba-reseaux",
      title: "Kit de déploiement : Réseaux",
      getMetadata: () => ({
        title: `Kit de déploiement : Réseaux | ${SITE_NAME}`,
      }),
    },
    politiqueConfidentialite: {
      getPath: () => "/politique-de-confidentialite",
      title: "Politique de confidentialité",
      getMetadata: () => ({
        title: `Politique de confidentialité | ${SITE_NAME}`,
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
    authFinalisation: {
      getPath: () => "/auth/finalisation",
      title: "Confirmation de votre compte",
      getMetadata: () => ({
        title: `Confirmation de votre compte | ${SITE_NAME}`,
      }),
    },
    authInscriptionBravo: {
      getPath: () => "/auth/inscription/bravo",
      title: "Compte à valider",
      getMetadata: () => ({
        title: `Vérifiez votre boite mail | ${SITE_NAME}`,
      }),
    },
    authInscriptionOrganismeInconnu: {
      getPath: () => "/auth/inscription/organisme-inconnu",
      title: "Retrouver son UAI ou son SIRET",
      getMetadata: () => ({
        title: `Retrouver l’UAI ou le SIRET de son organisme | ${SITE_NAME}`,
      }),
    },
    authInscriptionReseauAutre: {
      getPath: () => "/auth/inscription/reseau-autre",
      title: "Réseau non référencé",
      getMetadata: () => ({
        title: `Réseau non référencé | ${SITE_NAME}`,
      }),
    },
    authRefusInvitation: {
      getPath: () => "/auth/refus-invitation",
      title: "Refus d’invitation",
      getMetadata: () => ({
        title: `Refus d’invitation | ${SITE_NAME}`,
      }),
    },
    authMotDePasseOublie: {
      getPath: () => "/auth/mot-de-passe-oublie",
      title: "Mot de passe oublié",
      getMetadata: () => ({
        title: `Mot de passe oublié | ${SITE_NAME}`,
      }),
    },
    authModifierMotDePasse: {
      getPath: () => "/auth/modifier-mot-de-passe",
      title: "Nouveau mot de passe",
      getMetadata: () => ({
        title: `Nouveau mot de passe | ${SITE_NAME}`,
      }),
    },
    adminReseaux: {
      getPath: () => "/admin/reseaux",
      title: "Gestion des réseaux",
      getMetadata: () => ({
        title: `Gestion des réseaux | ${SITE_NAME}`,
      }),
    },
    adminFusionOrganismes: {
      getPath: () => "/admin/fusion-organismes",
      title: "Vérifier les duplicats d’organisme",
      getMetadata: () => ({
        title: `Vérifier les duplicats d’organisme | ${SITE_NAME}`,
      }),
    },
    adminTransmissions: {
      getPath: () => "/admin/transmissions",
      title: "Toutes les transmissions",
      getMetadata: () => ({
        title: `Toutes les transmissions | ${SITE_NAME}`,
      }),
    },
    adminOrganismesGestion: {
      getPath: () => "/admin/organismes/gestion",
      title: "Organismes absents du référentiel",
      getMetadata: () => ({
        title: `Organismes absents du référentiel | ${SITE_NAME}`,
      }),
    },
    adminOrganismesRecherche: {
      getPath: () => "/admin/organismes/recherche",
      title: "Recherche d’un organisme",
      getMetadata: () => ({
        title: `Recherche d’un organisme | ${SITE_NAME}`,
      }),
    },
    adminImpostures: {
      getPath: () => "/admin/impostures",
      title: "Impostures",
      getMetadata: () => ({
        title: `Impostures | ${SITE_NAME}`,
      }),
    },
    connexionApi: {
      getPath: () => "/connexion-api",
      title: "Connexion ERP",
      getMetadata: () => ({
        title: `Connexion ERP | ${SITE_NAME}`,
      }),
    },
    voeuxAffelnet: {
      getPath: () => "/voeux-affelnet",
      title: "Vœux Affelnet",
      getMetadata: () => ({
        title: `Vœux Affelnet | ${SITE_NAME}`,
      }),
    },
    tableauDeBord: {
      getPath: () => "/home",
      title: "Mon tableau de bord",
      getMetadata: () => ({
        title: SITE_NAME,
      }),
    },
    parametres: {
      getPath: () => "/parametres",
      title: "Paramétrage de votre moyen de transmission",
      getMetadata: () => ({
        title: `Paramétrage de votre moyen de transmission | ${SITE_NAME}`,
      }),
    },
    organisationMembres: {
      getPath: () => "/organisation/membres",
      title: "Gestion des rôles et habilitations",
      getMetadata: () => ({
        title: `Gestion des rôles et habilitations | ${SITE_NAME}`,
      }),
    },
    transmissions: {
      getPath: () => "/transmissions",
      title: "Mes transmissions",
      getMetadata: () => ({
        title: `Mes transmissions | ${SITE_NAME}`,
      }),
    },
    effectifs: {
      getPath: () => "/effectifs",
      title: "Mes effectifs",
      getMetadata: () => ({
        title: `Mes effectifs | ${SITE_NAME}`,
      }),
    },
    effectifsDoublons: {
      getPath: () => "/effectifs/doublons",
      title: "Doublons",
      getMetadata: () => ({
        title: `Doublons | ${SITE_NAME}`,
      }),
    },
    effectifsTeleversement: {
      getPath: () => "/effectifs/televersement",
      title: "Import des effectifs",
      getMetadata: () => ({
        title: `Import des effectifs | ${SITE_NAME}`,
      }),
    },
    organismes: {
      getPath: () => "/organismes",
      title: "Mes organismes",
      getMetadata: () => ({
        title: `Mes organismes | ${SITE_NAME}`,
      }),
    },
    organismesACompleter: {
      getPath: () => "/organismes/a-completer",
      title: "Mes organismes",
      getMetadata: () => ({
        title: `Mes organismes | ${SITE_NAME}`,
      }),
    },
  },
  dynamic: {
    adminReseau: ({ id, nom }: { id: string; nom?: string }): IPage => ({
      getPath: () => `/admin/reseaux/${encodeURIComponent(id)}`,
      title: nom ? `Réseau ${nom}` : "Réseau",
      getMetadata: () => ({
        title: `${nom ? `Réseau ${nom}` : "Réseau"} | ${SITE_NAME}`,
      }),
    }),
    adminOrganismeSupport: ({
      siret,
      uai,
      nom,
      query,
    }: {
      siret: string;
      uai?: string | null;
      nom?: string;
      query?: string;
    }): IPage => ({
      getPath: () => {
        const params = new URLSearchParams();
        if (uai) params.set("uai", uai);
        if (query) params.set("q", query);
        const search = params.toString();
        return `/admin/organismes/recherche/${encodeURIComponent(siret)}${search ? `?${search}` : ""}`;
      },
      title: nom ?? "Organisme",
      getMetadata: () => ({
        title: `${nom ?? `Organisme ${siret}`} | ${SITE_NAME}`,
      }),
    }),
    adminTransmissionsJour: ({ date, label }: { date: string; label?: string }): IPage => ({
      getPath: () => `/admin/transmissions/${encodeURIComponent(date)}`,
      title: label ? `Rapport du ${label}` : "Rapport de transmission",
      getMetadata: () => ({
        title: `${label ? `Rapport du ${label}` : "Rapport de transmission"} | ${SITE_NAME}`,
      }),
    }),
    docsPage: ({ id, title }: { id: string; title?: string }) => ({
      getPath: () => `/docs/${id}`,
      title: title ?? "Documentation",
      getMetadata: () => ({
        title: `${title ?? "Documentation"} | ${SITE_NAME}`,
      }),
    }),
    authInscription: ({ typeOrganisation }: { typeOrganisation?: TypePublic } = {}): IPage => ({
      getPath: () => (typeOrganisation ? `/auth/inscription/${typeOrganisation}` : "/auth/inscription"),
      title: "Inscription",
      getMetadata: () => ({
        title: `Inscription | ${SITE_NAME}`,
      }),
    }),
    transmissionsJour: ({ date, label }: { date: string; label?: string }): IPage => ({
      getPath: () => `/transmissions/${encodeURIComponent(date)}`,
      title: label ? `Rapport du ${label}` : "Rapport de transmission",
      getMetadata: () => ({
        title: `${label ? `Rapport du ${label}` : "Rapport de transmission"} | ${SITE_NAME}`,
      }),
    }),
    organisme: ({ organismeId, nom }: { organismeId: string; nom?: string }): IPage => ({
      getPath: () => `/organismes/${encodeURIComponent(organismeId)}`,
      title: nom ? `Tableau de bord ${nom}` : "Tableau de bord de l’organisme",
      getMetadata: () => ({
        title: `${nom ? `Tableau de bord ${nom}` : "Tableau de bord de l’organisme"} | ${SITE_NAME}`,
      }),
    }),
    organismeTransmissions: ({ organismeId }: { organismeId: string }): IPage => ({
      getPath: () => `/organismes/${encodeURIComponent(organismeId)}/transmissions`,
      title: "Ses transmissions",
      getMetadata: () => ({
        title: `Ses transmissions | ${SITE_NAME}`,
      }),
    }),
    organismeTransmissionsJour: ({
      organismeId,
      date,
      label,
    }: {
      organismeId: string;
      date: string;
      label?: string;
    }): IPage => ({
      getPath: () => `/organismes/${encodeURIComponent(organismeId)}/transmissions/${encodeURIComponent(date)}`,
      title: label ? `Rapport du ${label}` : "Rapport de transmission",
      getMetadata: () => ({
        title: `${label ? `Rapport du ${label}` : "Rapport de transmission"} | ${SITE_NAME}`,
      }),
    }),
    organismeOrganismes: ({ organismeId }: { organismeId: string }): IPage => ({
      getPath: () => `/organismes/${encodeURIComponent(organismeId)}/organismes`,
      title: "Ses organismes",
      getMetadata: () => ({
        title: `Ses organismes | ${SITE_NAME}`,
      }),
    }),
    organismeEffectifs: ({ organismeId }: { organismeId: string }): IPage => ({
      getPath: () => `/organismes/${encodeURIComponent(organismeId)}/effectifs`,
      title: "Ses effectifs",
      getMetadata: () => ({
        title: `Ses effectifs | ${SITE_NAME}`,
      }),
    }),
    organismeEffectifsDoublons: ({ organismeId }: { organismeId: string }): IPage => ({
      getPath: () => `/organismes/${encodeURIComponent(organismeId)}/effectifs/doublons`,
      title: "Doublons",
      getMetadata: () => ({
        title: `Doublons | ${SITE_NAME}`,
      }),
    }),
    organismeEffectifsTeleversement: ({ organismeId }: { organismeId: string }): IPage => ({
      getPath: () => `/organismes/${encodeURIComponent(organismeId)}/effectifs/televersement`,
      title: "Import des effectifs",
      getMetadata: () => ({
        title: `Import des effectifs | ${SITE_NAME}`,
      }),
    }),
  },
} as const satisfies IPages;
