import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Link,
  Select,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import PropTypes from "prop-types";
import React from "react";
import { NavLink } from "react-router-dom";
import * as Yup from "yup";

import { ERP_STATE, ERPS } from "../../../../common/constants/erps";
import { uaiRegex } from "../../../../common/domain/uai";
import withSubmitBranchementErpDemand, { SUBMIT_STATE } from "./withSubmitBranchementErpDemand";

const formInitialValues = { erpIndex: 0, nom_organisme: "", uai_organisme: "", nb_apprentis: "", email_demandeur: "" };

const ErpSelectionList = [{ name: "Sélectionnez une option", state: null }].concat(ERPS);

const Message = ({ iconClassName, title, message }) => {
  return (
    <>
      <Flex fontWeight="700" fontSize="beta" color="grey.800" alignItems="center">
        <Box as="i" fontSize="alpha" textColor="bluefrance" className={iconClassName} />
        <Text paddingLeft="2w">{title}</Text>
      </Flex>
      <Text paddingX="6w" color="grey.800">
        {message}
      </Text>
      <HStack marginTop="10w" spacing="1w">
        <Box as="i" className="ri-arrow-left-line"></Box>
        <NavLink to="/">Retourner à la page d&apos;accueil</NavLink>
      </HStack>
    </>
  );
};

Message.propTypes = {
  iconClassName: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
};

const DemandeBranchementErpForm = ({ sendBranchementErpDemand, submitState, erpState }) => {
  if (submitState === SUBMIT_STATE.success) {
    if (erpState === ERP_STATE.ongoing) {
      return (
        <Message
          iconClassName="ri-checkbox-circle-fill"
          title="Vos coordonnées ont bien été envoyées"
          message="Vous serez tenu informé de l’évolution des travaux d’interfaçage avec votre ERP."
        />
      );
    }
    if (erpState === ERP_STATE.coming) {
      return (
        <Message
          iconClassName="ri-checkbox-circle-fill"
          title="Vos informations ont bien été envoyées"
          message="Vous serez tenu informé de l’évolution des travaux d’interfaçage avec votre ERP."
        />
      );
    }
  }

  if (submitState === SUBMIT_STATE.fail) {
    if (erpState === ERP_STATE.ongoing) {
      return (
        <Message
          iconClassName="ri-close-circle-fill"
          title="Nous avons rencontré une erreur lors de la soumission de vos coordonnées."
          message="Merci de réessayer ultérieurement."
        />
      );
    }
    if (erpState === ERP_STATE.coming) {
      return (
        <Message
          iconClassName="ri-close-circle-fill"
          title="Nous avons rencontré une erreur lors de la soumission de vos informations"
          message="Merci de réessayer ultérieurement."
        />
      );
    }
  }

  return (
    <Formik
      initialValues={formInitialValues}
      validationSchema={Yup.object().shape({
        nom_organisme: Yup.string().required("Requis"),
        uai_organisme: Yup.string().matches(uaiRegex, "UAI invalide").required("Requis"),
        nb_apprentis: Yup.string(),
        email_demandeur: Yup.string().email("Format d'email invalide").required("Requis"),
      })}
      onSubmit={sendBranchementErpDemand}
    >
      {({ isSubmitting, values }) => (
        <Form>
          <Stack spacing="2w">
            <Field name="erpIndex">
              {({ field, meta }) => (
                <FormControl isRequired isInvalid={meta.error && meta.touched}>
                  <FormLabel color="grey.800">ERP ou logiciel de gestion utilisé</FormLabel>
                  <Select {...field}>
                    {ErpSelectionList.map((erp, index) => (
                      <option key={index} value={index}>
                        {erp.name}
                      </option>
                    ))}
                  </Select>
                  <FormErrorMessage>{meta.error}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
          </Stack>

          {/* Cas ERP Ready */}
          {ErpSelectionList[values.erpIndex].state === ERP_STATE.ready && (
            <>
              <Stack marginTop="3w" marginBottom="3w" direction="row">
                <Box w="2%" bg="#6A6AF4" marginRight="3w" />
                <Text color="grey.800">
                  <strong>Le tableau de bord est interfacé avec cet ERP.</strong> Vous pouvez l&apos;autoriser à
                  transmettre vos données en 2 clics via une fonctionnalité disponible dans l&apos;interface de votre
                  logiciel de gestion.
                </Text>
              </Stack>
              <Link target="_blank" href={ErpSelectionList[values.erpIndex].helpFilePath}>
                <Button leftIcon={<Box as="i" className="ri-download-line" />} variant="primary">
                  Télécharger le pas à pas
                </Button>
              </Link>
              <Text marginTop="2w" fontSize="omega" fontWeight="800" color="grey.800">
                Ce pas à pas a été élaboré par votre ERP, en cas de difficulté{" "}
                <Link
                  color="bluefrance"
                  textDecoration="underline"
                  href={`mailto:${ErpSelectionList[values.erpIndex].contactMail}`}
                >
                  contactez leur service support
                </Link>
              </Text>
              <HStack marginTop="10w" spacing="1w">
                <Box as="i" className="ri-arrow-left-line"></Box>
                <NavLink to="/">Retourner à la page d&apos;accueil</NavLink>
              </HStack>
            </>
          )}

          {/* Cas ERP OnGoing */}
          {ErpSelectionList[values.erpIndex].state === ERP_STATE.ongoing && (
            <>
              <Stack marginTop="3w" marginBottom="3w" direction="row">
                <Box w="2%" bg="#6A6AF4" marginRight="3w" />
                <Text color="grey.800">
                  <strong>
                    L&apos;interfaçage du tableau de bord avec cet ERP a démarré mais les travaux ne sont pas achevés.
                  </strong>
                  Nous vous invitons à lui faire part de votre besoin de transmettre vos données au Tableau de bord de
                  l&apos;apprentissage afin d&apos;accélérer leur livraison.
                </Text>
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
          )}

          {/* Cas ERP Coming */}
          {ErpSelectionList[values.erpIndex].state === ERP_STATE.coming && (
            <>
              <Stack marginTop="3w" marginBottom="3w" direction="row">
                <Box w="2%" bg="#6A6AF4" marginRight="3w" />
                <Text color="grey.800">
                  <strong>L&apos;interfaçage du tableau de bord avec cet ERP n’a pas encore démarré.</strong>
                  Nous vous invitons à lui faire part de votre besoin de transmettre vos données au Tableau de bord de
                  l&apos;apprentissage.
                </Text>
              </Stack>
              <Text marginTop="2w" color="grey.800" fontWeight="700">
                Merci de nous communiquer les informations sur votre organisme :
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
                    <FormControl isRequired isInvalid={meta.error && meta.touched}>
                      <FormLabel color="grey.800">Nombre d’apprentis sur la dernière année :</FormLabel>
                      <Input {...field} id={field.name} placeholder="Ex : 125" />
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
          )}
        </Form>
      )}
    </Formik>
  );
};

DemandeBranchementErpForm.propTypes = {
  sendBranchementErpDemand: PropTypes.func.isRequired,
  submitState: PropTypes.oneOf(Object.values(SUBMIT_STATE)).isRequired,
  erpState: PropTypes.oneOf(Object.values(ERP_STATE)).isRequired,
};

export default withSubmitBranchementErpDemand(DemandeBranchementErpForm);
