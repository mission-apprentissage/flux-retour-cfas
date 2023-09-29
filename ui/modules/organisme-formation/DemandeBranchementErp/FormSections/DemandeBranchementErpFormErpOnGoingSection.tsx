import { Box, Button, FormControl, FormErrorMessage, FormLabel, Input, Stack, Text } from "@chakra-ui/react";
import { Field } from "formik";

import { PRODUCT_NAME } from "@/common/constants/product";

const DemandeBranchementErpFormErpOnGoingSection = ({ isSubmitting }: { isSubmitting: boolean }) => {
  return (
    <>
      <Stack marginTop="3w" marginBottom="3w" direction="row">
        <Box borderLeftWidth="5px" borderRadius="0" borderLeftColor="bluefrances.525">
          <Text fontSize="epsilon" marginLeft="4w" color="grey.800">
            <strong>
              L&apos;interfaçage du {PRODUCT_NAME} avec cet ERP a démarré mais les travaux ne sont pas achevés.
            </strong>
            &nbsp;Nous vous invitons à lui faire part de votre besoin de transmettre vos données au {PRODUCT_NAME} afin
            d&apos;accélérer leur livraison.
          </Text>
        </Box>
      </Stack>
      <Text marginTop="2w" color="grey.800" fontWeight="700">
        Renseignez vos coordonnées pour être informé des évolutions :
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

export default DemandeBranchementErpFormErpOnGoingSection;
