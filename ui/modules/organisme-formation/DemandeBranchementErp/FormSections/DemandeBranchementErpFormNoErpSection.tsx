import { Box, Button, FormControl, FormErrorMessage, FormLabel, HStack, Input, Stack, Text } from "@chakra-ui/react";
import { Field } from "formik";

const DemandeBranchementErpFormNoErpSection = ({ isSubmitting }: { isSubmitting: boolean }) => {
  return (
    <>
      <Stack marginTop="3w" marginBottom="3w" direction="row">
        <Box borderLeftWidth="5px" borderRadius="0" borderLeftColor="bluefrances.525">
          <Text fontSize="epsilon" marginLeft="4w" color="grey.800">
            <strong>
              Nous travaillons actuellement à une solution pour vous permettre de transmettre vos effectifs dès la
              rentrée prochaine.
            </strong>
          </Text>
        </Box>
      </Stack>
      <Text fontSize="epsilon" marginTop="2w" color="grey.800" fontWeight="700">
        Pour être informé de l&apos;ouverture de ce nouveau service, veuillez remplir le formulaire ci-dessous :
      </Text>
      <Stack paddingY="3w" spacing="4w">
        <Field name="nom_organisme">
          {({ field, meta }) => (
            <FormControl isRequired isInvalid={meta.error && meta.touched}>
              <FormLabel color="grey.800">Nom de votre organisme</FormLabel>
              <Input {...field} id={field.name} placeholder="Précisez ici..." />
              <FormErrorMessage>{meta.error}</FormErrorMessage>
            </FormControl>
          )}
        </Field>
        <Field name="uai_organisme">
          {({ field, meta }) => (
            <FormControl isRequired isInvalid={meta.error && meta.touched}>
              <FormLabel color="grey.800">UAI formateur de l&apos;organisme</FormLabel>
              <Input {...field} id={field.name} placeholder="Ex : 0011171T" />
              <FormErrorMessage>{meta.error}</FormErrorMessage>
            </FormControl>
          )}
        </Field>
        <Field name="nb_apprentis">
          {({ field, meta }) => (
            <FormControl isInvalid={meta.error && meta.touched}>
              <FormLabel color="grey.800">Nombre d’apprentis sur la dernière année :</FormLabel>
              <Input {...field} id={field.name} type="number" placeholder="Ex : 125" />
              <FormErrorMessage>{meta.error}</FormErrorMessage>
            </FormControl>
          )}
        </Field>
        <Field name="email_demandeur">
          {({ field, meta }) => (
            <FormControl isRequired isInvalid={meta.error && meta.touched}>
              <FormLabel color="grey.800">Email de la personne faisant la demande</FormLabel>
              <Input {...field} id={field.name} placeholder="exemple@mail.fr" />
              <FormErrorMessage>{meta.error}</FormErrorMessage>
            </FormControl>
          )}
        </Field>
        <FormLabel color="grey.800">
          <HStack>
            <Field type="checkbox" name="is_ready_co_construction" />
            <Text>Je souhaite participer à la construction de ce nouveau service !</Text>
          </HStack>
        </FormLabel>
      </Stack>
      <Button type="submit" variant="primary" isLoading={isSubmitting}>
        Envoyer
      </Button>
    </>
  );
};
export default DemandeBranchementErpFormNoErpSection;
