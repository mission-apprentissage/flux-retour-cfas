"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { FieldArray, Form, Formik, FormikHelpers } from "formik";
import { useCallback, useEffect, useRef } from "react";
import { z, ZodError } from "zod";

import { _post } from "@/common/httpClient";
import useToaster from "@/hooks/useToaster";

import styles from "./InvitationSidePanel.module.css";

interface InvitationSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const emailSchema = z.string().email("Adresse email invalide");

interface InvitationEntry {
  email: string;
  role: "admin" | "member";
}

interface FormValues {
  entries: InvitationEntry[];
}

const MAX_INVITATIONS = 50;

const initialValues: FormValues = {
  entries: [{ email: "", role: "member" }],
};

function validate(values: FormValues) {
  const errors: Record<string, any> = {};
  const entryErrors: Record<number, { email?: string }> = {};

  values.entries.forEach((entry, index) => {
    const trimmed = entry.email.trim();
    if (!trimmed) return;
    try {
      emailSchema.parse(trimmed);
    } catch (err) {
      if (err instanceof ZodError) {
        entryErrors[index] = { email: err.errors[0].message };
      }
    }
  });

  if (Object.keys(entryErrors).length > 0) {
    errors.entries = values.entries.map((_, i) => entryErrors[i] || undefined);
  }

  return errors;
}

