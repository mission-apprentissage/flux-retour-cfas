"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { Field, Form, Formik, type FormikErrors } from "formik";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { IOrganisationJson } from "shared";
import { CGU_VERSION } from "shared/constants";

import { PAGES } from "@/app/_utils/routes.utils";
import { _get, _post } from "@/common/httpClient";
import { getApiErrorMessage } from "@/common/rateLimit";

import { AuthCard } from "../../_components/AuthCard";
import { PasswordField } from "../../_components/PasswordField";
import {
  ADMIN_PASSWORD_MIN_LENGTH,
  DEFAULT_PASSWORD_MIN_LENGTH,
  getPasswordError,
} from "../../_components/passwordRules";

import { OrganisationSummary } from "./OrganisationSummary";
import styles from "./profil.module.scss";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMAIL_HINT =
  "Courriel nominatif professionnel lié à votre organisation (ex. : prenom.nom@cfa-dumoulin.fr). " +
  "Les adresses génériques (contact@, apprentissage@…) et personnelles (@gmail, @orange…) ne peuvent pas être validées.";

type ProfilValues = {
  email: string;
  civility: string;
  nom: string;
  prenom: string;
  fonction: string;
  telephone: string;
  password: string;
  password_confirmation: string;
  has_accepted_cgu: boolean;
  consent_of: boolean;
};

