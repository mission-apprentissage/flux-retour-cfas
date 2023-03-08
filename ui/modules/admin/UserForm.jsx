import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Grid,
  HStack,
  Input,
  Table,
  Td,
  Text,
  Tr,
  VStack,
} from "@chakra-ui/react";

import { _delete, _get, _post, _put } from "@/common/httpClient";
import { Check } from "@/theme/components/icons";
import useToaster from "@/hooks/useToaster";
import { DEPARTEMENTS_BY_ID, REGIONS_BY_ID, ACADEMIES_BY_ID } from "@/common/constants/territoiresConstants";
import { getUserOrganisationLabel } from "@/common/constants/usersConstants";
import Link from "next/link";

const buildRolesAcl = (newRoles, roles) => {
  let acl = [];
  for (let i = 0; i < newRoles.length; i++) {
    const selectedRole = newRoles[i];
    const selectedRoleAcl = roles.reduce((acc, curr) => {
      if (selectedRole === curr.name) return [...acc, ...curr.acl];
      return acc;
    }, []);
    acl = [...acl, ...selectedRoleAcl];
  }
  return acl;
};

export const UserForm = ({ user, roles, afterSubmit }) => {
  const [, setRolesAcl] = useState(buildRolesAcl(user?.roles || [], roles));
  const { toastSuccess, toastError } = useToaster();
  const rolesById = roles?.reduce((acc, role) => ({ ...acc, [role._id]: role }), {});

  useEffect(() => {
    async function run() {
      setRolesAcl(buildRolesAcl(user?.roles || [], roles));
    }
    run();
  }, [roles, user]);

  const { values, handleSubmit, handleChange, setFieldValue, resetForm } = useFormik({
    initialValues: {
      accessAllCheckbox: user?.is_admin ? ["on"] : [],
      roles: user?.roles || [],
      newNom: user?.nom || "",
      newPrenom: user?.prenom || "",
      newEmail: user?.email || "",
    },
    onSubmit: async ({ accessAllCheckbox, newNom, newPrenom, newEmail, roles, acl }, { setSubmitting }) => {
      const accessAll = accessAllCheckbox.includes("on");

      let result;
      let error;

      try {
        if (user) {
          const body = {
            options: {
              prenom: newPrenom,
              nom: newNom,
              email: newEmail,
              roles,
              acl,
              permissions: {
                is_admin: accessAll,
              },
            },
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
            options: {
              prenom: newPrenom,
              nom: newNom,
              email: newEmail,
              roles,
              acl,
              permissions: {
                is_admin: accessAll,
              },
            },
          };
          result = await _post("/api/v1/admin/user/", body).catch((err) => {
            if (err.statusCode === 409) {
              return { error: "Cet utilisateur existe déjà" };
            }
          });
          if (result?._id) {
            toastSuccess("Utilisateur créé");
            resetForm();
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
      await afterSubmit(result, error);
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
      return afterSubmit();
    }
  };

  const onConfirmUserPermission = async ({ currentTarget }) => {
    const organismeId = currentTarget.getAttribute("data-organisme-id");
    const organismeName = currentTarget.getAttribute("data-organisme-name");
    const validate = currentTarget.getAttribute("data-validate");

    const actionStr = validate === "true" ? "valider" : "rejeter";

    if (
      (organismeId !== "all" &&
        !confirm(`Voulez-vous vraiment ${actionStr} l'accès de cet utilisateur sur l'organisme ${organismeName}? ?`)) ||
      (organismeId === "all" && !confirm(`Voulez-vous vraiment ${actionStr} toutes les permissions ?`))
    ) {
      return;
    }
    try {
      const result = await _get(
        `/api/v1/admin/users/confirm-user?userEmail=${encodeURIComponent(
          user.email
        )}&organisme_id=${organismeId}&validate=${validate}`
      );
      if (result?.ok) {
        toastSuccess(`Accès ${validate === "true" ? "validé" : "rejeté"}`);
      } else {
        toastError("Erreur lors de la validation de l'accès.", {
          description: " Merci de réessayer plus tard",
        });
      }
      return afterSubmit();
    } catch (e) {
      console.error(e);
      toastError("Erreur lors de la validation de l'accès.", {
        description: " Merci de réessayer plus tard",
      });
    }
  };

  const handleRoleChange = (roleName) => {
    let newRoles = [];
    if (values.roles.includes(roleName)) {
      newRoles = values.roles.filter((r) => r !== roleName);
    } else {
      newRoles = [...values.roles, roleName];
    }
    console.log({ newRoles });
    setFieldValue("roles", newRoles);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid gridTemplateColumns="repeat(2, 2fr)" gridGap="2w">
        <FormControl py={2}>
          <FormLabel>Nom</FormLabel>
          <Input type="text" id="newNom" name="newNom" value={values.newNom} onChange={handleChange} required />
        </FormControl>
        <FormControl py={2}>
          <FormLabel>Prenom</FormLabel>
          <Input
            type="text"
            id="newPrenom"
            name="newPrenom"
            value={values.newPrenom}
            onChange={handleChange}
            required
          />
        </FormControl>
        <FormControl py={2}>
          <FormLabel>Email</FormLabel>
          <Input type="email" id="newEmail" name="newEmail" value={values.newEmail} onChange={handleChange} required />
        </FormControl>
      </Grid>

      <FormControl py={2} mt={3}>
        <Checkbox
          name="accessAllCheckbox"
          id="accessAllCheckbox"
          isChecked={values.accessAllCheckbox.length > 0}
          onChange={handleChange}
          value="on"
          fontWeight={values.accessAllCheckbox.length > 0 ? "bold" : "normal"}
          color={"bluefrance"}
          icon={<Check />}
        >
          Admin
        </Checkbox>
      </FormControl>

      <FormControl py={2}>
        <FormLabel>Type de compte</FormLabel>
        <HStack spacing={5}>
          {roles
            .filter((role) => role.type === "user")
            .map((role) => {
              return (
                <Checkbox
                  name="roles"
                  key={role._id}
                  onChange={() => handleRoleChange(role.name)}
                  value={role.name}
                  isChecked={values.roles.includes(role._id)}
                  icon={<Check />}
                >
                  {role.name}
                </Checkbox>
              );
            })}
        </HStack>
      </FormControl>
      {user && (
        <VStack gap={2} alignItems="baseline">
          {user.main_organisme && (
            <HStack gap={2}>
              <span>Établissement :</span>
              <Text as="span" bgColor="galtDark" px={2}>
                <Link href={`/mon-espace/organisme/${user.main_organisme._id}`}>
                  {user.main_organisme.nom || getUserOrganisationLabel(user)}
                </Link>
              </Text>
            </HStack>
          )}
          <HStack gap={2}>
            <span>Territoire(s) :</span>
            <HStack gap={2}>
              {!user.codes_region?.length && !user.codes_academie?.length && !user.codes_departement?.length && "Aucun"}
              {user.codes_region?.map((code) => (
                <Text bgColor="galtDark" key={code} px={2}>
                  Région {REGIONS_BY_ID[code]?.nom || code}
                </Text>
              ))}
              {user.codes_academie?.map((code) => (
                <Text bgColor="galtDark" key={code} px={2}>
                  Académie {ACADEMIES_BY_ID[code].nom}
                </Text>
              ))}
              {user.codes_departement?.map((code) => (
                <Text bgColor="galtDark" key={code} px={2}>
                  {DEPARTEMENTS_BY_ID[code].nom} ({code})
                </Text>
              ))}
            </HStack>
          </HStack>
          <p>Droit associé au compte : </p>
          {user.account_status && (
            <p>
              Statut du compte :{" "}
              <Text as="span" bgColor="galt2">
                {user.account_status}
              </Text>
            </p>
          )}
        </VStack>
      )}
      {user?.permissions?.length > 0 && (
        <Accordion bg="white" mt={3} allowToggle>
          <AccordionItem>
            <AccordionButton _expanded={{ bg: "grey.200" }} border={"none"}>
              <Box flex="1" textAlign="left" fontSize="sm">
                Permissions organismes ({user?.permissions?.length})
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4} border={"none"} bg="grey.100">
              <VStack spacing={5}>
                <Table>
                  {user?.permissions?.map((permission) => {
                    return (
                      <Tr key={permission._id}>
                        <Td>{permission.name}</Td>
                        <Td>
                          Organisme :<b>{permission.organisme?.nom}</b>
                          <Text fontSize="xs" color="gray.600">
                            UAI : <b>{permission.organisme?.uai}</b>
                          </Text>
                          <Text fontSize="xs" color="gray.600">
                            SIRET : <b>{permission.organisme?.siret}</b>
                          </Text>
                        </Td>
                        <Td>
                          <Text mb={2}>{permission?.pending ? "En attente de validation" : "Accès validé"}</Text>
                          {permission?.pending && (
                            <HStack spacing={8}>
                              <Button
                                type="button"
                                variant="primary"
                                onClick={onConfirmUserPermission}
                                data-organisme-id={permission.organisme?._id}
                                data-organisme-name={permission.organisme?.nom}
                                data-validate="true"
                              >
                                Confirmer l&rsquo;accès
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={onConfirmUserPermission}
                                data-organisme-id={permission.organisme?._id}
                                data-organisme-name={permission.organisme?.nom}
                                data-validate="false"
                              >
                                Rejeter l&rsquo;accès
                              </Button>
                            </HStack>
                          )}
                        </Td>
                      </Tr>
                    );
                  })}
                </Table>

                {user?.permissions?.some((permission) => permission.pending) && (
                  <HStack spacing={8} alignSelf="start">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={onConfirmUserPermission}
                      data-organisme-id="all"
                      data-validate="true"
                    >
                      Confirmer tous les accès en attente
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={onConfirmUserPermission}
                      data-organisme-id="all"
                      data-validate="false"
                    >
                      Rejeter tous les accès en attente
                    </Button>
                  </HStack>
                )}
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      )}

      {user ? (
        <Box marginTop={10}>
          <Button type="submit" variant="primary" mr={5}>
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
    </form>
  );
};

export default UserForm;
