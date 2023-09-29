import { Box, Button, FormControl, FormErrorMessage, FormLabel, Input, Stack, Text } from "@chakra-ui/react";
import { Field } from "formik";

import { PRODUCT_NAME } from "@/common/constants/product";

const DemandeBranchementErpFormOtherErpSection = ({ isSubmitting }: { isSubmitting: boolean }) => {
  return (
    <>
      <Stack marginTop="3w" marginBottom="3w" direction="row">
        <Box borderLeftWidth="5px" borderRadius="0" borderLeftColor="bluefrances.525">
          <Text fontSize="epsilon" marginLeft="4w" color="grey.800">
            <strong>L&apos;interfaçage du {PRODUCT_NAME} avec l&apos;ensemble des ERP est en cours.</strong>
            &nbsp;Nous sommes en contact avec l&apos;ensemble des ERP afin de permettre à tous les organismes de
            formation de transmettre leur données et d&apos;accéder au {PRODUCT_NAME}. Pour encourager la mise en oeuvre
            de ces travaux nous vous invitons à faire part de votre besoin à votre éditeur de logiciel ERP.
          </Text>
        </Box>
      </Stack>
      <Text marginTop="2w" color="grey.800" fontWeight="700">
        Merci de nous communiquer les informations sur votre organisme pour nous aider à prioriser nos travaux :
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
        <Field name="autre_erp_nom">
          {({ field, meta }) => (
            <FormControl isRequired isInvalid={meta.error && meta.touched}>
              <FormLabel color="grey.800">Quel est votre ERP ?</FormLabel>
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
      </Stack>
      <Button type="submit" variant="primary" isLoading={isSubmitting}>
        Envoyer
      </Button>
    </>
  );
};

export default DemandeBranchementErpFormOtherErpSection;
