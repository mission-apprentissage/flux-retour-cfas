import React from "react";
import { useFormik } from "formik";
import Head from "next/head";
import NavLink from "next/link";
import * as Yup from "yup";
import {
  Box,
  Heading,
  Button,
  FormControl,
  FormLabel,
  Container,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  FormErrorMessage,
  Tbody,
  Textarea,
  Divider,
  Text,
  Switch,
  RadioGroup,
  Radio,
  VStack,
  HStack,
  useToast,
} from "@chakra-ui/react";

import { _post, _put, _delete } from "../../common/httpClient";
import useMaintenanceMessages from "../../hooks/useMaintenanceMessages";
import { ArrowDropRightLine, Trash } from "../../theme/components/icons";
import Table from "../../components/tables/Table";
import { Page } from "../../components/Page/Page";
import withAuth from "../../components/withAuth";
import { getAuthServerSideProps } from "../../common/SSR/getAuthServerSideProps";

const ADMIN_MAINTENANCE_ENDPOINT = "/api/v1/admin/maintenanceMessages";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const Message = () => {
  const {
    messages,
    messageMaintenance,
    messageAutomatique,
    loading,
    refetch: refetchMaintenanceMessages,
  } = useMaintenanceMessages();

  const toast = useToast();
  // TODO hook custom qui gère les raccourci de toasts
  const toastSuccess = (title) =>
    toast({
      title,
      status: "success",
      isClosable: true,
    });
  const toastError = (title) =>
    toast({
      title,
      status: "error",
      isClosable: true,
    });

  const onSubmitMessage = async ({ msg, type, context }) => {
    try {
      const isNewMessage =
        context === "manuel" ? true : context === "maintenance" ? !messageMaintenance : !messageAutomatique;
      const messageIdIfupdate = context !== "maintenance" ? messageAutomatique?._id : messageMaintenance?._id;

      const messagePosted = await (isNewMessage
        ? _post(ADMIN_MAINTENANCE_ENDPOINT, {
            type,
            context,
            msg,
            enabled: true,
          })
        : _put(`${ADMIN_MAINTENANCE_ENDPOINT}/${messageIdIfupdate}`, {
            type,
            context,
            msg,
            enabled: false,
          }));

      if (messagePosted) {
        toastSuccess("Le message a bien été envoyé/mise à jour.");
        await refetchMaintenanceMessages();
      }
    } catch (e) {
      console.error(e);
      toastError("Oups, une erreur est survenue. Merci de réessayer plus tard.");
    }
  };

  const { errors, touched, setFieldValue, values, handleSubmit, handleChange } = useFormik({
    initialValues: { msg: "", type: "", context: "manuel" },
    onSubmit: onSubmitMessage,
    validationSchema: Yup.object().shape({
      msg: Yup.string().required("Champs obligatoire"),
      context: Yup.string().required("Champs obligatoire"),
      type: Yup.string().when("context", {
        is: "manuel",
        then: (schema) => schema.required("Champs obligatoire"),
      }),
    }),
  });

  const onEnabledClicked = async (item, payload) => {
    try {
      const messagePosted = await _put(`${ADMIN_MAINTENANCE_ENDPOINT}/${item._id}`, {
        ...item,
        ...payload,
      });
      if (messagePosted) {
        toastSuccess("Le message a bien été mise à jour.");
        await refetchMaintenanceMessages();
      }
    } catch (e) {
      console.error(e);
      toastError("Oups, une erreur est survenue. Merci de réessayer plus tard.");
    }
  };

  const onDeleteClicked = async (item) => {
    try {
      if (!confirm("Êtes-vous sûr de vouloir supprimer ce message ?")) {
        return;
      }
      const messageDeleted = await _delete(`${ADMIN_MAINTENANCE_ENDPOINT}/${item._id}`);
      if (messageDeleted) {
        toastSuccess("Le message a bien été supprimé.");
        await refetchMaintenanceMessages();
      }
    } catch (e) {
      console.error(e);
      toastError("Oups, une erreur est survenue. Merci de réessayer plus tard.");
    }
  };

  return (
    <Page>
      <Head>
        <title>Messages de maintenance</title>
      </Head>
      <Box w="100%" pt={[4, 8]} color="grey.800">
        <Container maxW="xl">
          <Breadcrumb separator={<ArrowDropRightLine color="grey.600" />} textStyle="xs">
            <BreadcrumbItem>
              <BreadcrumbLink as={NavLink} href="/" color="grey.600" fontWeight="bold">
                Accueil
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink>Messages de maintenance</BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
        </Container>
      </Box>
      <Box w="100%">
        <Container maxW="xl">
          <Heading textStyle="h2" marginBottom="2w" mt={6}>
            Messages de maintenance
          </Heading>
          <Box>
            <Box>
              {messages?.length > 0 && (
                <Table
                  headers={["Messages précédents", "Context", "Type", "Actif", "Supprimer"]}
                  loading={loading}
                  error={null}
                >
                  <Tbody>
                    {messages.map((message, i) => (
                      <tr key={message._id}>
                        <td>{message.msg}</td>
                        <td>{message.context}</td>
                        <td>{message.type}</td>
                        <td>
                          {message.context !== "automatique" && (
                            <Box>
                              <Switch
                                onChange={() => onEnabledClicked(messages[i], { enabled: !message.enabled })}
                                defaultChecked={message.enabled}
                              />
                            </Box>
                          )}
                        </td>
                        <td>
                          {message.context !== "automatique" && (
                            <button onClick={() => onDeleteClicked(message)}>
                              <Trash boxSize={5} color="grey.500" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </Box>
            <Divider my={10} border="2px solid" />
            <Heading textStyle="h4" fontSize="1.3rem" mt={10}>
              Ajouter/Mettre à jour un message:
            </Heading>
            <Box as="fieldset" mt={8}>
              <VStack alignItems="flex-start" mb={5}>
                <FormControl isRequired isInvalid={errors.context}>
                  <FormLabel fontWeight="bold">Context du message</FormLabel>
                  <RadioGroup
                    value={values.context}
                    onChange={(value) => setFieldValue("type", value === "manuel" ? "" : "alert")}
                  >
                    <VStack alignItems="flex-start">
                      <Radio
                        type="radio"
                        name="context"
                        value="manuel"
                        checked={values.context === "manuel"}
                        onChange={handleChange}
                      >
                        Manuel (Message informatif permanent si activé)
                      </Radio>
                      <Radio
                        type="radio"
                        name="context"
                        value="automatique"
                        checked={values.context === "automatique"}
                        onChange={handleChange}
                      >
                        Automatique (Message d&apos;alert automatique déclenché lors d&apos;un traitement coté serveur)
                      </Radio>
                      <Radio
                        type="radio"
                        name="context"
                        value="maintenance"
                        checked={values.context === "maintenance"}
                        onChange={handleChange}
                      >
                        Maintenance (Message global de maintenance; si activé le site ne sera pas accessible pour les
                        utilisateurs non administrateur)
                      </Radio>
                    </VStack>
                  </RadioGroup>
                </FormControl>
              </VStack>
              <FormControl isRequired isInvalid={errors.msg}>
                <FormLabel fontWeight="bold">Message</FormLabel>
                <Textarea
                  name="msg"
                  value={values.msg}
                  onChange={handleChange}
                  placeholder="exemple: Une mise à jour des données est en cours, le service sera à nouveau opérationnel d'ici le XX/XX/2022 à XXh."
                  rows={3}
                  required
                />
                {touched.msg && <FormErrorMessage>{errors.msg}</FormErrorMessage>}
                <Text fontSize="0.8rem" mb={5}>
                  Aide! Pour afficher un lien hypertexte dans les messages, veuillez suivre la synthaxe suivante [Mon
                  Lien](<strong>##</strong>https://MON_URL)
                </Text>
              </FormControl>
              <HStack alignItems="flex-start" mb={5}>
                <FormControl isRequired isInvalid={errors.type}>
                  <FormLabel fontWeight="bold">Type de message</FormLabel>
                  <RadioGroup value={values.type} isDisabled={values.context !== "manuel"}>
                    <HStack alignItems="flex-start">
                      <Radio
                        type="radio"
                        name="type"
                        value="alert"
                        checked={values.type !== "info"}
                        onChange={handleChange}
                      >
                        Alert (Bandeau rouge)
                      </Radio>
                      <Radio
                        type="radio"
                        name="type"
                        value="info"
                        checked={values.type === "info"}
                        onChange={handleChange}
                      >
                        Info (Bandeau bleu)
                      </Radio>
                    </HStack>
                    {touched.type && <FormErrorMessage>{errors.type}</FormErrorMessage>}
                  </RadioGroup>
                </FormControl>
              </HStack>
              <Box my="8">
                <Button textStyle="sm" variant="primary" onClick={handleSubmit}>
                  Enregistrer
                </Button>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
    </Page>
  );
};

export default withAuth(Message, "admin/page_message_maintenance");
