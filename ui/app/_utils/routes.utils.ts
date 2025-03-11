import type { Metadata, MetadataRoute } from "next";

import { publicConfig } from "@/config.public";

export interface IPage {
  getPath: (args?: any) => string;
  title: string;
  index: boolean;
  getMetadata: (args?: any) => Metadata;
}

export interface INotionPage extends IPage {
  notionId: string;
}

export interface IPages {
  static: Record<string, IPage>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dynamic: Record<string, (params: any) => IPage>;
  notion: Record<string, INotionPage>;
}

export const PAGES = {
  static: {
    home: {
      getPath: () => `/home` as string,
      title: "Accueil",
      index: true,
      getMetadata: () => ({
        title: "La bonne alternance - Trouvez l'alternance idéale",
        description:
          "Découvrez des offres d’alternance adaptées à votre profil et boostez votre carrière avec La bonne alternance.",
      }),
    },
    authentification: {
      getPath: () => `/authentification` as string,
      title: "Authentification",
      index: false,
      getMetadata: () => ({
        title: "Authentification - La bonne alternance",
        description: "Connectez-vous à votre compte La bonne alternance pour accéder à vos offres d’alternance.",
      }),
    },
    aPropos: {
      getPath: () => `/a-propos` as string,
      title: "À propos",
      index: false,
      getMetadata: () => ({
        title: "À propos de La bonne alternance - Notre mission et engagement",
        description:
          "Apprenez-en plus sur La bonne alternance, notre mission et notre engagement pour faciliter votre recherche d’alternance.",
      }),
    },
    cgu: {
      getPath: () => `/conditions-generales-utilisation` as string,
      title: "Conditions générales d'utilisation",
      index: false,
      getMetadata: () => ({
        title: "Conditions générales d'utilisation - La bonne alternance",
        description:
          "Consultez les conditions générales d’utilisation de La bonne alternance pour comprendre nos règles et engagements.",
      }),
    },
    faq: {
      getPath: () => `/faq` as string,
      title: "FAQ",
      index: false,
      getMetadata: () => ({
        title: "FAQ - Réponses à vos questions sur l'alternance",
        description:
          "Trouvez des réponses aux questions fréquentes sur l’alternance, nos services et le fonctionnement du site.",
      }),
    },
    mentionsLegales: {
      getPath: () => `/mentions-legales` as string,
      title: "Mentions légales",
      index: false,
      getMetadata: () => ({
        title: "Mentions légales - La bonne alternance",
        description:
          "Consultez les mentions légales de La bonne alternance pour en savoir plus sur nos obligations légales et notre responsabilité.",
      }),
    },
    politiqueConfidentialite: {
      getPath: () => `/politique-de-confidentialite` as string,
      title: "Politique de confidentialité",
      index: false,
      getMetadata: () => ({
        title: "Politique de confidentialité - Protection de vos données",
        description:
          "Découvrez comment nous protégeons vos données personnelles et respectons votre vie privée sur La bonne alternance.",
      }),
    },
    metiers: {
      getPath: () => `/metiers` as string,
      title: "Métiers",
      index: false,
      getMetadata: () => ({
        title: "Métiers en alternance - Découvrez les opportunités",
        description:
          "Explorez les différents métiers accessibles en alternance et trouvez celui qui correspond à votre projet professionnel.",
      }),
    },
    codeSources: {
      getPath: () => `https://github.com/mission-apprentissage/labonnealternance` as string,
      title: "Sources",
      index: false,
      getMetadata: () => ({
        title: "Nos sources de données - La bonne alternance",
        description:
          "Découvrez les sources de données que nous utilisons pour vous proposer les meilleures offres d’alternance.",
      }),
    },
    blog: {
      getPath: () =>
        `https://labonnealternance.sites.beta.gouv.fr/?utm_source=lba&utm_medium=website&utm_campaign=lba_footer` as string,
      title: "Blog",
      index: false,
      getMetadata: () => ({
        title: "Blog - Conseils et actualités sur l'alternance",
        description:
          "Lisez nos articles sur l’alternance, les conseils de carrière et les tendances du marché pour optimiser votre recherche.",
      }),
    },
    ressources: {
      getPath: () => `/ressources` as string,
      title: "Ressources",
      index: false,
      getMetadata: () => ({
        title: "Ressources pour réussir votre alternance",
        description:
          "Accédez à des guides et outils pratiques pour maximiser vos chances de trouver une alternance et réussir votre parcours.",
      }),
    },
    EspaceDeveloppeurs: {
      getPath: () => `/espace-developpeurs` as string,
      title: "Espace développeurs",
      index: false,
      getMetadata: () => ({
        title: "Espace developpeurs - Transparence et qualité des offres",
        description:
          "En savoir plus sur notre API et nos données pour développer vos propres outils et services d’alternance.",
      }),
    },
    contact: {
      getPath: () => `/contact` as string,
      title: "Contact",
      index: false,
      getMetadata: () => ({
        title: "Contactez-nous - La bonne alternance",
        description:
          "Besoin d’aide ou d’informations ? Contactez notre équipe pour toute question relative à votre recherche d’alternance.",
      }),
    },
    statistiques: {
      getPath: () => `/statistiques` as string,
      title: "Statistiques",
      index: false,
      getMetadata: () => ({
        title: "Statistiques - La bonne alternance",
        description: "Consultez nos statistiques et analyses sur le marché de l’alternance en France.",
      }),
    },
    accesRecruteur: {
      getPath: () => `/acces-recruteur` as string,
      title: "Accès recruteur",
      index: false,
      getMetadata: () => ({
        title: "Accès recruteur - La bonne alternance",
        description: "Diffusez simplement et gratuitement vos offres en alternance.",
      }),
    },
    organismeDeFormation: {
      getPath: () => `/organisme-de-formation` as string,
      title: "Organisme de formation",
      index: false,
      getMetadata: () => ({
        title: "Accès recruteur - La bonne alternance",
        description: "Diffusez simplement et gratuitement vos offres en alternance.",
      }),
    },
  },
  dynamic: {
    // example
    inscription: (token: string): IPage => ({
      getPath: () => `/auth/inscription?token=${token}`,
      index: false,
      getMetadata: () => ({ title: "" }),
      title: "Inscription",
    }),
    metierJobById: (metier: string): IPage => ({
      getPath: () => `/metiers/${metier}` as string,
      index: false,
      getMetadata: () => ({
        title: `${metier} en alternance - Découvrez les opportunités`,
        description: `Explorez les différents métiers accessibles en ${metier} en alternance et trouvez celui qui correspond à votre projet professionnel.`,
      }),
      title: metier,
    }),
  },
  notion: {},
} as const satisfies IPages;