export default function InvitationSidePanel({ isOpen, onClose, onSuccess }: InvitationSidePanelProps) {
  const { toastSuccess, toastError } = useToaster();
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;
    const dialog = dialogRef.current;
    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const firstFocusable = dialog.querySelector<HTMLElement>(focusableSelector);
    firstFocusable?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusableElements = dialog.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusableElements.length === 0) return;
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    dialog.addEventListener("keydown", handleTab);
    return () => dialog.removeEventListener("keydown", handleTab);
  }, [isOpen]);

  const handleSubmit = useCallback(
    async (values: FormValues, { resetForm, setSubmitting }: FormikHelpers<FormValues>) => {
      const validEntries = values.entries
        .filter((e) => e.email.trim())
        .map((e) => ({ email: e.email.trim().toLowerCase(), role: e.role }));
      const uniqueEntries = validEntries.filter(
        (entry, index, self) => self.findIndex((e) => e.email === entry.email) === index
      );
      const validEmails = uniqueEntries.map((e) => e.email);
      const roles = uniqueEntries.map((e) => e.role);

      try {
        const result = await _post<
          { emails: string[]; roles: Array<"admin" | "member"> },
          { success?: string[]; errors?: Array<{ email: string; message: string }> }
        >("/api/v1/organisation/membres/batch", { emails: validEmails, roles });

        const errors = result.errors ?? [];
        const successes = result.success ?? [];

        if (errors.length === 0) {
          toastSuccess(
            validEmails.length === 1 ? "L'invitation a été envoyée" : `${validEmails.length} invitations envoyées`
          );
          handleClose();
          onSuccess();
          return;
        }

        const errorByEmail = new Map(errors.map(({ email, message }) => [email, message]));
        const failedEntries: InvitationEntry[] = [];
        const failedErrors: Array<{ email?: string } | undefined> = [];
        const failedTouched: Array<{ email?: boolean } | undefined> = [];

        uniqueEntries.forEach((entry) => {
          const msg = errorByEmail.get(entry.email);
          if (!msg) return;
          failedEntries.push(entry);
          failedErrors.push({ email: msg });
          failedTouched.push({ email: true });
        });

        if (successes.length > 0) {
          toastSuccess(successes.length === 1 ? "1 invitation envoyée" : `${successes.length} invitations envoyées`);
          onSuccess();
        }
        toastError(errors.length === 1 ? "1 invitation en erreur" : `${errors.length} invitations en erreur`);

        resetForm({
          values: { entries: failedEntries.length > 0 ? failedEntries : initialValues.entries },
          errors: { entries: failedErrors } as any,
          touched: { entries: failedTouched } as any,
        });
      } catch (err: any) {
        toastError(err?.json?.data?.message || "Une erreur est survenue");
      } finally {
        setSubmitting(false);
      }
    },
    [handleClose, onSuccess, toastSuccess, toastError]
  );

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={handleClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Ajouter de nouveaux utilisateurs"
        className={styles.panel}
      >
        <Formik initialValues={initialValues} validate={validate} onSubmit={handleSubmit} enableReinitialize>
          {({ values, errors, touched, setFieldValue, setFieldTouched, isSubmitting }) => {
            const validEntries = values.entries.filter(
              (e) => e.email.trim() && emailSchema.safeParse(e.email.trim()).success
            );
            const hasEmptyField = values.entries.some((e) => !e.email.trim());
            const hasReachedMax = values.entries.length >= MAX_INVITATIONS;
            const canSubmit = validEntries.length > 0 && !isSubmitting;
            const ctaLabel =
              validEntries.length <= 1 ? "Valider et envoyer l'invitation" : "Valider et envoyer les invitations";

            return (
              <Form className={styles.form} noValidate>
                <div className={styles.body}>
                  <div className={styles.closeRow}>
                    <button type="button" onClick={handleClose} className={styles.closeButton}>
                      Fermer <span className="ri-close-line" aria-hidden="true" />
                    </button>
                  </div>

                  <h2 className={styles.title}>Ajouter de nouveaux utilisateurs sur le Tableau de bord</h2>

                  <FieldArray name="entries">
                    {({ push, remove }) => (
                      <>
                        {values.entries.map((entry, index) => {
                          const entryErrors = errors.entries as Array<{ email?: string } | undefined> | undefined;
                          const entryTouched = touched.entries as Array<{ email?: boolean } | undefined> | undefined;
                          const fieldError = entryErrors?.[index]?.email;
                          const fieldTouched = entryTouched?.[index]?.email;
                          const showError = fieldTouched && !!fieldError;

                          return (
                            <div key={index} className={styles.entry}>
                              <div className={styles.entryRow}>
                                <p className={styles.entryLabel}>Nouvel utilisateur</p>
                                <div className={styles.entryInput}>
                                  <Input
                                    label="Adresse email professionnelle"
                                    nativeInputProps={{
                                      type: "email",
                                      value: entry.email,
                                      onChange: (e) => setFieldValue(`entries.${index}.email`, e.target.value),
                                      onBlur: () => setFieldTouched(`entries.${index}.email`, true),
                                    }}
                                    state={showError ? "error" : "default"}
                                    stateRelatedMessage={showError ? fieldError : undefined}
                                  />
                                </div>
                                {values.entries.length > 1 && (
                                  <Button
                                    type="button"
                                    iconId="ri-close-line"
                                    priority="tertiary no outline"
                                    size="small"
                                    title="Supprimer"
                                    onClick={() => remove(index)}
                                    className={styles.removeButton}
                                  />
                                )}
                              </div>
                              <div className={styles.roleRow}>
                                <label className={styles.roleLabel}>
                                  <input
                                    type="radio"
                                    name={`entries.${index}.role`}
                                    checked={entry.role === "admin"}
                                    onChange={() => setFieldValue(`entries.${index}.role`, "admin")}
                                  />
                                  Administrateur
                                </label>
                                <label className={styles.roleLabel}>
                                  <input
                                    type="radio"
                                    name={`entries.${index}.role`}
                                    checked={entry.role === "member"}
                                    onChange={() => setFieldValue(`entries.${index}.role`, "member")}
                                  />
                                  Non-administrateur
                                </label>
                              </div>
                            </div>
                          );
                        })}

                        <div
                          className={`${styles.addRow} ${hasEmptyField || hasReachedMax ? styles.addRowDisabled : ""}`}
                        >
                          <Button
                            type="button"
                            iconId="ri-add-line"
                            iconPosition="right"
                            priority="secondary"
                            size="small"
                            onClick={() => push({ email: "", role: "member" })}
                            disabled={hasEmptyField || hasReachedMax}
                          >
                            Ajouter un autre utilisateur
                          </Button>
                        </div>
                      </>
                    )}
                  </FieldArray>
                </div>

                <div className={styles.footer}>
                  <Button type="submit" priority="primary" disabled={!canSubmit} className={styles.submitButton}>
                    {ctaLabel}
                  </Button>
                  <div className={styles.hint}>
                    <i className={`ri-information-line ${styles.hintIcon}`} aria-hidden="true" />
                    <span>
                      En tant qu&apos;administrateur sur le service du Tableau de bord de l&apos;apprentissage, vous
                      garantissez que les personnes qui auront accès au service sont habilitées à consulter les
                      informations de vos apprenants.
                    </span>
                  </div>
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
    </>
  );
}