export default function ProfilClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [organisation, setOrganisation] = useState<IOrganisationJson | null>(null);
  const [fixedEmail, setFixedEmail] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  const organisationParam = searchParams?.get("organisation");
  const invitationToken = searchParams?.get("invitationToken");

  useEffect(() => {
    if (organisationParam) {
      try {
        setOrganisation(JSON.parse(organisationParam));
      } catch {
        setLoadError("Les informations de votre organisation sont illisibles. Merci de reprendre l'inscription.");
      }
      return;
    }

    if (invitationToken) {
      (async () => {
        try {
          const invitation: any = await _get(`/api/v1/invitations/${invitationToken}`);
          setOrganisation(invitation.organisation);
          setFixedEmail(invitation.email);
        } catch (err: any) {
          setLoadError(getApiErrorMessage(err));
        }
      })();
      return;
    }

    setLoadError("Nous n'avons pas retrouvé votre organisation. Merci de reprendre l'inscription depuis le début.");
  }, [organisationParam, invitationToken]);

  if (loadError) {
    return (
      <AuthCard title="Créer votre compte">
        <Alert severity="error" small description={loadError} />
        <div className={styles.actions}>
          <Button priority="secondary" linkProps={{ href: PAGES.dynamic.authInscription().getPath() }}>
            Reprendre l&apos;inscription
          </Button>
        </div>
      </AuthCard>
    );
  }

  if (!organisation) {
    return null;
  }

  const passwordMinLength =
    organisation.type === "ADMINISTRATEUR" ? ADMIN_PASSWORD_MIN_LENGTH : DEFAULT_PASSWORD_MIN_LENGTH;
  const isOrganismeFormation = organisation.type === "ORGANISME_FORMATION";
  const isMissionLocale = organisation.type === "MISSION_LOCALE";
  const showConsentOf = isOrganismeFormation || isMissionLocale;

  const validate = (values: ProfilValues) => {
    const errors: FormikErrors<ProfilValues> = {};

    if (!values.email) errors.email = "Votre email est obligatoire";
    else if (!EMAIL_REGEX.test(values.email)) errors.email = "Format d'email invalide";
    if (!values.civility) errors.civility = "Votre civilité est obligatoire";
    if (!values.nom) errors.nom = "Votre nom est obligatoire";
    if (!values.prenom) errors.prenom = "Votre prénom est obligatoire";
    if (!values.fonction) errors.fonction = "Votre fonction est obligatoire";

    const passwordError = getPasswordError(values.password, passwordMinLength);
    if (passwordError) errors.password = passwordError;
    if (values.password_confirmation !== values.password) {
      errors.password_confirmation = "Les mots de passe doivent correspondre.";
    }

    if (!values.has_accepted_cgu) errors.has_accepted_cgu = "Vous devez cocher cette case";
    if (showConsentOf && !values.consent_of) errors.consent_of = "Vous devez cocher cette case";

    return errors;
  };

  const handleSubmit = async (values: ProfilValues, { setStatus, setSubmitting }: any) => {
    try {
      const { account_status } = await _post("/api/v1/auth/register", {
        user: {
          email: values.email,
          civility: values.civility,
          nom: values.nom,
          prenom: values.prenom,
          fonction: values.fonction,
          telephone: values.telephone,
          password: values.password,
          has_accept_cgu_version: CGU_VERSION,
        },
        organisation,
      });

      if (account_status === "CONFIRMED") {
        router.push(PAGES.static.authConnexion.getPath());
      } else {
        router.push(PAGES.static.authInscriptionBravo.getPath());
      }
    } catch (err: any) {
      const message = getApiErrorMessage(err);
      setStatus({
        error: message === "Aucun organisme trouvé" ? "Ce code UAI n'existe pas. Veuillez vérifier à nouveau" : message,
      });
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Créer votre compte"
      step={invitationToken ? undefined : { current: 3, total: 3, title: "Vos informations" }}
    >
      <OrganisationSummary organisation={organisation} />

      <Formik<ProfilValues>
        initialValues={{
          email: fixedEmail,
          civility: "",
          nom: "",
          prenom: "",
          fonction: "",
          telephone: "",
          password: "",
          password_confirmation: "",
          has_accepted_cgu: false,
          consent_of: false,
        }}
        enableReinitialize
        validate={validate}
        onSubmit={handleSubmit}
      >
        {({ status = {}, isSubmitting, setFieldValue }) => (
          <Form noValidate>
            <Field name="email">
              {({ field, meta }: any) => (
                <Input
                  label={
                    <>
                      Votre courriel <span className={styles.requiredMark}>*</span>
                    </>
                  }
                  hintText={EMAIL_HINT}
                  disabled={fixedEmail !== ""}
                  state={meta.touched && meta.error ? "error" : "default"}
                  stateRelatedMessage={meta.touched ? meta.error : undefined}
                  nativeInputProps={{
                    id: field.name,
                    name: field.name,
                    type: "email",
                    value: field.value,
                    placeholder: "Ex : jeandupont@cfa.fr",
                    onChange: field.onChange,
                    onBlur: field.onBlur,
                  }}
                />
              )}
            </Field>

            <Field name="civility">
              {({ field, meta }: any) => (
                <RadioButtons
                  legend={
                    <>
                      Votre civilité <span className={styles.requiredMark}>*</span>
                    </>
                  }
                  name={field.name}
                  orientation="horizontal"
                  state={meta.touched && meta.error ? "error" : "default"}
                  stateRelatedMessage={meta.touched ? meta.error : undefined}
                  options={["Monsieur", "Madame"].map((civility) => ({
                    label: civility,
                    nativeInputProps: {
                      value: civility,
                      checked: field.value === civility,
                      onChange: () => setFieldValue("civility", civility),
                    },
                  }))}
                />
              )}
            </Field>

            {[
              { name: "nom", label: "Votre nom", placeholder: "Ex : Dupont", required: true },
              { name: "prenom", label: "Votre prénom", placeholder: "Ex : Jean", required: true },
              {
                name: "fonction",
                label: "Votre fonction au sein de l'établissement",
                placeholder: "Ex : Responsable administratif",
                required: true,
              },
              { name: "telephone", label: "Téléphone", placeholder: "Ex : 06 89 10 11 12", required: false },
            ].map((input) => (
              <Field key={input.name} name={input.name}>
                {({ field, meta }: any) => (
                  <Input
                    label={
                      input.required ? (
                        <>
                          {input.label} <span className={styles.requiredMark}>*</span>
                        </>
                      ) : (
                        input.label
                      )
                    }
                    state={meta.touched && meta.error ? "error" : "default"}
                    stateRelatedMessage={meta.touched ? meta.error : undefined}
                    nativeInputProps={{
                      id: field.name,
                      name: field.name,
                      value: field.value,
                      placeholder: input.placeholder,
                      onChange: field.onChange,
                      onBlur: field.onBlur,
                    }}
                  />
                )}
              </Field>
            ))}

            <Field name="password">
              {({ field, meta }: any) => (
                <PasswordField
                  label={
                    <>
                      Mot de passe <span className={styles.requiredMark}>*</span>
                    </>
                  }
                  id={field.name}
                  name={field.name}
                  value={field.value}
                  placeholder="Choisissez votre mot de passe"
                  minLength={passwordMinLength}
                  hasError={Boolean(meta.touched && meta.error)}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            </Field>

            <Field name="password_confirmation">
              {({ field, meta }: any) => (
                <PasswordField
                  label={
                    <>
                      Confirmation du mot de passe <span className={styles.requiredMark}>*</span>
                    </>
                  }
                  id={field.name}
                  name={field.name}
                  value={field.value}
                  placeholder="Confirmez votre mot de passe"
                  minLength={passwordMinLength}
                  showRules={false}
                  hasError={Boolean(field.value && meta.error)}
                  stateRelatedMessage={field.value ? meta.error : undefined}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            </Field>

            <div className={styles.consents}>
              <Field name="has_accepted_cgu">
                {({ field, meta }: any) => (
                  <Checkbox
                    className={styles.checkbox}
                    state={meta.touched && meta.error ? "error" : "default"}
                    stateRelatedMessage={meta.touched ? meta.error : undefined}
                    options={[
                      {
                        label: (
                          <span>
                            J&apos;atteste avoir lu et accepté les{" "}
                            <a
                              className={fr.cx("fr-link")}
                              href={PAGES.static.cgu.getPath()}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              conditions générales d&apos;utilisation
                            </a>
                          </span>
                        ),
                        nativeInputProps: {
                          name: field.name,
                          checked: field.value,
                          onChange: () => setFieldValue("has_accepted_cgu", !field.value),
                        },
                      },
                    ]}
                  />
                )}
              </Field>

              {showConsentOf && (
                <Field name="consent_of">
                  {({ field, meta }: any) => (
                    <Checkbox
                      className={styles.checkbox}
                      state={meta.touched && meta.error ? "error" : "default"}
                      stateRelatedMessage={meta.touched ? meta.error : undefined}
                      options={[
                        {
                          label: `J'accepte d'être contacté par un opérateur public (DREETS, Académie, …)${
                            isMissionLocale ? " ou un CFA de mon territoire" : ""
                          }. Mon email apparaîtra dans le profil dans mon organisme.`,
                          nativeInputProps: {
                            name: field.name,
                            checked: field.value,
                            onChange: () => setFieldValue("consent_of", !field.value),
                          },
                        },
                      ]}
                    />
                  )}
                </Field>
              )}
            </div>

            {status.error && (
              <div className={styles.alert}>
                <Alert severity="error" small description={status.error} />
              </div>
            )}

            <div className={styles.actions}>
              <Button type="button" priority="secondary" onClick={() => router.back()}>
                Revenir
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                S&rsquo;inscrire
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </AuthCard>
  );
}
