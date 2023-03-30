import React, { useMemo } from "react";
import { Box, Container, Heading, IconButton, Menu, MenuButton, MenuItem, MenuList, Text } from "@chakra-ui/react";
import { HamburgerIcon } from "@chakra-ui/icons";
import Head from "next/head";
import { useQuery } from "@tanstack/react-query";

import withAuth from "@/components/withAuth";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import InvitationForm from "@/modules/mon-espace/organisation/InvitationForm";
import useAuth from "@/hooks/useAuth";
import Page from "@/components/Page/Page";

import { _get } from "@/common/httpClient";
import Table from "@/components/Table/Table";
import { formatDateNumericDayMonthYear } from "@/common/utils/dateUtils";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageGestionDesMembres = () => {
  const { auth } = useAuth();

  const { data: membres, status: statusMembres } = useQuery<any[]>(["membres"], () =>
    _get("/api/v1/organisation/membres")
  );
  const {
    data: invitations,
    status: statusInvitations,
    refetch: refetchInvitations,
  } = useQuery<any[]>(["invitations"], () => _get("/api/v1/organisation/invitations"));

  const membresEnAttenteValidation = useMemo(
    () => membres?.filter((member) => member.account_status === "PENDING_ADMIN_VALIDATION") ?? [],
    [membres]
  );

  const onInvitation = () => {
    refetchInvitations();
  };

  const title = "Gestion des membres";
  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Container maxW="xl" px={0}>
        <Box mt={8}>
          <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb={3}>
            Gestion des rôles et habilitations
          </Heading>
          <Text fontSize="sm">
            Vous êtes actuellement <strong>Gestionnaire</strong> pour votre organisation sur le tableau de bord.
          </Text>
          <InvitationForm onInvitation={onInvitation} />

          {statusMembres === "success" && statusInvitations === "success" && (
            <Box>
              {membresEnAttenteValidation.length > 0 && (
                <>
                  <Heading as="h2" color="#417DC4" fontSize="xl" fontWeight="700" my={8}>
                    Comptes en attente de validation ({membresEnAttenteValidation.length})
                  </Heading>

                  {/* @ts-expect-error composant Table à revoir */}
                  <Table
                    data={membresEnAttenteValidation}
                    columns={{
                      nom: {
                        header: () => "Nom",
                        cell: (info) => <Text fontSize="1rem">{info.getValue()}</Text>,
                      },
                      prenom: {
                        header: () => "Prénom",
                        cell: (info) => <Text fontSize="1rem">{info.getValue()}</Text>,
                      },
                      email: {
                        header: () => "Courriel",
                        cell: (info) => <Text fontSize="1rem">{info.getValue()}</Text>,
                      },
                      created_at: {
                        header: () => "Demande le",
                        cell: (info) => <Text fontSize="1rem">{formatDateNumericDayMonthYear(info.getValue())}</Text>,
                      },
                      actions: {
                        header: () => "Options",
                        cell: (info) => {
                          const user = info.row.original;
                          return auth.email === user.email ? (
                            <></>
                          ) : (
                            <>
                              <Menu placement="bottom">
                                <MenuButton as={IconButton} aria-label="Options" icon={<HamburgerIcon />} />
                                <MenuList>
                                  <MenuItem>Valider le compte</MenuItem>
                                  <MenuItem>Refuser la demande</MenuItem>
                                </MenuList>
                              </Menu>
                            </>
                          );
                        },
                      },
                    }}
                  />
                </>
              )}
              {invitations.length > 0 && (
                <>
                  <Heading as="h2" color="#417DC4" fontSize="xl" fontWeight="700" my={8}>
                    Invitations en cours ({invitations.length})
                  </Heading>

                  {/* @ts-expect-error composant Table à revoir */}
                  <Table
                    data={invitations}
                    columns={{
                      email: {
                        header: () => "Courriel",
                        cell: (info) => <Text fontSize="1rem">{info.getValue()}</Text>,
                      },
                      created_at: {
                        header: () => "Envoyée le",
                        cell: (info) => <Text fontSize="1rem">{formatDateNumericDayMonthYear(info.getValue())}</Text>,
                      },
                      actions: {
                        header: () => "Options",
                        cell: () => {
                          return (
                            <>
                              <Menu placement="bottom">
                                <MenuButton as={IconButton} aria-label="Options" icon={<HamburgerIcon />} />
                                <MenuList>
                                  <MenuItem>Renvoyer l{"'"}invitation</MenuItem>
                                  <MenuItem>Annuler l{"'"}invitation</MenuItem>
                                </MenuList>
                              </Menu>
                            </>
                          );
                        },
                      },
                    }}
                  />
                </>
              )}

              <Heading as="h2" color="#417DC4" fontSize="xl" fontWeight="700" my={8}>
                Utilisateurs actuels ({membres.length})
              </Heading>

              {/* @ts-expect-error composant Table à revoir */}
              <Table
                data={membres}
                columns={{
                  nom: {
                    header: () => "Nom",
                    cell: (info) => <Text fontSize="1rem">{info.getValue()}</Text>,
                  },
                  prenom: {
                    header: () => "Prénom",
                    cell: (info) => <Text fontSize="1rem">{info.getValue()}</Text>,
                  },
                  email: {
                    header: () => "Courriel",
                    cell: (info) => <Text fontSize="1rem">{info.getValue()}</Text>,
                  },
                  actions: {
                    header: () => "Options",
                    cell: (info) => {
                      const user = info.row.original;
                      return auth.email === user.email ? (
                        <></>
                      ) : (
                        <>
                          <Menu placement="bottom">
                            <MenuButton as={IconButton} aria-label="Options" icon={<HamburgerIcon />} />
                            <MenuList>
                              <MenuItem>Suspendre le compte</MenuItem>
                              <MenuItem>Supprimer le compte</MenuItem>
                            </MenuList>
                          </Menu>
                        </>
                      );
                    },
                  },
                }}
              />
            </Box>
          )}
        </Box>
      </Container>
    </Page>
  );
};

export default withAuth(PageGestionDesMembres);
