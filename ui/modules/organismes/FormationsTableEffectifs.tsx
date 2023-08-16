import { ChevronDownIcon } from "@chakra-ui/icons";
import { Table, Tbody, Td, Text, Th, Thead, Tr } from "@chakra-ui/react";
import { Fragment, useMemo, useState } from "react";

import { _get } from "@/common/httpClient";

import { AbandonsIcon, ApprentisIcon, InscritsSansContratsIcon, RupturantsIcon } from "../dashboard/icons";
import { niveauFormationByNiveau } from "../indicateurs/filters/FiltreFormationNiveau";
import { IndicateursEffectifsAvecFormation } from "../models/indicateurs";

interface CustomColumnDef {
  accessorKey: string;
  header: () => string | JSX.Element;
  style?: any;
}

const formationsTableColumnsDefs: CustomColumnDef[] = [
  {
    accessorKey: "intitule_long",
    header: () => "Niveau et intitulé de la formation",
    style: {
      width: "100%",
    },
  },
  {
    accessorKey: "apprentis",
    header: () => (
      <>
        <ApprentisIcon w="16px" />
        <Text as="span" ml={2} fontSize="sm">
          Apprentis
        </Text>
      </>
    ),
  },
  {
    accessorKey: "inscritsSansContrat",
    header: () => (
      <>
        <InscritsSansContratsIcon w="16px" />
        <Text as="span" ml={2} fontSize="sm">
          Sans contrat
        </Text>
      </>
    ),
  },
  {
    accessorKey: "rupturants",
    header: () => (
      <>
        <RupturantsIcon w="16px" />
        <Text as="span" ml={2} fontSize="sm">
          Ruptures
        </Text>
      </>
    ),
  },
  {
    accessorKey: "abandons",
    header: () => (
      <>
        <AbandonsIcon w="16px" />
        <Text as="span" ml={2} fontSize="sm">
          Sorties
        </Text>
      </>
    ),
  },
];

interface NiveauAvecFormations {
  niveau: string;
  label: string;
  formations: IndicateursEffectifsAvecFormation[];
}

interface FormationsTableEffectifsProps {
  formations: IndicateursEffectifsAvecFormation[];
}
function FormationsTableEffectifs(props: FormationsTableEffectifsProps) {
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
                        RNCP&nbsp;:{" "}
                        {formation.rncp ? (
                          formation.rncp
                        ) : (
                          <Text as="span" color="red">
                            INCONNU
                          </Text>
                        )}{" "}
                        · CFD&nbsp;: {formation.cfd}
                      </Text>
                    </Td>
                    <Td>{formation.apprentis}</Td>
                    <Td>{formation.inscritsSansContrat}</Td>
                    <Td>{formation.rupturants}</Td>
                    <Td>{formation.abandons}</Td>
                  </Tr>
                ))}
            </Fragment>
          ))}
        </Tbody>
      </Table>
    </>
  );
}

export default FormationsTableEffectifs;
