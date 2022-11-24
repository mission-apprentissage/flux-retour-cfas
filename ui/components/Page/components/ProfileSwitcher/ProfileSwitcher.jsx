import React from "react";
import { Flex, Menu, MenuButton, MenuList, MenuItem, Text, Box } from "@chakra-ui/react";
import { DoubleArrows } from "../../../../theme/components/icons";
import useAuth from "../../../../hooks/useAuth";

const fakeProfile = (auth) => ({
  ofF: {
    ...auth,
    permissions: {},
    roles: [{ name: "of" }],
    email: "of@test.fr",
    nom: "of",
    prenom: "test",
    description: "Aden formation Caen - direction",
    siret: "44492238900010",
    uai: "0142321X",
    organisation: "ORGANISME_FORMATION",
    organisme_ids: ["637fa2398a3c0baeaf0a649a"],
    main_organisme_id: "637fa2398a3c0baeaf0a649a",
    acl: [],
  },
  ofR: {
    ...auth,
    permissions: {},
    roles: [{ name: "of" }],
    email: "ofr@test.fr",
    nom: "ofr",
    prenom: "test",
    siret: "44492238900010",
    uai: "0142321X",
    organisation: "ORGANISME_FORMATION",
    organisme_ids: ["637fa2398a3c0baeaf0a649a", "637fa2398a3c0baeaf0a649b"],
    main_organisme_id: "637fa2398a3c0baeaf0a649b",
    acl: ["organisme", "organisme/tableau_de_bord"],
  },
  reseau: {
    ...auth,
    permissions: {},
    roles: [{ name: "reseau_of" }],
    siret: "13001727000013",
    reseau: "CCI",
    organisme_ids: ["637fa2398a3c0baeaf0a649a", "637fa2398a3c0baeaf0a649b"],
    acl: ["organisme", "organisme/tableau_de_bord"],
  },
  piloteR: {
    ...auth,
    permissions: {},
    roles: [{ name: "pilot" }],
    siret: "13000992100011",
    codes_region: ["84"],
    organisme_ids: ["637fa2398a3c0baeaf0a649a", "637fa2398a3c0baeaf0a649b"],
    acl: ["organisme", "organisme/tableau_de_bord"],
  },
  piloteD: {
    ...auth,
    permissions: {},
    roles: [{ name: "pilot" }],
    siret: "13000992100011",
    codes_departement: ["61"],
    organisme_ids: ["637fa2398a3c0baeaf0a649a", "637fa2398a3c0baeaf0a649b"],
  },
  piloteA: {
    ...auth,
    permissions: {},
    roles: [{ name: "pilot" }],
    siret: "13000992100011",
    codes_academie: ["70"],
    organisme_ids: ["637fa2398a3c0baeaf0a649a", "637fa2398a3c0baeaf0a649b"],
  },
  erp: {
    ...auth,
    permissions: {},
    roles: [{ name: "erp" }],
    siret: "31497933700081",
    erp: "YMAG",
  },
});

export function ProfileSwitcher(props) {
  let [auth, setAuth] = useAuth();
  const onProfileClicked = (type) => {
    setAuth(fakeProfile(auth)[type]);
  };

  return (
    <Menu placement="bottom">
      <MenuButton {...props}>
        <Flex>
          <DoubleArrows mt="0.3rem" boxSize={4} mr={1} color="bluefrance" />
          <Box display={["none", "block"]}>
            <Text color="bluefrance" textStyle="sm">
              Switch
            </Text>
          </Box>
        </Flex>
      </MenuButton>
      <MenuList p="16px 8px">
        <Flex flexDirection="column">
          <MenuItem borderRadius="8px" mb="10px" onClick={() => onProfileClicked("ofF")}>
            Devenir OF formateur
          </MenuItem>
          <MenuItem borderRadius="8px" mb="10px" onClick={() => onProfileClicked("ofR")}>
            Devenir OF responsable
          </MenuItem>
          <MenuItem borderRadius="8px" onClick={() => onProfileClicked("reseau")}>
            Devenir réseau
          </MenuItem>
          <MenuItem borderRadius="8px" onClick={() => onProfileClicked("piloteR")}>
            Devenir Pilot Région
          </MenuItem>
          <MenuItem borderRadius="8px" onClick={() => onProfileClicked("piloteD")}>
            Devenir Pilot Departement
          </MenuItem>
          <MenuItem borderRadius="8px" onClick={() => onProfileClicked("piloteA")}>
            Devenir Pilot Academie
          </MenuItem>
          <MenuItem borderRadius="8px" onClick={() => onProfileClicked("erp")}>
            Devenir Erp
          </MenuItem>
          <MenuItem borderRadius="8px" onClick={() => alert("You can try!")}>
            Devenir Anne Becquet
          </MenuItem>
        </Flex>
      </MenuList>
    </Menu>
  );
}
