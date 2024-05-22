import {
  Box,
  Checkbox,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Skeleton,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { _post } from "@/common/httpClient";
import InputLegend from "@/components/InputLegend/InputLegend";
import { InfoTooltip } from "@/components/Tooltip/InfoTooltip";
import SimpleOverlayMenu from "@/modules/dashboard/SimpleOverlayMenu";

import { FilterButton } from "../FilterButton";

interface FiltreFormationCFDProps {
  value: string[];
  onChange: (value: string[]) => void;
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
      <FilterButton isOpen={isOpen} setIsOpen={setIsOpen} buttonLabel="Type de formation" badge={props.value.length} />

      {isOpen && (
        <SimpleOverlayMenu onClose={() => setIsOpen(false)} px="8w" py="3w" width="var(--chakra-sizes-xl)">
          <Heading as="h3" variant="h3" marginBottom="3w" marginTop="2w">
            Sélectionner une formation
          </Heading>
          <InputGroup>
            <InputLeftElement pointerEvents="none" fontSize="gamma" className="ri-search-line" as="i" marginTop="3px" />
            <Input
              placeholder="Intitulé de la formation, Code Formation Diplôme, RNCP(s)"
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
            </Box>
          )}
          {!isLoading && searchTerm.length > 0 && formations?.length === 0 && (
            <Text color="grey.800" fontWeight="700" marginTop="4w" paddingLeft="1w">
              Il n’y a aucun résultat pour votre recherche
            </Text>
          )}
          {isLoading && (
            <Stack spacing="2w" paddingLeft="1w" marginTop="4w">
              <Skeleton startColor="grey.300" endColor="grey.500" width="100%" height="1.5rem" />;
              <Skeleton startColor="grey.300" endColor="grey.500" width="100%" height="1.5rem" />;
              <Skeleton startColor="grey.300" endColor="grey.500" width="100%" height="1.5rem" />;
              <Skeleton startColor="grey.300" endColor="grey.500" width="100%" height="1.5rem" />;
              <Skeleton startColor="grey.300" endColor="grey.500" width="100%" height="1.5rem" />;
            </Stack>
          )}
          {formations && formations.length > 0 && (
            <TableContainer marginTop="4w" textAlign="left">
              <Table variant="primary">
                <Thead>
                  <Tr>
                    <Th>Libellé de la formation</Th>
                    <Th>
                      CFD
                      <InfoTooltip
                        contentComponent={() => (
                          <Box>
                            <b>Code Formation Diplôme (CFD)</b>
                            <Text as="p">
                              Codification qui concerne l’ensemble des diplômes technologiques et professionnels des
                              ministères certificateurs.
                            </Text>
                            <Text as="p">
                              Y sont ajoutés, en tant que de besoin et à la demande des centres de formation par
                              l’apprentissage, les autres diplômes et titres inscrits au répertoire national des
                              certifications professionnelles (RNCP), dès lors qu’ils sont préparés par la voie de
                              l’apprentissage.
                            </Text>
                          </Box>
                        )}
                        aria-label="Code Formation Diplôme. Codification qui concerne l’ensemble des diplômes technologiques et professionnels des
                        ministères certificateurs."
                      />
                    </Th>
                    <Th>
                      RNCP
                      <InfoTooltip
                        contentComponent={() => (
                          <Box>
                            <b>Répertoire national des certifications professionnelles (RNCP)</b>
                            <Text as="p">
                              Le Répertoire national des certifications professionnelles (RNCP) sert à tenir à la
                              disposition de tous une information constamment à jour sur les diplômes et les titres à
                              finalité professionnelle ainsi que sur les certificats de qualification. La mise à jour du
                              RNCP est confiée à France compétences.
                            </Text>
                          </Box>
                        )}
                        aria-label=" Le Répertoire national des certifications professionnelles (RNCP) sert à tenir à la disposition de tous une information constamment à jour sur les diplômes et les titres à finalité professionnelle ainsi que sur les certificats de qualification."
                      />
                    </Th>
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
