import { SearchIcon } from "@chakra-ui/icons";
import {
  Box,
  FormControl,
  FormErrorMessage,
  Input,
  InputGroup,
  InputRightElement,
  Spinner,
  List,
  ListItem,
  Text,
  Button,
  Flex,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useFormik } from "formik";
import React, { useState } from "react";
import { OrganismeSupportInfoJson } from "shared";
import { z } from "zod";

import { _get } from "@/common/httpClient";

interface AutoCompleteProps {
  onSelect: (organisme: OrganismeSupportInfoJson) => void;
}

interface ExtendedOrganisme extends OrganismeSupportInfoJson {
  id: string;
}

export const AutoCompleteOrganismes: React.FC<AutoCompleteProps> = ({ onSelect }) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const validate = (values: { q: string }) => {
    const schema = z.object({ q: z.string().min(3, "Entrez au moins 3 caractères pour rechercher.") });
    const validation = schema.safeParse(values);
    return validation.success ? {} : validation.error.flatten().fieldErrors;
  };

  const formik = useFormik({
    initialValues: { q: "" },
    validate,
    onSubmit: (values) => {
      setQuery(values.q);
      setIsOpen(true);
    },
  });

  const { data, isFetching } = useQuery<ExtendedOrganisme[]>(
    ["organismes", query],
    () => _get<ExtendedOrganisme[]>(`/api/v1/admin/organismes/search/${query}`, { params: { q: query } }),
    {
      enabled: query.length >= 3,
    }
  );

  const handleSelect = (organisme: ExtendedOrganisme) => {
    onSelect(organisme);
    formik.resetForm();
    setQuery("");
    setIsOpen(false);
  };

  return (
    <Box>
      <form onSubmit={formik.handleSubmit}>
        <FormControl isInvalid={Boolean(formik.errors.q)}>
          <Popover
            isOpen={isOpen}
            placement="bottom-start"
            onClose={() => setIsOpen(false)}
            closeOnBlur={true}
            matchWidth
          >
            <PopoverTrigger>
              <InputGroup>
                <Input
                  id="q"
                  name="q"
                  placeholder="Exemple : 824362578 00075"
                  value={formik.values.q}
                  onChange={(e) => {
                    formik.handleChange(e);
                    if (!e.target.value) setIsOpen(false);
                  }}
                  onFocus={() => query && setIsOpen(true)}
                  onBlur={formik.handleBlur}
                />
                <InputRightElement>
                  <Button type="submit" backgroundColor="bluefrance" isLoading={isFetching}>
                    <SearchIcon textColor="white" />
                  </Button>
                </InputRightElement>
              </InputGroup>
            </PopoverTrigger>
            <PopoverContent
              borderColor="gray.200"
              borderRadius="md"
              width="100%"
              maxW="none"
              style={{
                minWidth: "inherit",
              }}
            >
              <PopoverBody p={0}>
                {isFetching ? (
                  <Flex justifyContent="center" alignItems="center" minH="100px">
                    <Spinner size="lg" />
                  </Flex>
                ) : data && data.length > 0 ? (
                  <List maxH="200px" overflowY="auto">
                    {data.map((organisme) => (
                      <ListItem
                        key={organisme.id}
                        p={2}
                        _hover={{ bg: "gray.100", cursor: "pointer" }}
                        onClick={() => handleSelect(organisme)}
                      >
                        <Text fontWeight="bold">{organisme.nom}</Text>
                        <Text fontSize="sm">
                          UAI: {organisme.uai} | SIRET: {organisme.siret}
                        </Text>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Text textAlign="center" color="gray.500" py={2}>
                    Aucun résultat trouvé.
                  </Text>
                )}
              </PopoverBody>
            </PopoverContent>
          </Popover>
          {formik.errors.q && <FormErrorMessage>{formik.errors.q}</FormErrorMessage>}
        </FormControl>
      </form>
    </Box>
  );
};
