import {
  Box,
  Checkbox,
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

  const { data: formations, isFetching: isLoading } = useQuery<any[]>(
    ["formations", searchTerm],
    () =>
      _post("/api/v1/formations/search", {
        searchTerm,
      }),
    {
      enabled: searchTerm.length >= MINIMUM_CHARS_TO_PERFORM_SEARCH,
    }
  );

  function updateSelection(cfd: string) {
    const index = props.value.indexOf(cfd);
    if (index !== -1) {
      props.onChange(props.value.filter((item) => item !== cfd));
    } else {
      props.onChange([...props.value, cfd]);
    }
  }

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
            <NoResults title="Il n'y a aucun résultat pour votre recherche" />
          )}
          {isLoading && <Loading />}
          {formations && formations.length > 0 && (
            <TableContainer marginTop="1w" textAlign="left">
              <Table variant="primary">
                <Thead>
                  <Tr>
                    <Th>Libellé de la formation</Th>
                    <Th>CFD</Th>
                    <Th>RNCP</Th>
                    <Th>Date de validité du CFD</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {formations?.map((formation) => {
                    return (
                      <Tr onClick={() => updateSelection(formation.cfd)} cursor="pointer" key={formation.cfd}>
                        <Td maxWidth="550px" whiteSpace={"pre-line"}>
                          <Checkbox
                            isChecked={props.value.includes(formation.cfd)}
                            fontSize="caption"
                            pointerEvents="none"
                          >
                            {formation.intitule_long || "N/A"}
                          </Checkbox>
                        </Td>
                        <Td>{formation.cfd}</Td>
                        <Td>{formation.rncp || "N/A"}</Td>
                        {formation.cfd_start_date && formation.cfd_end_date ? (
                          <Td>{`Du ${new Date(formation.cfd_start_date).toLocaleDateString()} au ${new Date(
                            formation.cfd_end_date
                          ).toLocaleDateString()}`}</Td>
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
