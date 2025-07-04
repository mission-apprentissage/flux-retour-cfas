import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";

export default function CustomBreadcrumb({ path, name = "Mission Locale" }) {
  // Warning: This should be dynamic according to custom navgation structure
  // See api-apprentissage structure for example

  const navigation = {
    "/arml/missions-locales": {
      pageLabel: "Missions locales",
      segments: [],
    },
    "/arml/missions-locales/[mlId]": {
      pageLabel: name,
      segments: [
        {
          label: "Missions locales",
          linkProps: {
            href: "/arml/missions-locales",
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
