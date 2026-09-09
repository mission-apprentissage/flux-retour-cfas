"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import { useFormik } from "formik";
import { useState } from "react";
import { z } from "zod";

import { _post } from "@/common/httpClient";

import styles from "./encart-admin.module.scss";

export const inviteCfaAdminModal = createModal({
  id: "invite-cfa-admin",
  isOpenedByDefault: false,
});

interface InviteCfaAdminModalProps {
  siret: string;
  uai?: string | null;
  organismeNom: string;
  onSuccess?: (message: string) => void;
}

interface InviteResponse {
  email: string;
  organismeNom: string;
  expiresAt: string;
  warning?: string;
}

const emailSchema = z.string().email("Email invalide");

interface FormValues {
  email: string;
  prenom: string;
  nom: string;
  confirm: boolean;
}

function validate(values: FormValues) {
  const errors: Partial<Record<keyof FormValues, string>> = {};
  if (!values.email.trim()) {
    errors.email = "Email requis";
  } else if (!emailSchema.safeParse(values.email.trim()).success) {
    errors.email = "Email invalide";
  }
  if (!values.prenom.trim()) {
    errors.prenom = "Prénom requis";
  } else if (values.prenom.trim().length > 100) {
    errors.prenom = "Prénom trop long (100 caractères maximum)";
  }
  if (!values.nom.trim()) {
    errors.nom = "Nom requis";
  } else if (values.nom.trim().length > 100) {
    errors.nom = "Nom trop long (100 caractères maximum)";
  }
  if (!values.confirm) {
    errors.confirm = "Merci de confirmer l'envoi de l'email";
  }
  return errors;
}

export function InviteCfaAdminModal({ siret, uai, organismeNom, onSuccess }: InviteCfaAdminModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingConflict, setPendingConflict] = useState<{ email: string } | null>(null);
  const [resending, setResending] = useState(false);

  const formik = useFormik<FormValues>({
    initialValues: { email: "", prenom: "", nom: "", confirm: false },
    validate,
    onSubmit: async (values) => {
      setServerError(null);
      setPendingConflict(null);
      try {
        const res = await _post<any, InviteResponse>("/api/v1/admin/users/cfa/admin-invite", {
          email: values.email.trim().toLowerCase(),
          siret,
          ...(uai ? { uai } : {}),
          prenom: values.prenom.trim(),
          nom: values.nom.trim(),
        });
        const expireTxt = new Date(res.expiresAt).toLocaleString("fr-FR");
        onSuccess?.(
          `Invitation envoyée à ${res.email}. Expire le ${expireTxt}.${res.warning ? ` ${res.warning}` : ""}`
        );
        formik.resetForm();
        inviteCfaAdminModal.close();
      } catch (err: any) {
        const msg: string = err?.json?.data?.message || err?.message || "Une erreur est survenue";
        const statusCode = err?.json?.status ?? err?.status;
        if (statusCode === 409 && msg.toLowerCase().includes("invitation")) {
          setPendingConflict({ email: values.email.trim().toLowerCase() });
        }
        setServerError(msg);
      }
    },
  });

  const handleResend = async () => {
    if (!pendingConflict) return;
    setResending(true);
    setServerError(null);
    try {
      const res = await _post<any, InviteResponse>("/api/v1/admin/users/cfa/admin-invite/resend", {
        email: pendingConflict.email,
        siret,
        ...(uai ? { uai } : {}),
      });
      const expireTxt = new Date(res.expiresAt).toLocaleString("fr-FR");
      onSuccess?.(`Email renvoyé à ${res.email}. Nouvelle expiration : ${expireTxt}.`);
      formik.resetForm();
      setPendingConflict(null);
      inviteCfaAdminModal.close();
    } catch (err: any) {
      setServerError(err?.json?.data?.message || err?.message || "Échec du renvoi");
    } finally {
      setResending(false);
    }
  };

  useIsModalOpen(inviteCfaAdminModal, {
    onConceal: () => {
      formik.resetForm();
      setServerError(null);
      setPendingConflict(null);
    },
  });

  return (
    <inviteCfaAdminModal.Component
      title="Inviter un administrateur CFA"
      buttons={[
        {
          children: "Annuler",
          priority: "secondary",
          doClosesModal: true,
          disabled: formik.isSubmitting,
        },
        {
          children: "Envoyer l'invitation",
          priority: "primary",
          doClosesModal: false,
          disabled: !formik.isValid || !formik.dirty || !formik.values.confirm || formik.isSubmitting,
          nativeButtonProps: { type: "submit", form: "invite-cfa-admin-form" },
        },
      ]}
    >
      <form id="invite-cfa-admin-form" onSubmit={formik.handleSubmit} noValidate>
        <div className={styles.organismeBox}>
          <p className="fr-text--bold fr-mb-0">{organismeNom}</p>
          <p className={`${styles.muted} fr-mb-0`}>
            SIRET {siret}
            {uai ? ` · UAI ${uai}` : ""}
          </p>
        </div>

        <Input
          label="Email du destinataire"
          state={formik.touched.email && formik.errors.email ? "error" : "default"}
          stateRelatedMessage={formik.touched.email ? formik.errors.email : undefined}
          nativeInputProps={{
            id: "invite-cfa-admin-email",
            name: "email",
            type: "email",
            autoComplete: "off",
            placeholder: "prenom.nom@cfa.fr",
            value: formik.values.email,
            onChange: formik.handleChange,
            onBlur: formik.handleBlur,
            required: true,
          }}
        />

        <div className={styles.formRow}>
          <Input
            label="Prénom"
            state={formik.touched.prenom && formik.errors.prenom ? "error" : "default"}
            stateRelatedMessage={formik.touched.prenom ? formik.errors.prenom : undefined}
            nativeInputProps={{
              id: "invite-cfa-admin-prenom",
              name: "prenom",
              value: formik.values.prenom,
              onChange: formik.handleChange,
              onBlur: formik.handleBlur,
              required: true,
            }}
          />
          <Input
            label="Nom"
            state={formik.touched.nom && formik.errors.nom ? "error" : "default"}
            stateRelatedMessage={formik.touched.nom ? formik.errors.nom : undefined}
            nativeInputProps={{
              id: "invite-cfa-admin-nom",
              name: "nom",
              value: formik.values.nom,
              onChange: formik.handleChange,
              onBlur: formik.handleBlur,
              required: true,
            }}
          />
        </div>

        <Checkbox
          state={formik.touched.confirm && formik.errors.confirm ? "error" : "default"}
          stateRelatedMessage={formik.touched.confirm ? formik.errors.confirm : undefined}
          options={[
            {
              label: "J'ai vérifié l'email et je confirme l'envoi de l'invitation.",
              nativeInputProps: {
                name: "confirm",
                checked: formik.values.confirm,
                onChange: formik.handleChange,
                onBlur: formik.handleBlur,
              },
            },
          ]}
        />

        {serverError && (
          <Alert
            severity={pendingConflict ? "warning" : "error"}
            small
            className="fr-mt-2w"
            description={
              <>
                {serverError}
                {pendingConflict && (
                  <div className="fr-mt-1w">
                    <Button type="button" priority="primary" size="small" disabled={resending} onClick={handleResend}>
                      {resending ? "Renvoi en cours…" : "Renvoyer l'email"}
                    </Button>
                  </div>
                )}
              </>
            }
          />
        )}
      </form>
    </inviteCfaAdminModal.Component>
  );
}
