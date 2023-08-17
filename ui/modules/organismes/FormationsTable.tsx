import { ChevronDownIcon } from "@chakra-ui/icons";
import { Box, Table, Tbody, Td, Text, Th, Thead, Tooltip, Tr } from "@chakra-ui/react";
import { Fragment, useMemo, useState } from "react";

import { _get } from "@/common/httpClient";
import { FormationBase } from "@/common/internal/Formation";

import { niveauFormationByNiveau } from "../indicateurs/filters/FiltreFormationNiveau";

interface CustomColumnDef {
  accessorKey: string;
  header: () => string | JSX.Element;
  style?: any;
}

const formationsTableColumnsDefs: CustomColumnDef[] = [
  {
    accessorKey: "intitule_long",
    header: () => "Intitulé et lieu de la formation",
    style: {
      width: "100%",
    },
  },
  {
    accessorKey: "cfd",
    header: () => (
      <>
        Code Diplôme
        <Tooltip
          background="bluefrance"
          color="white"
          label={
            <Box padding="1w">
              <b>Code Formation Diplôme (CFD)</b>
              <Text as="p">
                Codification qui concerne l’ensemble des diplômes technologiques et professionnels des ministères
                certificateurs.
              </Text>
              <Text as="p">
                Y sont ajoutés, en tant que de besoin et à la demande des centres de formation par l’apprentissage, les
                autres diplômes et titres inscrits au répertoire national des certifications professionnelles (RNCP),
                dès lors qu’ils sont préparés par la voie de l’apprentissage.
              </Text>
            </Box>
          }
          aria-label="Code Formation Diplôme. Codification qui concerne l’ensemble des diplômes technologiques et professionnels des ministères certificateurs."
        >
          <Box
            as="i"
            className="ri-information-line"
            fontSize="epsilon"
            color="grey.500"
            marginLeft="1v"
            verticalAlign="middle"
          />
        </Tooltip>
      </>
    ),
  },
  {
    accessorKey: "rncp",
    header: () => (
      <>
        Code RNCP
        <Tooltip
          background="bluefrance"
          color="white"
          label={
            <Box padding="1w">
              <b>Répertoire national des certifications professionnelles (RNCP)</b>
              <Text as="p">
                Le Répertoire national des certifications professionnelles (RNCP) sert à tenir à la disposition de tous
                une information constamment à jour sur les diplômes et les titres à finalité professionnelle ainsi que
                sur les certificats de qualification. La mise à jour du RNCP est confiée à France compétences.
              </Text>
            </Box>
          }
          aria-label="Le Répertoire national des certifications professionnelles (RNCP) sert à tenir à la disposition de tous une information constamment à jour sur les diplômes et les titres à finalité professionnelle ainsi que sur les certificats de qualification."
        >
          <Box
            as="i"
            className="ri-information-line"
            fontSize="epsilon"
            color="grey.500"
            marginLeft="1v"
            verticalAlign="middle"
          />
        </Tooltip>
      </>
    ),
  },
  {
    accessorKey: "duree",
    header: () => <>Durée (an)</>,
  },
];

interface NiveauAvecFormations {
  niveau: string;
  label: string;
  formations: FormationBase[];
}

interface FormationsTableProps {
  formations: FormationBase[];
}
function FormationsTable(props: FormationsTableProps) {
  const [expandedNiveaux, setExpandedNiveaux] = useState<{ [niveau: string]: boolean }>({});

  function toggleExpand(niveau: string) {
    expandedNiveaux[niveau] = !expandedNiveaux[niveau];
    setExpandedNiveaux({ ...expandedNiveaux });
  }

  const niveauxAvecFormations = useMemo(() => {
    return Object.values(
      props.formations.reduce<{ [key: string]: NiveauAvecFormations }>((acc, formation) => {
        let formationsNiveau = acc[formation.niveau];
        if (!formationsNiveau) {
          formationsNiveau = acc[formation.niveau] = {
            niveau: formation.niveau,
            label: niveauFormationByNiveau[formation.niveau],
            formations: [],
          };
        }
        formationsNiveau.formations.push(formation);
        return acc;
      }, {})
    ).sort((a, b) => (a.niveau < b.niveau ? -1 : 1));
  }, [props.formations]);

  return (
    <>
      <Table className="stripped-bgcolor-even" variant="primary">
        <Thead position="sticky" top="0" zIndex="1" background="#ffffff">
          <Tr>
            {formationsTableColumnsDefs.map((columnDef) => (
              <Th key={columnDef.accessorKey} {...columnDef?.style}>
                {columnDef.header()}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody fontSize="zeta">
          {niveauxAvecFormations.map((niveauAvecFormations) => (
            <Fragment key={niveauAvecFormations.niveau}>
              <Tr key={niveauAvecFormations.niveau}>
                <Td
                  background="#F5F5FE"
                  color="bluefrance"
                  fontWeight="bold"
                  fontSize="zeta"
                  colSpan={100}
                  cursor="pointer"
                  title="Cliquer pour afficher/masquer le détail"
                  lineHeight="3em"
                  borderBottom=".5px solid bluefrance"
                  onClick={() => toggleExpand(niveauAvecFormations.niveau)}
                >
                  <ChevronDownIcon
                    boxSize="6"
                    transform={expandedNiveaux[niveauAvecFormations.niveau] ? "rotate(-180deg)" : ""}
                    transition=".3s"
                  />
                  {niveauAvecFormations.label}
                </Td>
              </Tr>

              {expandedNiveaux[niveauAvecFormations.niveau] &&
                niveauAvecFormations.formations.map((formation) => (
                  <Tr key={formation.cle_ministere_educatif}>
                    <Td>
                      <Text>{formation.intitule_long}</Text>
                      <Text mt={2} color="#3A3A3A" fontSize="omega">
                        {formation.lieu_formation_adresse}
                      </Text>
                    </Td>
                    <Td title={formation.cle_ministere_educatif}>{formation.cfd}</Td>
                    <Td>{formation.rncp ?? "inconnu"}</Td>
                    <Td>{formation.duree_formation_theorique}</Td>
                  </Tr>
                ))}
            </Fragment>
          ))}
        </Tbody>
      </Table>
    </>
  );
}

export default FormationsTable;
