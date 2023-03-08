import React from "react";
import { ArrowDropRightLine } from "../../theme/components/icons";
import { BreadcrumbItem, BreadcrumbLink, Breadcrumb as ChakraBreadcrumb } from "@chakra-ui/react";
import NavLink from "next/link";
import PropTypes from "prop-types";

export const PAGES = {
  homepage: () => ({
    title: "Accueil",
    path: "/",
  }),
  monEspace: () => ({
    title: "Mon espace",
    path: "/mon-espace/mon-organisme",
  }),
  monTableauDeBord: () => ({
    title: "Mon tableau de bord",
    path: "/mon-espace/mon-organisme",
  }),
  mesEffectifs: () => ({
    title: "Mes effectifs",
    path: "/mon-espace/mon-organisme/effectifs",
  }),
  sesEffectifs: (organismeId) => ({
    title: "Ses effectifs",
    path: `/mon-espace/organisme/${organismeId}/effectifs`,
  }),
  visualiserLesIndicateurs: () => ({
    title: "Visualiser les indicateurs en temps réel",
    path: "/mon-espace/mon-organisme/",
  }),
  visualiserLesIndicateursParTerritoire: () => ({
    title: "Vue territoriale",
    path: "/mon-espace/mon-organisme/par-territoire",
  }),
  visualiserLesIndicateursParReseau: () => ({
    title: "Vue par réseau",
    path: "/mon-espace/mon-organisme/par-reseau",
  }),
  visualiserLesIndicateursParOrganisme: () => ({
    title: "Vue par organisme de formation",
    path: "/mon-espace/mon-organisme/par-organisme",
  }),
  visualiserLesIndicateursParFormation: () => ({
    title: "Vue par formation",
    path: "/mon-espace/mon-organisme/par-formation",
  }),
};

const Breadcrumb = ({ pages }) => {
  return (
    <ChakraBreadcrumb
      separator={<ArrowDropRightLine color="grey.600" boxSize={3} mb={1} />}
      textStyle="xs"
      color={"grey.800"}
    >
      {pages?.map((page, index) => {
        if (index === pages.length - 1 || !page.path) {
          return (
            <BreadcrumbItem key={page.title} isCurrentPage>
              <BreadcrumbLink textDecoration="none" _hover={{ textDecoration: "none" }} cursor="default">
                {page.title}
              </BreadcrumbLink>
            </BreadcrumbItem>
          );
        } else {
          return (
            <BreadcrumbItem key={page.title}>
              <BreadcrumbLink
                as={NavLink}
                href={page.path}
                color={"grey.600"}
                textDecoration="underline"
                _focus={{ boxShadow: "0 0 0 3px #2A7FFE", outlineColor: "#2A7FFE" }}
                _focusVisible={{ outlineColor: "#2A7FFE" }}
              >
                {page.title}
              </BreadcrumbLink>
            </BreadcrumbItem>
          );
        }
      })}
    </ChakraBreadcrumb>
  );
};

Breadcrumb.propTypes = {
  pages: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      path: PropTypes.string,
    }).isRequired
  ).isRequired,
};
export default Breadcrumb;
