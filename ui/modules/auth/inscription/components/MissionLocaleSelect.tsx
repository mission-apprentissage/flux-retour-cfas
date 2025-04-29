import { Box, Input, List, ListItem, Spinner } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import type { IMissionLocale } from "api-alternance-sdk";
import { useState, useRef, useEffect } from "react";
import { IOrganisationMissionLocale } from "shared";

import { _get } from "@/common/httpClient";

import { SetterOrganisation } from "../common";

interface MissionLocaleSelectProps {
  setOrganisation: SetterOrganisation;
}

export const MissionLocaleSelect = ({ setOrganisation }: MissionLocaleSelectProps) => {
  const { data: missionLocales, isLoading } = useQuery<
    { organisation: IOrganisationMissionLocale; externalML: IMissionLocale }[]
  >(["mission-locale"], async () => _get("/api/v1/admin/mission-locale"));

  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const filteredLocales = missionLocales
    ? missionLocales
        .filter((ml) =>
          `${ml.externalML.nom} ${ml.externalML.localisation.ville} ${ml.externalML.localisation.cp}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => a.externalML.localisation.ville.localeCompare(b.externalML.localisation.ville))
    : [];
  const handleSelect = ({
    organisation,
    externalML,
  }: {
    organisation: IOrganisationMissionLocale;
    externalML: IMissionLocale;
  }) => {
    setSelectedValue(`${externalML.nom} (${externalML.localisation.ville} - ${externalML.localisation.cp})`);
    setSearchTerm("");
    setIsOpen(false);
    const { adresse, ...restOrga } = organisation;
    setOrganisation(restOrga);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!filteredLocales.length) return;

    if (e.key === "ArrowDown") {
      setHighlightIndex((prev) => Math.min(prev + 1, filteredLocales.length - 1));
    } else if (e.key === "ArrowUp") {
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      handleSelect(filteredLocales[highlightIndex]);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <Box position="relative" ref={containerRef}>
      <Input
        placeholder="Rechercher une mission locale..."
        value={selectedValue || searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setSelectedValue(null);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
      />

      {isLoading && <Spinner position="absolute" right="10px" top="12px" size="sm" />}

      {isOpen && filteredLocales.length > 0 && (
        <List
          position="absolute"
          w="100%"
          bg="white"
          borderRadius="md"
          boxShadow="md"
          zIndex={10}
          maxH="200px"
          overflowY="auto"
        >
          {filteredLocales.map((ml, index) => (
            <ListItem
              key={ml.organisation._id.toString()}
              p={2}
              cursor="pointer"
              bg={highlightIndex === index ? "gray.100" : "white"}
              _hover={{ bg: "gray.200" }}
              onClick={() => handleSelect(ml)}
            >
              {ml.externalML.nom} ({ml.externalML.localisation.ville} - {ml.externalML.localisation.cp})
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};
