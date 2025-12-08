import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";

export default function CustomBreadcrumb({ path, name = "Mission Locale" }) {
  // Warning: This should be dynamic according to custom navgation structure
  // See api-apprentissage structure for example

  const navigation = {
    "/arml/missions-locales": {
      pageLabel: "Missions Locales",
      segments: [],
    },
    "/arml/missions-locales/[mlId]": {
      pageLabel: name,
      segments: [
        {
          label: "Missions Locales",
          linkProps: {
            href: "/arml/missions-locales",
          },
        },
      ],
    },
    "/admin/mission-locale": {
      pageLabel: "Pilotage des missions locales",
      segments: [],
    },
    "/admin/mission-locale/[mlId]": {
      pageLabel: name,
      segments: [
        {
          label: "Pilotage des missions locales",
          linkProps: {
            href: "/admin/mission-locale",
          },
        },
      ],
    },
  };

  const currentPage = navigation[path] || { pageLabel: "Inconnu", segments: [] };

  return (
    <Breadcrumb
      currentPageLabel={currentPage.pageLabel}
      homeLinkProps={{
        href: "/",
      }}
      segments={currentPage.segments}
    />
  );
}