function getRawPath(pathname: string): string {
  const rawPath = pathname.replace(/^\/fr/, "").replace(/^\/en/, "");
  return rawPath === "" ? "/" : rawPath;
}

export function isStaticPage(pathname: string): boolean {
  return Object.values(PAGES.static).some((page) => getRawPath(page.getPath()) === pathname);
}

export function isDynamicPage(pathname: string): boolean {
  if (pathname === "/auth/inscription") {
    return true;
  }
  if (pathname === "/auth/refus-inscription") {
    return true;
  }
  if (/^\/admin\/utilisateurs\/[^/]+$/.test(pathname)) {
    return true;
  }

  return false;
}

export function isNotionPage(pathname: string): boolean {
  return pathname.startsWith("/doc/") || /^\/notion\/[^/]+$/.test(pathname);
}

function getSitemapItem(page: IPage): MetadataRoute.Sitemap[number] {
  return {
    url: `${publicConfig.baseUrl}${getRawPath(page.getPath())}`,
    alternates: {
      languages: {
        fr: `${publicConfig.baseUrl}${page.getPath()}`,
        en: `${publicConfig.baseUrl}${page.getPath()}`,
      },
    },
  };
}

export function getSitemap(): MetadataRoute.Sitemap {
  return Object.values(PAGES.static)
    .filter((page) => page.index)
    .map(getSitemapItem);
}

export function isPage(pathname: string): boolean {
  return isStaticPage(pathname) || isDynamicPage(pathname) || isNotionPage(pathname);
}
