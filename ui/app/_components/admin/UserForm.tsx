import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { Box, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useFormik } from "formik";
import React, { useState } from "react";
import { toFormikValidationSchema } from "zod-formik-adapter";

import { USER_STATUS_LABELS } from "@/common/constants/usersConstants";
import { _delete, _put, _post } from "@/common/httpClient";

import userSchema from "../../../modules/admin/userSchema";

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
  const [alert, setAlert] = useState<{
    message: string;
    severity: "success" | "error" | "warning" | "info";
    description?: string;
  } | null>(null);
  const { values, errors, touched, dirty, handleSubmit, handleChange, resetForm } = useFormik({
    validationSchema: toFormikValidationSchema(userSchema()),
    initialValues: {
      civility: user?.civility,
      nom: user?.nom || "",
      prenom: user?.prenom || "",
      email: user?.email || "",
      fonction: user?.fonction || "",
      telephone: user?.telephone || "",
    },
    onSubmit: async ({ civility, nom, prenom, email, fonction, telephone }, { setSubmitting }) => {
      let result;

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
          result = await _put(`/api/v1/admin/users/${user._id}`, body).catch((err) => {
            if (err.statusCode === 409) {
              return { error: "Cet email est déjà utilisé par un autre utilisateur" };
            }
            throw err;
          });
          if (result?.ok) {
            console.log({ body });
            setAlert({
              message: "Utilisateur mis à jour",
              severity: "success",
            });
            resetForm({
              values: body,
            });
          } else if (result?.error) {
            setAlert({
              message: result.error,
              severity: "error",
            });
          } else {
            setAlert({
              message: "Erreur lors de la mise à jour de l'utilisateur.",
              severity: "error",
              description: "Merci de réessayer plus tard",
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
            setAlert({
              message: "Utilisateur créé",
              severity: "success",
            });
            resetForm();
            onCreate?.(result);
          } else if (result?.error) {
            setAlert({
              message: result.error,
              severity: "error",
            });
          } else {
            setAlert({
              message: "Erreur lors de la création de l'utilisateur.",
              severity: "error",
              description: "Merci de réessayer plus tard",
            });
          }
        }
      } catch (e) {
        console.error(e);
        const response = await (e?.json ?? {});
        const message = response?.message ?? e?.message;
        setAlert({
          message: message,
          severity: "error",
        });
      }
      setSubmitting(false);
    },
  });

  const onDeleteClicked = async (e) => {
    e.preventDefault();
    if (confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) {
      const result = await _delete(`/api/v1/admin/users/${user._id}`);
      if (result?.ok) {
        setAlert({
          message: "Utilisateur supprimé",
          severity: "success",
        });
      } else {
        setAlert({
          message: "Erreur lors de la suppression de l'utilisateur.",
          severity: "error",
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
      setAlert({
        message: `L'utilisateur a été ${validate ? "validé" : "rejeté"}.`,
        severity: "success",
      });
      validate ? onUpdate?.() : onDelete?.();
    } catch (e) {
      console.error(e);
      setAlert({
        message: "Erreur lors de la validation de l'accès.",
        severity: "error",
        description: "Merci de réessayer plus tard",
      });
    }
  };

  const resendConfirmationEmail = async () => {
    try {
      await _post(`/api/v1/admin/users/${user._id}/resend-confirmation-email`);
      setAlert({
        message: "L'email de confirmation a été renvoyé.",
        severity: "success",
      });
    } catch (e) {
      console.error(e);
      setAlert({
        message: "Erreur lors de l'envoi de l'email.",
        severity: "error",
        description: "Merci de réessayer plus tard",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {alert && (
        <Alert
          severity={alert.severity}
          title={alert.message}
          description={alert.description}
          closable
          onClose={() => setAlert(null)}
          classes={{
            root: "fr-mb-3w",
          }}
        />
      )}
      <Stack spacing={3} sx={{ my: 4 }}>
        <Grid container spacing={2} columns={12}>
          <Grid size={6}>
            <Input
              label="Nom"
              nativeInputProps={{
                type: "text",
                id: "nom",
                name: "nom",
                value: values.nom,
                onChange: handleChange,
              }}
              state={errors.nom && touched.nom ? "error" : "default"}
              stateRelatedMessage={errors.nom && touched.nom ? (errors.nom as string) : undefined}
            />
          </Grid>
          <Grid size={6}>
            <Input
              label="Prénom"
              nativeInputProps={{
                type: "text",
                id: "prenom",
                name: "prenom",
                value: values.prenom,
                onChange: handleChange,
              }}
              state={errors.prenom && touched.prenom ? "error" : "default"}
              stateRelatedMessage={errors.prenom && touched.prenom ? (errors.prenom as string) : undefined}
            />
          </Grid>
          <Grid size={6}>
            <RadioButtons
              legend="Civilité"
              name="civility"
              orientation="horizontal"
              options={[
                {
                  label: "Monsieur",
                  nativeInputProps: {
                    value: "Monsieur",
                    checked: values.civility === "Monsieur",
                    onChange: handleChange,
                  },
                },
                {
                  label: "Madame",
                  nativeInputProps: {
                    value: "Madame",
                    checked: values.civility === "Madame",
                    onChange: handleChange,
                  },
                },
              ]}
              state={errors.civility && touched.civility ? "error" : "default"}
              stateRelatedMessage={errors.civility && touched.civility ? (errors.civility as string) : undefined}
            />
          </Grid>
          <Grid size={6}>
            <Input
              label="Email"
              nativeInputProps={{
                type: "email",
                id: "email",
                name: "email",
                value: values.email,
                onChange: handleChange,
              }}
              state={errors.email && touched.email ? "error" : "default"}
              stateRelatedMessage={errors.email && touched.email ? (errors.email as string) : undefined}
            />
          </Grid>
          <Grid size={6}>
            <Input
              label="Fonction"
              nativeInputProps={{
                type: "text",
                id: "fonction",
                name: "fonction",
                value: values.fonction,
                onChange: handleChange,
              }}
              state={errors.fonction && touched.fonction ? "error" : "default"}
              stateRelatedMessage={errors.fonction && touched.fonction ? (errors.fonction as string) : undefined}
            />
          </Grid>
          <Grid size={6}>
            <Input
              label="Téléphone"
              nativeInputProps={{
                type: "tel",
                id: "telephone",
                name: "telephone",
                value: values.telephone,
                onChange: handleChange,
              }}
              state={errors.telephone && touched.telephone ? "error" : "default"}
              stateRelatedMessage={errors.telephone && touched.telephone ? (errors.telephone as string) : undefined}
            />
          </Grid>
        </Grid>

        {user && (
          <>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ my: 2 }}>
              <Typography variant="body1">Statut du compte</Typography>
              <Badge severity="info">{USER_STATUS_LABELS[user.account_status] || user.account_status}</Badge>

              {user.account_status === "PENDING_EMAIL_VALIDATION" && (
                <Box sx={{ ml: 2 }}>
                  <Button priority="primary" onClick={() => resendConfirmationEmail()}>
                    Renvoyer l&apos;email de confirmation
                  </Button>
                </Box>
              )}
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center" sx={{ my: 2 }}>
              <Typography variant="body1">Type de compte</Typography>
              <Badge severity="new">{user.organisation.label}</Badge>

              {user.account_status !== "CONFIRMED" && (
                <Stack direction="row" spacing={1} sx={{ ml: 2 }}>
                  <Button priority="primary" onClick={() => confirmUserAccess(true)}>
                    Confirmer
                  </Button>
                  <Button priority="secondary" onClick={() => confirmUserAccess(false)}>
                    Rejeter
                  </Button>
                </Stack>
              )}
            </Stack>
          </>
        )}

        {user ? (
          <Box sx={{ pt: 4 }}>
            <Stack direction="row" spacing={2}>
              <Button type="submit" priority="primary" disabled={!dirty}>
                Enregistrer
              </Button>
              <Button priority="secondary" onClick={onDeleteClicked}>
                Supprimer l&apos;utilisateur
              </Button>
            </Stack>
          </Box>
        ) : (
          <Button type="submit" priority="primary">
            Créer l&apos;utilisateur
          </Button>
        )}
      </Stack>
    </form>
  );
};

export default UserForm;
