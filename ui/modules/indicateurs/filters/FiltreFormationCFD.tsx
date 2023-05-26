import {
  Box,
  Divider,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import React, { Dispatch, SetStateAction, useState } from "react";

import { _post } from "@/common/httpClient";
import InputLegend from "@/components/InputLegend/InputLegend";
import Loading from "@/components/Loading/Loading";
import NoResults from "@/components/NoResults/NoResults";
import SimpleOverlayMenu from "@/modules/dashboard/SimpleOverlayMenu";

interface FiltreFormationCFDProps {
  value: string[];
  onChange: (value: string[]) => void;
  button: ({
    isOpen,
    setIsOpen,
    buttonLabel,
  }: {
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
    buttonLabel: string;
  }) => JSX.Element;
}

const MINIMUM_CHARS_TO_PERFORM_SEARCH = 3;

const FiltreFormationCFD = (props: FiltreFormationCFDProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: formations, isLoading } = useQuery<any[]>(
    ["formations", searchTerm],
    () =>
      // TODO nouvelle route qui recherche dans oraganism
      _post("/api/formations/search", {
        searchTerm,
      }),
    {
      enabled: searchTerm.length >= MINIMUM_CHARS_TO_PERFORM_SEARCH,
    }
  );

  return (
    <div>
      {props.button({ setIsOpen, isOpen, buttonLabel: "Type de formation" })}

      {isOpen && (
        <SimpleOverlayMenu onClose={() => setIsOpen(false)} px="8w" py="3w">
          <Heading as="h3" variant="h3" marginBottom="3w" marginTop="2w">
            Sélectionner une formation
          </Heading>

          <InputGroup>
            <InputLeftElement pointerEvents="none" fontSize="gamma" className="ri-search-line" as="i" marginTop="3px" />
            <Input
              placeholder="Intitulé de la formation, CFD, RNCP(s)"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              variant="outline"
              size="lg"
              autoFocus
              fontSize="epsilon"
              _placeholder={{ fontSize: "epsilon" }}
            />
          </InputGroup>
          {searchTerm.length < MINIMUM_CHARS_TO_PERFORM_SEARCH && (
            <Box paddingLeft="1w" paddingTop="3v">
              <InputLegend>
                Merci de renseigner au minimum {MINIMUM_CHARS_TO_PERFORM_SEARCH} caractères pour lancer la recherche
              </InputLegend>
              <Divider marginTop="3v" borderBottomColor="grey.300" orientation="horizontal" />
            </Box>
          )}
          {searchTerm.length > 0 && formations?.length === 0 && (
            <NoResults title="Il n'y a aucun résultat pour votre recherche sur le territoire sélectionné" />
          )}
          {isLoading && <Loading />}
          {formations?.length && formations.length > 0 && (
            <TableContainer marginTop="1w" textAlign="left" maxHeight="18rem" overflowY="scroll">
              <Table variant="primary">
                <Thead>
                  <Tr>
                    <Th>Libellé de la formation</Th>
                    <Th>CFD</Th>
                    <Th>RNCP(s)</Th>
                    <Th>Date de validité du CFD</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {formations?.map((formation) => {
                    // const isRowSelected = formation.cfd === selectedValue?.cfd;
                    const isRowSelected = false;
                    const cfdStartDate = formation.cfd_start_date
                      ? new Date(formation.cfd_start_date).toLocaleDateString()
                      : null;
                    const cfdEndDate = formation.cfd_end_date
                      ? new Date(formation.cfd_end_date).toLocaleDateString()
                      : null;

                    return (
                      <Tr
                        onClick={() => {
                          props.onChange(formation);
                        }}
                        borderLeft={isRowSelected ? "solid 2px" : "none"}
                        key={formation.cfd}
                      >
                        <Td maxWidth="550px" whiteSpace={"pre-line"}>
                          {formation.libelle || "N/A"}
                        </Td>
                        <Td>{formation.cfd}</Td>
                        <Td whiteSpace={"pre-line"}>{formation.rncps?.join(", ") || "N/A"}</Td>
                        {cfdStartDate && cfdEndDate ? (
                          <Td>{`Du ${cfdStartDate} au ${cfdEndDate}`}</Td>
                        ) : (
                          <Td fontStyle="italic">N/A</Td>
                        )}
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </SimpleOverlayMenu>
      )}
    </div>
  );
};

export default FiltreFormationCFD;
