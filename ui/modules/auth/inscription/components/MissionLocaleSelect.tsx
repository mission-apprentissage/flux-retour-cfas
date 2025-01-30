import { Box, Input, List, ListItem, Spinner } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";

import { _get } from "@/common/httpClient";

import { SetterOrganisation } from "../common";

interface MissionLocale {
  id: number;
  nom: string;
  siret: string;
  localisation: {
    ville: string;
    cp: string;
  };
}

interface MissionLocaleSelectProps {
  setOrganisation: SetterOrganisation;
}

export const MissionLocaleSelect = ({ setOrganisation }: MissionLocaleSelectProps) => {
  const { data: missionLocales, isLoading } = useQuery<MissionLocale[]>(["mission-locale"], async () =>
    _get("/api/v1/mission-locale")
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const filteredLocales = missionLocales
    ? missionLocales
        .filter((ml) =>
          `${ml.nom} ${ml.localisation.ville} ${ml.localisation.cp}`.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => a.localisation.ville.localeCompare(b.localisation.ville))
    : [];

  const handleSelect = (ml: MissionLocale) => {
    setSelectedValue(`${ml.nom} (${ml.localisation.ville} - ${ml.localisation.cp})`);
    setSearchTerm("");
    setIsOpen(false);

    setOrganisation({
      type: "MISSION_LOCALE",
      nom: ml.nom,
      siret: ml.siret,
      ml_id: ml.id,
    });
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
              key={ml.id}
              p={2}
              cursor="pointer"
              bg={highlightIndex === index ? "gray.100" : "white"}
              _hover={{ bg: "gray.200" }}
              onClick={() => handleSelect(ml)}
            >
              {ml.nom} ({ml.localisation.ville} - {ml.localisation.cp})
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};
