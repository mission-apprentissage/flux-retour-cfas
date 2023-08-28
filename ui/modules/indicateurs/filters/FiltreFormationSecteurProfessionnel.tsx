import { Box, Checkbox, Heading, HStack, Input, InputGroup, InputLeftElement, Spinner } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import TreeView, { flattenTree } from "react-accessible-treeview";

import { _get, _post } from "@/common/httpClient";
import { normalize } from "@/common/utils/stringUtils";
import InputLegend from "@/components/InputLegend/InputLegend";
import { ArrowTriangleDownIcon } from "@/modules/dashboard/icons";
import SimpleOverlayMenu from "@/modules/dashboard/SimpleOverlayMenu";

import { FilterButton } from "../FilterButton";

import { FamilleMetier } from "./secteur-professionnel/arborescence-rome";

interface FiltreFormationSecteurProfessionnelProps {
  value: string[];
  onChange: (value: string[]) => void;
}

const MINIMUM_CHARS_TO_PERFORM_SEARCH = 3;

const FiltreFormationSecteurProfessionnel = (props: FiltreFormationSecteurProfessionnelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: famillesMetier, isFetching: isLoading } = useQuery<FamilleMetier[]>(
    ["arborescence-rome-14-06-2021.json"],
    () => _get("/arborescence-rome-14-06-2021.json"),
    {
      cacheTime: 99999999, // never expire, change the URL if that must expire
    }
  );
  const treeData = useMemo(
    () => (famillesMetier ? flattenTree(normalizeTreeInPlace({ name: "", children: famillesMetier })) : []),
    [famillesMetier]
  );

  const filteredTreeData = useMemo(() => {
    // TODO ne garder que les noeuds qui correspondent et tous leurs ancètres.
    if (searchTerm.length < MINIMUM_CHARS_TO_PERFORM_SEARCH) {
      return treeData;
    }
    // const search = normalize(searchTerm);
    return treeData;
  }, [treeData, searchTerm]);

  return (
    <div>
      <FilterButton
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        buttonLabel="Secteur professionnel"
        badge={props.value.length}
      />

      {isOpen && (
        <SimpleOverlayMenu onClose={() => setIsOpen(false)} px="8w" py="3w" width="var(--chakra-sizes-xl)">
          <Heading as="h3" variant="h3" marginBottom="3w" marginTop="2w">
            Sélectionner un domaine ou sous-domaine d’activité
          </Heading>

          <InputGroup>
            <InputLeftElement pointerEvents="none" fontSize="gamma" className="ri-search-line" as="i" marginTop="3px" />
            <Input
              placeholder="Rechercher un secteur professionnel (ex : immobilier, commerce, santé...))"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              variant="outline"
              size="lg"
              autoFocus
              fontSize="epsilon"
              _placeholder={{ fontSize: "epsilon" }}
            />
          </InputGroup>

          <Box ml="1w" mt="3v" mb={4} minH={6}>
            {searchTerm.length < MINIMUM_CHARS_TO_PERFORM_SEARCH && (
              <InputLegend>
                Merci de renseigner au minimum {MINIMUM_CHARS_TO_PERFORM_SEARCH} caractères pour lancer la recherche
              </InputLegend>
            )}
          </Box>
          {/* {!isLoading && searchTerm.length > 0 && formations?.length === 0 && (
            <Text color="grey.800" fontWeight="700" marginTop="4w" paddingLeft="1w">
              Il n’y a aucun résultat pour votre recherche
            </Text>
          )} */}
          {isLoading && <Spinner />}
          <style>
            {`
              .tree-secteur-professionnel .tree,
              .tree-secteur-professionnel .tree-node,
              .tree-secteur-professionnel .tree-node-group {
                list-style: none;
                margin: 0;
                padding: 0;
              }
            `}
          </style>
          {famillesMetier && (
            <Box className="tree-secteur-professionnel" mt={4} userSelect="none">
              <TreeView
                data={filteredTreeData}
                className="tree-secteur-professionnel"
                aria-label="Checkbox tree"
                multiSelect
                propagateSelect
                propagateSelectUpwards
                togglableSelect
                selectedIds={props.value}
                onNodeSelect={({ treeState }) => {
                  props.onChange(treeState ? Array.from(treeState?.selectedIds as Set<string>) : []);
                }}
                nodeRenderer={({
                  element,
                  isBranch,
                  isExpanded,
                  isSelected,
                  isHalfSelected,
                  getNodeProps,
                  level,
                  handleSelect,
                  handleExpand,
                }) => (
                  <HStack {...getNodeProps({ onClick: handleExpand })} h={8} style={{ marginLeft: 40 * (level - 1) }}>
                    {isBranch && (
                      <ArrowTriangleDownIcon
                        transitionDuration=".3s"
                        transform={isExpanded ? "rotate(0deg)" : "rotate(-90deg)"}
                      />
                    )}
                    <Checkbox
                      isChecked={isSelected}
                      fontSize="caption"
                      isIndeterminate={isHalfSelected}
                      onClickCapture={(e) => {
                        handleSelect(e);
                        e.preventDefault();
                      }}
                      color="#3a3a3a"
                    >
                      {element.name}
                    </Checkbox>
                  </HStack>
                )}
              />
            </Box>
          )}
        </SimpleOverlayMenu>
      )}
    </div>
  );
};

export default FiltreFormationSecteurProfessionnel;

interface Node {
  name: string;
  children?: Node[];

  // computed
  metadata?: {
    normalizedName?: string;
  };
}

function normalizeTreeInPlace(node: Node) {
  node.metadata = {
    normalizedName: normalize(node.name),
  };
  node.children?.forEach((node) => normalizeTreeInPlace(node));
  return node;
}
