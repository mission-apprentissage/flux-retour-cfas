import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Grid,
  HStack,
  Input,
  RadioGroup,
  Radio,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useFormik } from "formik";
import React from "react";
import { toFormikValidationSchema } from "zod-formik-adapter";

import { USER_STATUS_LABELS } from "@/common/constants/usersConstants";
import { _delete, _put, _post } from "@/common/httpClient";
import useToaster from "@/hooks/useToaster";

import userSchema from "./userSchema";

const UserForm = ({
  user,
  onCreate,
  onDelete,
  onUpdate,
}: {
  user: any;
  onCreate?: any;
  onDelete?: any;
  onUpdate?: any;
}) => {
  const { toastSuccess, toastError } = useToaster();

  const { values, errors, touched, dirty, handleSubmit, handleChange } = useFormik({
    validationSchema: toFormikValidationSchema(userSchema()),
    initialValues: {
      civility: user?.civility,
      nom: user?.nom || "",
      prenom: user?.prenom || "",
      email: user?.email || "",
      fonction: user?.fonction || "",
      telephone: user?.telephone || "",
    },
    enableReinitialize: true,
    onSubmit: async ({ civility, nom, prenom, email, fonction, telephone }, { setSubmitting }) => {
      let result;
      let error;

      try {
        if (user) {
          const body = {
            civility,
            prenom,
            nom,
            email,
            fonction,
            telephone,
          };
          result = await _put(`/api/v1/admin/users/${user._id}`, body);
          if (result?.ok) {
            toastSuccess("Utilisateur mis à jour");
          } else {
            toastError("Erreur lors de la mise à jour de l'utilisateur.", {
              description: " Merci de réessayer plus tard",
            });
          }
        } else {
          const body = {
            civility,
            prenom,
            nom,
            email,
            fonction,
            telephone,
          };
          result = await _post("/api/v1/admin/users", body).catch((err) => {
            if (err.statusCode === 409) {
              return { error: "Cet utilisateur existe déjà" };
            }
          });
          if (result?._id) {
            toastSuccess("Utilisateur créé");
            onCreate?.(result);
          } else if (result?.error) {
            error = toastError(result.error);
          } else {
            error = "Erreur lors de la création de l'utilisateur.";
            toastError(error, {
              description: " Merci de réessayer plus tard",
            });
          }
        }
      } catch (e) {
        error = e;
        console.error(e);
        const response = await (e?.json ?? {});
        const message = response?.message ?? e?.message;
        toastError(message);
      }
      setSubmitting(false);
    },
  });

  const onDeleteClicked = async (e) => {
    e.preventDefault();
    if (confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) {
      const result = await _delete(`/api/v1/admin/users/${user._id}`);
      if (result?.ok) {
        toastSuccess("Utilisateur supprimé");
      } else {
        toastError("Erreur lors de la suppression de l'utilisateur.", {
          description: " Merci de réessayer plus tard",
        });
      }

      return onDelete?.();
    }
  };

  const confirmUserAccess = async (validate) => {
    if (
      !confirm(
        `Voulez-vous vraiment ${validate ? "valider" : "rejeter"} l'accès de cet utilisateur sur l'organisation ${
          user.organisation.label
        }? ?`
      )
    ) {
      return;
    }
    try {
      await _put(`/api/v1/admin/users/${user._id}/${validate ? "validate" : "reject"}`);
      toastSuccess(`L'utilisateur a été ${validate ? "validé" : "rejeté"}.`);
      validate ? onUpdate?.() : onDelete?.();
    } catch (e) {
      console.error(e);
      toastError("Erreur lors de la validation de l'accès.", {
        description: "Merci de réessayer plus tard",
      });
    }
  };

  const resendConfirmationEmail = async () => {
    try {
      await _post(`/api/v1/admin/users/${user._id}/resend-confirmation-email`);
      toastSuccess("L'email de confirmation a été renvoyé.");
    } catch (e) {
      console.error(e);
      toastError("Erreur lors de l'envoi de l'email.", {
        description: "Merci de réessayer plus tard",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack gap={2} alignItems="baseline" my={8}>
        <Grid gridTemplateColumns="repeat(2, 2fr)" gridGap="2w">
          <FormControl py={2} isInvalid={!!errors.nom}>
            <FormLabel>Nom</FormLabel>
            <Input type="text" id="nom" name="nom" value={values.nom} onChange={handleChange} />
            {errors.nom && touched.nom && <FormErrorMessage>{errors.nom as string}</FormErrorMessage>}
          </FormControl>
          <FormControl py={2} isInvalid={!!errors.prenom}>
            <FormLabel>Prénom</FormLabel>
            <Input type="text" id="prenom" name="prenom" value={values.prenom} onChange={handleChange} />
            {errors.prenom && touched.prenom && <FormErrorMessage>{errors.prenom as string}</FormErrorMessage>}
          </FormControl>
          <FormControl isRequired isInvalid={!!errors.civility}>
            <FormLabel>Civilité</FormLabel>
            <RadioGroup value={values.civility}>
              <HStack>
                <Radio
                  type="radio"
                  name="civility"
                  value="Monsieur"
                  checked={values.civility !== "Madame"}
                  onChange={handleChange}
                >
                  Monsieur
                </Radio>
                <Radio
                  type="radio"
                  name="civility"
                  value="Madame"
                  checked={values.civility === "Madame"}
                  onChange={handleChange}
                >
                  Madame
                </Radio>
              </HStack>
            </RadioGroup>
            {errors.civility && touched.civility && <FormErrorMessage>{errors.civility as string}</FormErrorMessage>}
          </FormControl>
          <FormControl py={2} isInvalid={!!errors.email}>
            <FormLabel>Email</FormLabel>
            <Input type="email" id="email" name="email" value={values.email} onChange={handleChange} />
            {errors.email && touched.email && <FormErrorMessage>{errors.email as string}</FormErrorMessage>}
          </FormControl>
          <FormControl py={2} isInvalid={!!errors.fonction}>
            <FormLabel>Fonction</FormLabel>
            <Input type="text" id="fonction" name="fonction" value={values.fonction} onChange={handleChange} />
            {errors.fonction && touched.fonction && <FormErrorMessage>{errors.fonction as string}</FormErrorMessage>}
          </FormControl>
          <FormControl py={2} isInvalid={!!errors.telephone}>
            <FormLabel>Téléphone</FormLabel>
            <Input type="tel" id="telephone" name="telephone" value={values.telephone} onChange={handleChange} />
            {errors.telephone && touched.telephone && <FormErrorMessage>{errors.telephone as string}</FormErrorMessage>}
          </FormControl>
        </Grid>

        {user && (
          <>
            <HStack spacing={5}>
              <Text as="span">Statut du compte</Text>
              <Text as="span" bgColor="galt2">
                {USER_STATUS_LABELS[user.account_status] || user.account_status}
              </Text>

              <HStack spacing={5}>
                {user.account_status === "PENDING_EMAIL_VALIDATION" && (
                  <HStack spacing={8} alignSelf="start">
                    <Button type="button" variant="primary" onClick={() => resendConfirmationEmail()}>
                      Renvoyer l’email de confirmation
                    </Button>
                  </HStack>
                )}
              </HStack>
            </HStack>

            <HStack spacing={5}>
              <Text as="span">Type de compte</Text>
              <Text as="span" bgColor="galtDark" px={2}>
                {user.organisation.label}
              </Text>

              <HStack spacing={5}>
                {user.account_status !== "CONFIRMED" && (
                  <HStack spacing={8} alignSelf="start">
                    <Button type="button" variant="primary" onClick={() => confirmUserAccess(true)}>
                      Confirmer
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => confirmUserAccess(false)}>
                      Rejeter
                    </Button>
                  </HStack>
                )}
              </HStack>
            </HStack>
          </>
        )}

        {user ? (
          <Box paddingTop={10}>
            <Button type="submit" variant="primary" mr={5} isDisabled={!dirty}>
              Enregistrer
            </Button>
            <Button variant="outline" colorScheme="red" borderRadius="none" onClick={onDeleteClicked}>
              Supprimer l&apos;utilisateur
            </Button>
          </Box>
        ) : (
          <Button type="submit" variant="primary">
            Créer l&apos;utilisateur
          </Button>
        )}
      </VStack>
    </form>
  );
};

export default UserForm;
