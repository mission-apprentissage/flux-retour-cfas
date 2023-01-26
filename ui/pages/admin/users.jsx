// TODO [tech]
import React, { useCallback, useEffect, useState } from "react";
import { useFormik } from "formik";
import { useQuery } from "@tanstack/react-query";
import Head from "next/head";
import generator from "generate-password-browser";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Stack,
  Table,
  Td,
  Text,
  Tr,
  VStack,
} from "@chakra-ui/react";

import { _delete, _get, _post, _put } from "@/common/httpClient";
import { Breadcrumb } from "@/components/Breadcrumb/Breadcrumb";
import { Page } from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import Acl from "@/components/Acl";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { Check } from "@/theme/components/icons";
import useToaster from "@/hooks/useToaster";

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

const UserLine = ({ user, roles, refetchUsers }) => {
  const [, setRolesAcl] = useState(buildRolesAcl(user?.roles || [], roles));
  const { toastSuccess, toastError } = useToaster();

  useEffect(() => {
    async function run() {
      setRolesAcl(buildRolesAcl(user?.roles || [], roles));
    }
    run();
  }, [roles, user]);

  const newTmpPassword = generator.generate({
    length: 10,
    numbers: true,
    lowercase: true,
    uppercase: true,
    strict: true,
  });

  const { values, handleSubmit, handleChange, setFieldValue } = useFormik({
    initialValues: {
      accessAllCheckbox: user?.is_admin ? ["on"] : [],
      roles: user?.roles || [],
      acl: user?.custom_acl || [],
      newNom: user?.nom || "",
      newPrenom: user?.prenom || "",
      newEmail: user?.email || "",
      newTmpPassword,
    },
    onSubmit: async (
      { accessAllCheckbox, newNom, newPrenom, newEmail, newTmpPassword, roles, acl },
      { setSubmitting }
    ) => {
      const accessAll = accessAllCheckbox.includes("on");
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
          const result = await _put(`/api/v1/admin/user/${user._id}`, body);
          if (result?.ok) {
            toastSuccess("Utilisateur mis à jour");
          } else {
            toastError("Erreur lors de la mise à jour de l'utilisateur.", {
              description: " Merci de réessayer plus tard",
            });
          }
        } else {
          const body = {
            password: newTmpPassword,
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
          const result = await _post("/api/v1/admin/user/", body);
          if (result?.ok) {
            toastSuccess("Utilisateur créé");
          } else {
            toastError("Erreur lors de la création de l'utilisateur.", {
              description: " Merci de réessayer plus tard",
            });
          }
        }
      } catch (e) {
        console.error(e);
        const response = await (e?.json ?? {});
        const message = response?.message ?? e?.message;
        toastError(message);
      }
      await refetchUsers();
      setSubmitting(false);
    },
  });

  const onDeleteClicked = async (e) => {
    e.preventDefault();
    if (confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) {
      const result = await _delete(`/api/v1/admin/user/${user._id}`);
      if (result?.ok) {
        toastSuccess("Utilisateur supprimé");
      } else {
        toastError("Erreur lors de la suppression de l'utilisateur.", {
          description: " Merci de réessayer plus tard",
        });
      }
      return refetchUsers();
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
      return refetchUsers();
    } catch (e) {
      console.error(e);
      toastError("Erreur lors de la validation de l'accès.", {
        description: " Merci de réessayer plus tard",
      });
    }
  };

  const handleRoleChange = (roleName) => {
    let oldRolesAcl = [];
    oldRolesAcl = buildRolesAcl(values.roles, roles);

    let customAcl = [];
    for (let i = 0; i < values.acl.length; i++) {
      const currentAcl = values.acl[i];
      if (!oldRolesAcl.includes(currentAcl)) {
        customAcl.push(currentAcl);
      }
    }

    let newRolesAcl = [];
    let newRoles = [];
    if (values.roles.includes(roleName)) {
      newRoles = values.roles.filter((r) => r !== roleName);
      newRolesAcl = buildRolesAcl(newRoles, roles);
    } else {
      newRoles = [...values.roles, roleName];
      newRolesAcl = buildRolesAcl(newRoles, roles);
    }

    setFieldValue("acl", customAcl);
    setFieldValue("roles", newRoles);

    setRolesAcl(newRolesAcl);
  };

  const onAclChanged = useCallback(
    (newAcl) => {
      setFieldValue("acl", newAcl);
    },
    [setFieldValue]
  );

  return (
    <form onSubmit={handleSubmit}>
      <Text>Compte créé sur: {user?.orign_register}</Text>
      <Box flex={1}>
        <Text>Statut : {user?.account_status}</Text>
      </Box>
      <FormControl py={2}>
        <FormLabel>Nom</FormLabel>
        <Input type="text" id="newNom" name="newNom" value={values.newNom} onChange={handleChange} />
      </FormControl>
      <FormControl py={2}>
        <FormLabel>Prenom</FormLabel>
        <Input type="text" id="newPrenom" name="newPrenom" value={values.newPrenom} onChange={handleChange} />
      </FormControl>

      <FormControl py={2}>
        <FormLabel>Email</FormLabel>
        <Input type="email" id="newEmail" name="newEmail" value={values.newEmail} onChange={handleChange} />
      </FormControl>

      {!user && (
        <FormControl py={2}>
          <FormLabel>Mot de passe temporaire</FormLabel>
          <Input
            type="text"
            id="newTmpPassword"
            name="newTmpPassword"
            value={values.newTmpPassword}
            onChange={handleChange}
          />
        </FormControl>
      )}

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
            .map((role, i) => {
              return (
                <Checkbox
                  name="roles"
                  key={i}
                  onChange={() => handleRoleChange(role.name)}
                  value={role.name}
                  isChecked={values.roles.includes(role.name)}
                  icon={<Check />}
                >
                  {role.name}
                </Checkbox>
              );
            })}
        </HStack>
      </FormControl>

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
                            SIRET : <b>{permission.organisme?.sirets?.join(" ")}</b>
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

      <Acl acl={values.acl} title=" Droits d'accès Supplémentaire" onChanged={onAclChanged} />

      {user && (
        <Box>
          <Button type="submit" variant="primary" mr={5}>
            Enregistrer
          </Button>
          <Button variant="outline" colorScheme="red" borderRadius="none" onClick={onDeleteClicked}>
            Supprimer l&apos;utilisateur
          </Button>
        </Box>
      )}
      {!user && (
        <Button type="submit" variant="primary">
          Créer l&apos;utilisateur
        </Button>
      )}
    </form>
  );
};

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const Users = () => {
  const { data: roles } = useQuery(["roles"], () => _get("/api/v1/admin/roles/"));

  const { data: users, refetch: refetchUsers } = useQuery(["users"], () => _get("/api/v1/admin/users/"));

  const title = "Gestion des utilisateurs";

  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>

      <Breadcrumb pages={[{ title: "Accueil", to: "/" }, { title }]} />

      <Heading as="h1" mb={8} mt={6}>
        {title}
      </Heading>
      <Stack spacing={2}>
        <Accordion bg="white" allowToggle>
          {roles && (
            <AccordionItem mb={12}>
              <AccordionButton bg="bluefrance" color="white" _hover={{ bg: "blue.700" }}>
                <Box flex="1" textAlign="left" fontSize="gamma">
                  Créer un utilisateur
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel pb={4} border={"1px solid"} borderTop={0} borderColor={"bluefrance"}>
                <UserLine user={null} roles={roles} />
              </AccordionPanel>
            </AccordionItem>
          )}

          {roles &&
            users?.map((user) => {
              const pendingPermissionsCount = user?.permissions?.filter((p) => p.pending).length;
              return (
                <AccordionItem key={user.email}>
                  {({ isExpanded }) => (
                    <>
                      <AccordionButton _expanded={{ bg: "grey.200" }} border={"1px solid"} borderColor={"bluefrance"}>
                        <Flex fontSize="gamma" flexGrow={1} justifyContent="space-between" alignItems="center">
                          <Text>
                            {user.email} - {user.prenom} {user.nom}
                          </Text>
                          <VStack alignItems="flex-end" spacing={0}>
                            <Badge
                              color="white"
                              backgroundColor={user?.account_status === "CONFIRMED" ? "flatsuccess" : "warning"}
                            >
                              {user?.account_status}
                            </Badge>
                            {pendingPermissionsCount > 0 && (
                              <Text fontSize={"sm"}>
                                {pendingPermissionsCount} permission(s) en attente de validation
                              </Text>
                            )}
                          </VStack>
                        </Flex>
                        <AccordionIcon />
                      </AccordionButton>
                      <AccordionPanel pb={4} border={"1px solid"} borderTop={0} borderColor={"bluefrance"}>
                        {isExpanded && <UserLine user={user} roles={roles} refetchUsers={refetchUsers} />}
                      </AccordionPanel>
                    </>
                  )}
                </AccordionItem>
              );
            })}
        </Accordion>
      </Stack>
    </Page>
  );
};

export default withAuth(Users, "admin/page_gestion_utilisateurs");
