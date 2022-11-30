import { useRecoilValue } from "recoil";
import { dossierAtom } from "../../atoms";
import { Divider, Flex, HStack, Stack, Text } from "@chakra-ui/react";
import React, { useState } from "react";
import { useSignatures } from "../hooks/useSignatures";
import { Input } from "../../formEngine/components/Input/Input";

export const SignatairesForm = () => {
  const dossier = useRecoilValue(dossierAtom);
  const { apprenti, employeur, cfa, legal } = dossier.signataires;

  const emails = {
    apprenti: apprenti?.email,
    employeur: employeur?.email,
    cfa: cfa?.email,
    legal: legal?.email,
  };

  return (
    <>
      <Text mb={5}>Coordonnées des signataires du contrat :</Text>
      <Flex flexDirection="column">
        {employeur && (
          <Stack mb={5}>
            <Text fontWeight="bold">Employeur :</Text>
            <SignataireLineForm signataire={employeur} type="employeur" emails={emails} />
          </Stack>
        )}
        <Divider />
        {cfa && (
          <Stack mb={5} mt={6}>
            <Text fontWeight="bold">CFA :</Text>
            <SignataireLineForm signataire={cfa} type="cfa" emails={emails} />
          </Stack>
        )}
        <Divider />
        {apprenti && (
          <Stack mb={5} mt={6}>
            <Text fontWeight="bold">Pour l&apos;apprenti(e) :</Text>
            <SignataireLineForm signataire={apprenti} type="apprenti" emails={emails} />
          </Stack>
        )}
        <Divider />
        {legal && (
          <Stack mt={8}>
            <Text fontWeight="bold">Pour le représentant légal de l&apos;apprenti(e) :</Text>
            <SignataireLineForm signataire={legal} type="legal" emails={emails} />
          </Stack>
        )}
      </Flex>
    </>
  );
};

const SignataireLineForm = ({ signataire, type, emails }) => {
  const { onSubmittedSignataireDetails } = useSignatures();

  const [firstname, setFirstname] = useState(signataire.firstname);
  const [lastname, setLastname] = useState(signataire.lastname);
  const [email, setEmail] = useState(signataire.email);

  return (
    <HStack spacing={3}>
      <Input
        required={true}
        name={`signataire.${type}.lastname`}
        label="Nom"
        value={lastname || ""}
        mask="C"
        maskBlocks={[
          {
            name: "C",
            mask: "Pattern",
            pattern: "^[a-zA-Z]*$",
          },
        ]}
        mb={0}
        w="20%"
        onError={(val, name) => {
          onSubmittedSignataireDetails("", name);
        }}
        onSubmit={onSubmittedSignataireDetails}
        onChange={setLastname}
      />
      <Input
        required={true}
        name={`signataire.${type}.firstname`}
        label="Prénom"
        value={firstname || ""}
        mask="C"
        maskBlocks={[
          {
            name: "C",
            mask: "Pattern",
            pattern: "^[a-zA-Z]*$",
          },
        ]}
        mt={0}
        w="20%"
        onError={(val, name) => {
          onSubmittedSignataireDetails("", name);
        }}
        onSubmit={onSubmittedSignataireDetails}
        onChange={setFirstname}
      />
      <Input
        required={true}
        name={`signataire.${type}.email`}
        label="Courriel"
        value={email}
        mask="C"
        maskBlocks={[
          {
            name: "C",
            mask: "Pattern",
            pattern: "^.*$",
          },
        ]}
        fieldType="email"
        mt={0}
        w="40%"
        onError={(val, name) => {
          onSubmittedSignataireDetails("", name);
        }}
        onSubmit={onSubmittedSignataireDetails}
        onChange={setEmail}
        validate={({ value }) => {
          const filteredEmails = { ...emails };
          delete filteredEmails[type];
          if (Object.values(filteredEmails).includes(value)) {
            return { error: "Chaque courriel des signataires doit être unique" };
          }
        }}
      />
    </HStack>
  );
};
