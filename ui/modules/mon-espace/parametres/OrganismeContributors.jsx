import React from "react";
import { Box, Button, Flex, Link, Text, Input, Select, HStack, Spinner, Avatar, Center } from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useRecoilValue } from "recoil";
import { useQueries, useMutation } from "@tanstack/react-query";
import NavLink from "next/link";

import { Question } from "../../../theme/components/icons";
import { _get, _post, _put, _delete } from "../../../common/httpClient";
import Table from "../../../components/Table/Table";
import { organismeAtom } from "../../../hooks/organismeAtoms";
import useToaster from "../../../hooks/useToaster";
import useAuth from "../../../hooks/useAuth";

function useOrganismeAcces() {
  const organisme = useRecoilValue(organismeAtom);

  const [
    {
      data: organismeContributors,
      isLoading: isLoadingContributors,
      isFetching: isFetchingContributors,
      refetch: refetchContributors,
    },
    { data: roles, isLoading: isLoadingRoles, isFetching: isFetchingRoles },
  ] = useQueries({
    queries: [
      {
        queryKey: ["organismeContributors", 1],
        queryFn: () => _get(`/api/v1/organisme/contributors?organisme_id=${organisme._id}`),
      },
      {
        queryKey: ["organismeRoles", 2],
        queryFn: () => _get(`/api/v1/organisme/roles_list?organisme_id=${organisme._id}`),
      },
    ],
  });

  return {
    organismeContributors: organismeContributors || [],
    roles: roles || [],
    defaultRoleName: roles?.length > 0 ? roles[0].name : "",
    isLoading: isLoadingContributors || isLoadingRoles || isFetchingRoles || isFetchingContributors,
    refetchContributors,
  };
}

