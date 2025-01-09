import { HamburgerIcon } from "@chakra-ui/icons";
import { Box, Container, Heading, IconButton, Menu, MenuButton, MenuItem, MenuList, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import Head from "next/head";
import React, { useMemo } from "react";

import { _delete, _get, _post } from "@/common/httpClient";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { formatDateNumericDayMonthYear } from "@/common/utils/dateUtils";
import Page from "@/components/Page/Page";
import Table from "@/components/Table/Table";
import withAuth, { allOrganisationExcept } from "@/components/withAuth";
import useAuth from "@/hooks/useAuth";
import useToaster from "@/hooks/useToaster";
import InvitationForm from "@/modules/mon-espace/organisation/InvitationForm";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageGestionDesMembres = () => {
  const { auth } = useAuth();
  const { toastSuccess } = useToaster();

  const {
    data: membres,
    status: statusMembres,
    refetch: refetchMembres,
  } = useQuery<any[]>(["membres"], (): any => _get("/api/v1/organisation/membres"));
  const {
    data: invitations,
    status: statusInvitations,
    refetch: refetchInvitations,
  } = useQuery<any[]>(["invitations"], (): any => _get("/api/v1/organisation/invitations"));

  const membresEnAttenteValidation = useMemo(
    () => membres?.filter((member) => member.account_status === "PENDING_ADMIN_VALIDATION") ?? [],
    [membres]
  );

  async function resendInvitation(invitationId: string) {
    await _post(`/api/v1/organisation/invitations/${invitationId}/resend`);
    toastSuccess("L'email d'invitation a été renvoyé");
  }

  async function cancelInvitation(invitationId: string) {
    await _delete(`/api/v1/organisation/invitations/${invitationId}`);
    await refetchInvitations();
    toastSuccess("L'invitation a été annulée");
  }

  async function validateMembre(userId: string) {
    await _post(`/api/v1/organisation/membres/${userId}/validate`);
    await refetchMembres();
    toastSuccess("Le membre a été validé");
  }

  async function rejectMembre(userId: string) {
    await _post(`/api/v1/organisation/membres/${userId}/reject`);
    await refetchMembres();
    toastSuccess("Le membre a été refusé");
  }

  async function deleteMembre(userId: string) {
    await _delete(`/api/v1/organisation/membres/${userId}`);
    await refetchMembres();
    toastSuccess("Le membre a été supprimé");
  }

  const title = "Gestion des rôles et habilitations";
  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Container maxW="xl" px={0}>
        <Box mt={8}>
          <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb={3}>
            {title}
          </Heading>
          <Text fontSize="sm">
            Vous êtes actuellement <strong>Gestionnaire</strong> pour votre organisation sur le tableau de bord.
          </Text>
          <InvitationForm onInvitation={() => refetchInvitations()} />

          {statusMembres === "success" && statusInvitations === "success" && (
            <Box>
              {membresEnAttenteValidation.length > 0 && (
                <>
                  <Heading as="h2" color="#417DC4" fontSize="xl" fontWeight="700" my={8}>
                    Comptes en attente de validation ({membresEnAttenteValidation.length})
                  </Heading>

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
                                  <MenuItem onClick={() => validateMembre(user._id)}>Valider le compte</MenuItem>
                                  <MenuItem onClick={() => rejectMembre(user._id)}>Refuser la demande</MenuItem>
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
                        cell: (info) => {
                          const invitation = info.row.original;
                          return (
                            <>
                              <Menu placement="bottom">
                                <MenuButton as={IconButton} aria-label="Options" icon={<HamburgerIcon />} />
                                <MenuList>
                                  <MenuItem onClick={() => resendInvitation(invitation._id)}>
                                    Renvoyer l{"'"}invitation
                                  </MenuItem>
                                  <MenuItem onClick={() => cancelInvitation(invitation._id)}>
                                    Annuler l{"'"}invitation
                                  </MenuItem>
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
                              <MenuItem
                                onClick={() =>
                                  confirm("Voulez-vous vraiment supprimer ce compte ?") && deleteMembre(user._id)
                                }
                              >
                                Supprimer le compte
                              </MenuItem>
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

export default withAuth(PageGestionDesMembres, [...allOrganisationExcept("MISSION_LOCALE")]);
