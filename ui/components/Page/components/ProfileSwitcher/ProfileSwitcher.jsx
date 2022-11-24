import React from "react";
import { Flex, Menu, MenuButton, MenuList, MenuItem, Text, Box } from "@chakra-ui/react";
import { DoubleArrows } from "../../../../theme/components/icons";
import useAuth from "../../../../hooks/useAuth";

// {
//   "organisme_ids": [],
//   "permissions": {
//       "is_admin": true,
//       "is_cross_organismes": true
//   },
//   "email": "admin@test.fr",
//   "civility": "Monsieur",
//   "nom": "Admin",
//   "prenom": "SuperTest",
//   "telephone": "+33612647511",
//   "siret": "13002526500013",
//   "codes_region": [],
//   "codes_academie": [],
//   "codes_departement": [],
//   "account_status": "CONFIRMED",
//   "roles": [],
//   "acl": [],
//   "orign_register": "ORIGIN",
//   "has_accept_cgu_version": "v0.1",
//   "_id": "637cdc9c172957402fd0990c",
//   "loggedIn": true
// }

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
    organisme_ids: ["453533583585"],
    acl: [
      "organisme",
      "organisme/tableau_de_bord",
      "organisme/page_effectifs",
      "organisme/page_sifa2",
      "organisme/page_parametres",
      "organisme/page_parametres/gestion_acces",
      "organisme/page_parametres/gestion_acces/supprimer_contributeur",
      "organisme/page_parametres/gestion_notifications",
      "organisme/page_parametres/api_key",
    ],
  },
  ofR: {
    ...auth,
    permissions: {},
    roles: [{ name: "of" }],
  },
  reseau: {
    ...auth,
    permissions: {},
    roles: [{ name: "reseau_of" }],
    reseau: "CCI",
  },
  piloteR: {
    ...auth,
    permissions: {},
    roles: [{ name: "pilot" }],
    codes_region: ["84"],
  },
  piloteD: {
    ...auth,
    permissions: {},
    roles: [{ name: "pilot" }],
    codes_departement: ["61"],
  },
  piloteA: {
    ...auth,
    permissions: {},
    roles: [{ name: "pilot" }],
    codes_academie: ["70"],
  },
  erp: {
    ...auth,
    permissions: {},
    roles: [{ name: "erp" }],
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