const OrganismeContributors = ({ size = "md" }) => {
  let [auth] = useAuth();
  const { toastSuccess, toastError } = useToaster(); // TODO Really useful to have a separate Hook ?
  const organisme = useRecoilValue(organismeAtom);
  const { organismeContributors, roles, isLoading, defaultRoleName, refetchContributors } = useOrganismeAcces();

  const { mutateAsync: addContributor } = useMutation(({ userEmail, roleName }) =>
    _post(`/api/v1/organisme/contributors`, {
      organisme_id: organisme._id,
      userEmail,
      roleName,
    })
  );

  const { mutateAsync: changeContributorRole } = useMutation(({ userEmail, roleName }) =>
    _put(`/api/v1/organisme/contributors`, {
      organisme_id: organisme._id,
      userEmail,
      roleName,
    })
  );

  const { mutateAsync: deleteContributor } = useMutation((userEmail) => {
    return _delete(
      `/api/v1/organisme/contributors?organisme_id=${organisme._id}&userEmail=${encodeURIComponent(userEmail)}`
    );
  });

  const onDeleteContributor = async ({ currentTarget }) => {
    if (!confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) {
      return;
    }
    const userEmail = currentTarget.getAttribute("data-email");
    const result = await deleteContributor(userEmail);
    if (result.ok) {
      await refetchContributors();
      toastSuccess("Le contributeur a bien été supprimé");
    } else {
      toastError("Oups, une erreur est survenue, merci de réessayer plus tard");
    }
  };

  const onChangeContributor = async ({ userEmail, roleName }) => {
    const result = await changeContributorRole({ userEmail, roleName });
    if (result.ok) {
      await refetchContributors();
      toastSuccess("Le contributeur a bien été mis à jour");
    } else {
      toastError("Oups, une erreur est survenue, merci de réessayer plus tard");
    }
  };

  const { values, handleChange, handleSubmit, errors, touched, resetForm } = useFormik({
    initialValues: {
      userEmail: "",
      roleName: defaultRoleName,
    },
    enableReinitialize: true,
    validationSchema: Yup.object().shape({
      userEmail: Yup.string().email("L'email n'est pas au bon format").required("L'email est obligatoire"),
      roleName: Yup.string().required("Le rôle est obligatoire"),
    }),
    onSubmit: async ({ userEmail, roleName }) => {
      const result = await addContributor({ userEmail, roleName });
      if (result.ok) {
        resetForm();
        await refetchContributors();
        toastSuccess("Le contributeur a bien été ajouté");
      } else {
        toastError("Oups, une erreur est survenue, merci de réessayer plus tard");
      }
    },
  });

  return (
    <>
      {isLoading && !organismeContributors.length ? (
        <Spinner />
      ) : (
        <Box px={[4, 8]} mb={5}>
          <Text>Inviter un membre de votre organisme</Text>
          <Flex flexDirection="column" py={5} minWidth="max-content">
            <Flex gap={4} minWidth="max-content">
              <Box flex="1">
                <Input
                  size={size}
                  type="email"
                  name="userEmail"
                  onChange={handleChange}
                  value={values["userEmail"]}
                  required
                  placeholder="Renseigner un courriel"
                  variant="outline"
                  isInvalid={errors.userEmail && touched.userEmail}
                  outlineOffset="0px"
                  _focus={{
                    boxShadow: "none",
                    outlineColor: "none",
                  }}
                  _focusVisible={{
                    boxShadow: "none",
                    outline: "2px solid",
                    outlineColor: errors.userEmail && touched.userEmail ? "error" : "#2A7FFE",
                  }}
                  _invalid={{
                    borderBottomColor: "error",
                    boxShadow: "none",
                    outline: "2px solid",
                    outlineColor: "error",
                  }}
                />
                {errors.userEmail && touched.userEmail && (
                  <Box color="tomato" my={2}>
                    {errors.userEmail}
                  </Box>
                )}
              </Box>
              <Box>
                <Select
                  name="roleName"
                  size={size}
                  onChange={handleChange}
                  iconColor={"gray.800"}
                  data-testid={"actions-roles"}
                  w="300px"
                  value={values.roleName}
                >
                  {roles.map((role) => (
                    <option key={role.name} value={role.name}>
                      {role.title}
                    </option>
                  ))}
                </Select>
                {errors.roleName && touched.roleName && (
                  <Box color="tomato" my={2}>
                    {errors.roleName}
                  </Box>
                )}
              </Box>
              <Box flex="1">
                <Button
                  size={size}
                  type="submit"
                  variant={values.userEmail !== "" ? "primary" : "secondary"}
                  onClick={handleSubmit}
                  loadingText="Enregistrement des modifications"
                  isDisabled={values.userEmail === ""}
                  px={6}
                >
                  Inviter
                </Button>
              </Box>
            </Flex>
            <Text textStyle="xs">
              <Question w="10px" h="10px" mt="-0.2rem" /> Une question sur un rôle ? Consulter la{" "}
              <Link
                color="bluefrance"
                as={NavLink}
                href={"https://www.notion.so/mission-apprentissage/Documentation-dbb1eddc954441eaa0ba7f5c6404bdc0"}
                isExternal
              >
                FAQ
              </Link>
            </Text>
          </Flex>
          <Flex mt={8}>
            <Table
              data={organismeContributors}
              columns={{
                "user.name": {
                  header: () => {
                    return <Box textAlign="left">Utilisateur</Box>;
                  },
                  width: 120,
                  cell: (info) => {
                    const user = info.row.original.user;
                    const you = auth.email === user.email;
                    const hasAccount = user.prenom && user.nom;
                    const username = hasAccount ? `${user.prenom} ${user.nom}` : `Invité non vérifié`;
                    return (
                      <HStack>
                        <Avatar size="sm" name={hasAccount ? username : ""} />
                        <Text>
                          {username}
                          {you ? " (vous)" : ""}
                        </Text>
                        {user.type && <Text fontWeight="bold">{`(${user.type})`}</Text>}
                      </HStack>
                    );
                  },
                },
                "user.organisation": {
                  header: () => {
                    return <Box textAlign="left">Organisation</Box>;
                  },
                  width: 100,
                  cell: ({ row }) => {
                    const { user } = row.original;
                    const ORGANISMES_APPARTENANCE = {
                      TETE_DE_RESEAU: `TÊTE DE RÉSEAU: ${user.reseau}`,
                      ACADEMIE: `ACADÉMIE`,
                      DRAAF: "DRAAF",
                      CARIF_OREF: "CARIF OREF",
                      DREETS: "DREETS",
                      CONSEIL_REGIONAL: "CONSEIL RÉGIONAL",
                      ERP: user.erp,
                      AUTRE: "AUTRE",
                      POLE_EMPLOI: "PÔLE EMPLOI",
                      MISSION_LOCALE: "MISSION LOCALE",
                      CELLULE_APPRENTISSAGE: "CELLULE APPRENTISSAGE",
                      ORGANISME_FORMATION: "ORGANISME DE FORMATION",
                    };
                    return <Text fontSize="1rem">{ORGANISMES_APPARTENANCE[user.organisation].toLowerCase()}</Text>;
                  },
                },
                "user.email": {
                  header: () => {
                    return <Box textAlign="left">Courriel</Box>;
                  },
                  width: 100,
                  cell: (info) => {
                    return <Text fontSize="1rem">{info.getValue()}</Text>;
                  },
                },
                role: {
                  header: () => {
                    return <Box textAlign="left">Rôle</Box>;
                  },
                  width: 100,
                  cell: (info) => {
                    const { user, permission } = info.row.original;
                    return (
                      <HStack w="full">
                        <Select
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                          onChange={async (e) => {
                            const roleName = e.target.value;
                            if (roleName === "custom") {
                              // TODO ??? TO DELETE ? HERE IT MAKES NO SENSE
                            } else {
                              return onChangeContributor({
                                userEmail: user.email,
                                roleName,
                              });
                            }
                          }}
                          iconColor={"gray.800"}
                          data-testid={"actions-select"}
                          value={permission.name}
                        >
                          {roles.map((role) => (
                            <option key={role.name} value={role.name}>
                              {role.title}
                            </option>
                          ))}
                        </Select>
                      </HStack>
                    );
                  },
                },
                actions: {
                  header: () => {
                    return <Box textAlign="center">Retirer l&rsquo;accès</Box>;
                  },
                  width: 40,
                  cell: (info) => {
                    const { user } = info.row.original;
                    const isAnOverheadUser = true;
                    // user.roles.some((role) => ["reseau_of", "pilot", "erp"].includes(role));
                    // TODO should not be able to remove pilot ["TETE_DE_RESEAU", "ERP"].includes(user.organisation);
                    // TODO edit: can only remove the ones invited to join by someone in the current organisme

                    const you = auth.email === user.email;
                    return (
                      <Center>
                        {!you && !isAnOverheadUser && (
                          <CloseIcon
                            color="bluefrance"
                            data-email={info.row.original.user.email}
                            onClick={onDeleteContributor}
                            cursor="pointer"
                          />
                        )}
                      </Center>
                    );
                  },
                },
              }}
            />
          </Flex>
        </Box>
      )}
    </>
  );
};

export default OrganismeContributors;
