import { SmallCloseIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Checkbox,
  Heading,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import TreeView, { flattenTree } from "react-accessible-treeview";

import { _get, _getUI, _post } from "@/common/httpClient";
import { normalize } from "@/common/utils/stringUtils";
import InputLegend from "@/components/InputLegend/InputLegend";
import { ArrowTriangleDownIcon } from "@/modules/dashboard/icons";
import SimpleOverlayMenu from "@/modules/dashboard/SimpleOverlayMenu";

import { FilterButton } from "../FilterButton";

import {
  FamilleMetier,
  filterRomeNodesByTerm,
  normalizeRomeNodeInPlace,
  RomeNode,
} from "./secteur-professionnel/arborescence-rome";

interface FiltreFormationSecteurProfessionnelProps {
  value: string[];
  onChange: (value: string[]) => void;
}

const MINIMUM_CHARS_TO_PERFORM_SEARCH = 3;

const FiltreFormationSecteurProfessionnel = (props: FiltreFormationSecteurProfessionnelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: famillesMetiers, isFetching: isLoading } = useQuery<RomeNode[]>(
    ["arborescence-rome-14-06-2021.json"],
    async () => {
      const famillersMetiers = await _getUI<FamilleMetier[]>("/arborescence-rome-14-06-2021.json");
      return famillersMetiers.map((familleMetiers) => normalizeRomeNodeInPlace(familleMetiers));
    },
    {
      cacheTime: 99999999, // never expire, change the URL if that must expire
    }
  );

  const filteredFamillesMetiers = useMemo(() => {
    if (!famillesMetiers) {
      return [];
    }
    if (searchTerm.length < MINIMUM_CHARS_TO_PERFORM_SEARCH) {
      return famillesMetiers;
    }
    const normalizedSearchTerm = normalize(searchTerm);

    return filterRomeNodesByTerm(famillesMetiers, normalizedSearchTerm);
  }, [famillesMetiers, searchTerm]);

  const { filteredTreeData } = useMemo(() => {
    const treeData = flattenTree({
      name: "",
      children: filteredFamillesMetiers,
    });
    // expandedIds contient la liste des id de tous les noeuds dès lors qu'il y a une recherche,
    // afin de déplier automatiquement les noeuds qui correspondent
    // désactivé côté composant <TreeView/> car cela ne fonctionne pas quand on change le filtre pour un sous-ensemble
    // cad on passe de "hot" = "hote" et une erreur comme quoi certains noeuds ne sont plus trouvés
    // sans doute une issue à lever côté react-accessible-treeview
    return {
      filteredTreeData: treeData,
      expandedIds:
        searchTerm.length >= MINIMUM_CHARS_TO_PERFORM_SEARCH
          ? // hack: reverse pour faire en sorte que l'id root soit en dernier sinon la lib sélectionne
            // le dernier élément et on perd le focus de la recherche
            treeData.map((node) => node.id).reverse()
          : [],
    };
  }, [filteredFamillesMetiers]);

  return (
    <div>
      <FilterButton
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        buttonLabel="Secteur professionnel"
        badge={props.value.length}
      />

      {isOpen && (
        <SimpleOverlayMenu
          onClose={() => setIsOpen(false)}
          limitedHeight={false}
          px="8w"
          py="3w"
          width="var(--chakra-sizes-xl)"
        >
          <Heading as="h3" variant="h3" marginBottom="3w" marginTop="2w">
            Sélectionner un domaine ou sous-domaine d’activité
          </Heading>

          <InputGroup>
            <InputLeftElement pointerEvents="none" fontSize="gamma" className="ri-search-line" as="i" marginTop="3px" />
            <Input
              placeholder="Rechercher un secteur professionnel (ex : immobilier, commerce, santé...)"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              variant="outline"
              size="lg"
              autoFocus
              fontSize="epsilon"
              _placeholder={{ fontSize: "epsilon" }}
            />
            <InputRightElement>
              <Button variant="unstyled" size="sm" onClick={() => setSearchTerm("")}>
                <SmallCloseIcon boxSize={4} />
              </Button>
            </InputRightElement>
          </InputGroup>

          <Box ml="1w" mt="3v" mb={4} minH={6}>
            {searchTerm.length < MINIMUM_CHARS_TO_PERFORM_SEARCH && (
              <InputLegend>
                Merci de renseigner au minimum {MINIMUM_CHARS_TO_PERFORM_SEARCH} caractères pour lancer la recherche
              </InputLegend>
            )}
          </Box>

          <Button variant="link" onClick={() => props.onChange([])}>
            Réinitialiser la sélection
          </Button>
          {!isLoading && searchTerm.length >= MINIMUM_CHARS_TO_PERFORM_SEARCH && filteredTreeData?.length === 1 && (
            <Text color="grey.800" fontWeight="700" marginTop="4w" paddingLeft="1w">
              Il n’y a aucun résultat pour votre recherche
            </Text>
          )}
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
          {famillesMetiers && (
            <Box className="tree-secteur-professionnel" mt={4} userSelect="none">
              <TreeView
                data={filteredTreeData}
                className="tree-secteur-professionnel"
                aria-label="Secteurs professionnels"
                multiSelect
                // A réactiver une fois le bug corrigé, voir plus haut
                // expandedIds={expandedIds}
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
                        e.preventDefault(); // prevents triggering another tick
                        e.stopPropagation(); // prevents toggling the node
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
