import { Box, Table, Tbody, Td, Text, Th, Thead, Tooltip, Tr } from "@chakra-ui/react";
import { useMemo } from "react";

import { _get } from "@/common/httpClient";
import { FormationBase } from "@/common/internal/Formation";

import { niveauFormationByNiveau } from "../indicateurs/filters/FiltreFormationNiveau";

const formationsTableColumnsDefs: any[] = [
  {
    header: () => "Intitulé et lieu de la formation",
    cell: ({ row }) => (
      <>
        <Text>{row.original.intitule_long}</Text>
        <Text mt={2} color="#3A3A3A">
          {row.original.lieu_formation_adresse}
        </Text>
      </>
    ),
  },
  {
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
          aria-label="Code Formation Diplôme. Codification qui concerne l’ensemble des diplômes technologiques et professionnels des
                        ministères certificateurs."
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
          aria-label=" Le Répertoire national des certifications professionnelles (RNCP) sert à tenir à la disposition de tous une information constamment à jour sur les diplômes et les titres à finalité professionnelle ainsi que sur les certificats de qualification."
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
    header: () => <>Durée (an)</>,
  },
];

interface NiveauAvecFormations {
  niveau: string;
  label: string;
  formations: FormationBase[];
}

interface FormationsTableEffectifsProps {
  formations: FormationBase[];
}
function FormationsTableEffectifs(props: FormationsTableEffectifsProps) {
  // TODO tri par niveau d'abord
  // const defaultSort: SortingState = [{ desc: false, id: "intitule_long" }];

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
      <style type="text/css">
        {`
          table.stripped-bgcolor-even tr:nth-child(even) {
            background-color: var(--chakra-colors-grey-100);
          }
        `}
      </style>
      <Table className="stripped-bgcolor-even">
        <Thead position="sticky" top="0" zIndex="1">
          <Tr>
            {formationsTableColumnsDefs.map((columnDef) => (
              <Th
                key={columnDef.header()}
                textTransform="initial"
                textColor="grey.800"
                fontSize="zeta"
                fontWeight="700"
                letterSpacing="0px"
                borderBottom="2px solid"
                borderBottomColor="bluefrance"
              >
                {columnDef.header()}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody fontSize="zeta">
          {niveauxAvecFormations.map((niveauAvecFormations) => (
            <>
              <Tr key={niveauAvecFormations.niveau}>
                <Td background="#F5F5FE" color="bluefrance" fontWeight="bold" fontSize="zeta" colSpan={100}>
                  {niveauAvecFormations.label}
                </Td>
              </Tr>

              {niveauAvecFormations.formations.map((formation) => (
                <Tr
                  key={formation.cle_ministere_educatif}
                  _hover={{ backgroundColor: "var(--chakra-colors-grey-200) !important" }}
                >
                  <Td>
                    <Text>{formation.intitule_long}</Text>
                    <Text mt={2} color="#3A3A3A" fontSize="omega">
                      {formation.lieu_formation_adresse}
                    </Text>
                  </Td>
                  <Td>{formation.cfd}</Td>
                  <Td>{formation.rncp}</Td>
                  <Td>{formation.duree_formation_theorique}</Td>
                </Tr>
              ))}
            </>
          ))}
        </Tbody>
      </Table>
    </>
  );
}

export default FormationsTableEffectifs;
