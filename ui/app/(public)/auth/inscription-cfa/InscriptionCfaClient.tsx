"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { PasswordInput } from "@codegouvfr/react-dsfr/blocks/PasswordInput";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Stepper } from "@codegouvfr/react-dsfr/Stepper";
import { useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { maskEmail } from "shared/utils/maskEmail";

import {
  type CfaOnboardingInfo,
  OnboardingError,
  OnboardingLayout,
  OnboardingSidePanel,
  OnboardingSkeleton,
  type OnboardingMlItem,
  useCfaInvitationInfo,
} from "@/app/_components/onboarding";
import { _post } from "@/common/httpClient";

import styles from "./InscriptionCfa.module.css";

type Step = 1 | 2 | 3;

const RESEND_COOLDOWN_STORAGE_KEY = "inscription_cfa_resend_locked_until";
const RESEND_COOLDOWN_MS = 60_000;

const PASSWORD_RULES = [
  { label: "Au moins 12 caractères", test: (p: string) => p.length >= 12 },
  { label: "1 lettre minuscule", test: (p: string) => /[a-z]/.test(p) },
  { label: "1 lettre majuscule", test: (p: string) => /[A-Z]/.test(p) },
  { label: "1 chiffre", test: (p: string) => /\d/.test(p) },
  { label: "1 caractère spécial (ex : ! @ # $ % & * - _)", test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
];

const SIDE_PANEL_INTRO =
  "Le Tableau de bord de l'apprentissage : l'outil de collaboration entre les CFA et les Missions Locales pour l'accompagnement des jeunes en rupture de contrat d'apprentissage.";

const SIDE_PANEL_ILLUSTRATION = {
  src: "/images/illu-onboarding.png",
  alt: "Illustration collaboration CFA et Missions Locales",
};

function Step1({ info, onNext }: { info: CfaOnboardingInfo; onNext: () => void }) {
  const [cguAccepted, setCguAccepted] = useState(false);

  return (
    <div>
      <Stepper currentStep={1} stepCount={2} title="Mon établissement de formation" nextTitle="Mes informations" />

      <div className={styles.etabCard}>
        <i className={`${fr.cx("ri-school-line", "fr-icon--lg")} ${styles.etabIcon}`} />
        <div>
          <p className={styles.etabName}>{info.etablissement.nom}</p>
          <p className={styles.etabLine}>{info.etablissement.adresse}</p>
          <p className={styles.etabLine}>
            {info.etablissement.uai && `UAI ${info.etablissement.uai}`}
            {info.etablissement.uai && info.etablissement.siret && " | "}
            {info.etablissement.siret && `SIRET ${info.etablissement.siret}`}
          </p>
        </div>
      </div>

      <Checkbox
        small
        className={styles.cguCheckbox}
        options={[
          {
            label: (
              <span>
                J&apos;accepte les{" "}
                <a href="/cgu" target="_blank" rel="noopener" className={styles.cguLink}>
                  conditions générales d&apos;utilisation
                </a>{" "}
                du service du Tableau de bord de l&apos;apprentissage et je prends connaissance de la{" "}
                <a href="/politique-de-confidentialite" target="_blank" rel="noopener" className={styles.cguLink}>
                  politique de confidentialité
                </a>
              </span>
            ),
            nativeInputProps: {
              checked: cguAccepted,
              onChange: () => setCguAccepted((v) => !v),
            },
          },
        ]}
      />

      <div className={styles.step1Actions}>
        <Button disabled={!cguAccepted} iconId="ri-arrow-right-line" iconPosition="right" onClick={onNext}>
          Continuer
        </Button>
      </div>

      <div className={styles.step1Secondary}>
        <a
          href="mailto:tableau-de-bord@apprentissage.beta.gouv.fr?subject=Ce n'est pas mon établissement"
          className={styles.notMyEtab}
        >
          Ce n&apos;est pas mon établissement
        </a>
      </div>
    </div>
  );
}

function Step2({
  info,
  onSubmit,
}: {
  info: CfaOnboardingInfo;
  onSubmit: (data: {
    nom: string;
    prenom: string;
    telephone: string;
    fonction: string;
    password: string;
  }) => Promise<void>;
}) {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [fonction, setFonction] = useState("");
  const [password, setPassword] = useState("");
  const [habilitationAccepted, setHabilitationAccepted] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = info.role === "admin";
  const passwordValid = PASSWORD_RULES.every((r) => r.test(password));
  const telephoneValid = /^\d{10}$/.test(telephone);

  const canSubmit =
    prenom.trim() && nom.trim() && telephoneValid && fonction.trim() && passwordValid && habilitationAccepted;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({ nom: nom.trim(), prenom: prenom.trim(), telephone, fonction: fonction.trim(), password });
    } catch (err: any) {
      setError(err?.json?.data?.message || err.message || "Une erreur est survenue");
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Stepper currentStep={2} stepCount={2} title="Mes informations" />

      <form onSubmit={handleSubmit} noValidate>
        <div>
          <Input label="Votre courriel" disabled nativeInputProps={{ value: info.email, readOnly: true }} />
          <p className={styles.infoHint}>
            <i className={`${fr.cx("fr-icon-info-fill", "fr-icon--sm")} ${styles.infoHintIcon}`} aria-hidden="true" />
            <span>
              En créant votre compte vous acceptez que l&rsquo;équipe du service puisse vous recontacter pour vous aider
              dans votre utilisation du service
            </span>
          </p>

          <Input
            label={
              <>
                Prénom <span className={styles.requiredMark}>*</span>
              </>
            }
            state={touched.prenom && !prenom.trim() ? "error" : "default"}
            stateRelatedMessage={touched.prenom && !prenom.trim() ? "Champ requis" : undefined}
            nativeInputProps={{
              value: prenom,
              onChange: (e) => setPrenom(e.target.value),
              onBlur: () => setTouched((t) => ({ ...t, prenom: true })),
            }}
          />

          <Input
            label={
              <>
                Nom de famille <span className={styles.requiredMark}>*</span>
              </>
            }
            state={touched.nom && !nom.trim() ? "error" : "default"}
            stateRelatedMessage={touched.nom && !nom.trim() ? "Champ requis" : undefined}
            nativeInputProps={{
              value: nom,
              onChange: (e) => setNom(e.target.value),
              onBlur: () => setTouched((t) => ({ ...t, nom: true })),
            }}
          />

          <Input
            label={
              <>
                Votre numéro de téléphone professionnel <span className={styles.requiredMark}>*</span>
              </>
            }
            state={touched.telephone && !telephoneValid ? "error" : "default"}
            stateRelatedMessage={
              touched.telephone && !telephoneValid ? "Le numéro doit contenir 10 chiffres" : undefined
            }
            nativeInputProps={{
              value: telephone,
              onChange: (e) => setTelephone(e.target.value.replace(/\D/g, "").slice(0, 10)),
              onBlur: () => setTouched((t) => ({ ...t, telephone: true })),
              inputMode: "numeric",
            }}
          />
          <p className={styles.infoHint}>
            <i className={`${fr.cx("fr-icon-info-fill", "fr-icon--sm")} ${styles.infoHintIcon}`} aria-hidden="true" />
            <span>
              Votre numéro de téléphone ne sera utilisé que par les Missions Locales pour vous contacter sur les
              dossiers des jeunes sur lesquels vous collaborer.
            </span>
          </p>

          <Input
            label={
              <>
                Intitulé de poste au sein de l&apos;établissement <span className={styles.requiredMark}>*</span>
              </>
            }
            state={touched.fonction && !fonction.trim() ? "error" : "default"}
            stateRelatedMessage={touched.fonction && !fonction.trim() ? "Champ requis" : undefined}
            nativeInputProps={{
              value: fonction,
              onChange: (e) => setFonction(e.target.value),
              onBlur: () => setTouched((t) => ({ ...t, fonction: true })),
            }}
          />

          <div className={styles.roleBlock}>
            <p className={styles.roleTitle}>
              <i
                className={`${fr.cx("fr-icon-info-fill", "fr-icon--sm")} ${styles.roleTitleIcon}`}
                aria-hidden="true"
              />
              {isAdmin
                ? "Vous créez votre compte en tant qu'administrateur"
                : "Vous créez votre compte en tant que membre"}
            </p>
            <Checkbox
              small
              className={styles.roleCheckbox}
              options={[
                {
                  label: isAdmin
                    ? "Je confirme être habilité(e) à accéder aux données des jeunes et à administrer ce service pour mon établissement."
                    : "Je confirme être habilité(e) à accéder aux données des jeunes dans le cadre de mes missions au sein de mon établissement.",
                  nativeInputProps: {
                    checked: habilitationAccepted,
                    onChange: () => setHabilitationAccepted((v) => !v),
                  },
                },
              ]}
            />
          </div>

          <PasswordInput
            label={
              <>
                Choisissez votre mot de passe <span className={styles.requiredMark}>*</span>
              </>
            }
            nativeInputProps={{
              value: password,
              onChange: (e) => setPassword(e.target.value),
              onBlur: () => setTouched((t) => ({ ...t, password: true })),
            }}
            messages={PASSWORD_RULES.map((rule) => ({
              message: rule.label,
              severity: password ? (rule.test(password) ? "valid" : "error") : "info",
            }))}
          />

          {error && <Alert severity="error" small description={error} className={styles.infoAlert} />}

          <div className={styles.submitRow}>
            <Button type="submit" disabled={!canSubmit || submitting} iconId="ri-arrow-right-line" iconPosition="right">
              {submitting ? "Création en cours..." : "Valider et créer mon compte"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function LoginBlock() {
  return (
    <div className={styles.loginBlock}>
      <p className={styles.loginBlockText}>Vous avez déjà un compte sur le Tableau de bord de l&apos;apprentissage ?</p>
      <Button iconId="ri-arrow-right-line" iconPosition="right" linkProps={{ href: "/auth/connexion" }}>
        Je me connecte
      </Button>
    </div>
  );
}

function Step3({ email }: { email: string }) {
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [feedback, setFeedback] = useState<{ severity: "success" | "info" | "error"; message: string } | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(RESEND_COOLDOWN_STORAGE_KEY);
    if (stored && Number(stored) > Date.now()) {
      setCooldownUntil(Number(stored));
    }
  }, []);

  useEffect(() => {
    if (!cooldownUntil) return;
    if (cooldownUntil <= now) {
      setCooldownUntil(null);
      return;
    }
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [cooldownUntil, now]);

  const remainingSec = cooldownUntil ? Math.max(0, Math.ceil((cooldownUntil - now) / 1000)) : 0;
  const isLocked = remainingSec > 0;

  const handleResend = useCallback(async () => {
    if (isLocked || sending) return;
    setSending(true);
    setFeedback(null);
    try {
      const res = await _post<{ email: string }, { sent: boolean; cooldown_remaining_seconds: number }>(
        "/api/v1/auth/resend-activation-email",
        { email }
      );
      const remaining = res?.cooldown_remaining_seconds ?? 0;
      if (remaining > 0) {
        const until = Date.now() + remaining * 1000;
        sessionStorage.setItem(RESEND_COOLDOWN_STORAGE_KEY, String(until));
        setCooldownUntil(until);
        setFeedback({
          severity: "info",
          message: `Veuillez patienter ${remaining}s avant de renvoyer un courriel.`,
        });
      } else {
        const until = Date.now() + RESEND_COOLDOWN_MS;
        sessionStorage.setItem(RESEND_COOLDOWN_STORAGE_KEY, String(until));
        setCooldownUntil(until);
        setFeedback({
          severity: "success",
          message: "Un nouveau courriel vient de vous être envoyé.",
        });
      }
    } catch {
      setFeedback({
        severity: "error",
        message: "Impossible de renvoyer le courriel pour le moment. Veuillez réessayer plus tard.",
      });
    } finally {
      setSending(false);
    }
  }, [email, isLocked, sending]);

  return (
    <div className={styles.step3}>
      <i className={`${fr.cx("fr-icon-mail-unread-fill" as any)} ${styles.step3Icon}`} />
      <h2 className={styles.step3Heading}>Confirmez votre adresse courriel</h2>
      <p className={styles.step3Line}>Nous vous avons envoyé un courriel à l&apos;adresse</p>
      <p className={styles.step3Email}>{maskEmail(email)}</p>
      <p className={styles.step3Instructions}>
        Cliquez sur le lien présent dans le courriel pour activer votre compte et accéder au service pour la première
        fois.
      </p>
      <hr className={styles.step3Separator} />
      {feedback && (
        <Alert severity={feedback.severity} small description={feedback.message} className={styles.step3Alert} />
      )}
      <button
        type="button"
        onClick={handleResend}
        disabled={isLocked || sending}
        className={styles.step3ResendBtn}
        aria-live="polite"
      >
        {isLocked
          ? `Vous pourrez renvoyer un courriel dans ${remainingSec}s`
          : sending
            ? "Envoi en cours..."
            : "Je n'ai pas reçu le courriel ou le lien ne fonctionne pas"}
      </button>
    </div>
  );
}

export default function InscriptionCfaClient() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("invitationToken") ?? "";

  const [step, setStep] = useState<Step>(1);
  const [registeredPrenom, setRegisteredPrenom] = useState("");

  const onboarding = useCfaInvitationInfo();

  const handleStep2Submit = useCallback(
    async (data: { nom: string; prenom: string; telephone: string; fonction: string; password: string }) => {
      await _post("/api/v1/auth/register-cfa", {
        token,
        ...data,
        has_accept_cgu_version: "v1",
      });
      sessionStorage.setItem(RESEND_COOLDOWN_STORAGE_KEY, String(Date.now() + RESEND_COOLDOWN_MS));
      setRegisteredPrenom(data.prenom);
      setStep(3);
    },
    [token]
  );

  if (onboarding.status === "loading") {
    return <OnboardingSkeleton />;
  }

  if (onboarding.status === "idle") {
    return <OnboardingError description="Lien d'invitation invalide. Aucun jeton fourni." backHref="/auth/connexion" />;
  }

  if (onboarding.status === "error") {
    return <OnboardingError description={onboarding.message} backHref="/auth/connexion" />;
  }

  const info = onboarding.data;

  const etablissementVille = info.etablissement.commune || "";

  const title =
    step === 3 ? (
      <>
        Votre création de compte est presque terminée <span className={styles.accent}>{registeredPrenom}</span>.
      </>
    ) : (
      <>
        Activez votre compte pour l&apos;établissement{" "}
        <span className={styles.accent}>
          {info.etablissement.nom}
          {etablissementVille ? `, ${etablissementVille}` : ""}
        </span>
      </>
    );

  const mlItems: OnboardingMlItem[] = info.missionsLocales.map((ml) => ({
    id: ml._id,
    nom: ml.nom,
    subtext: ml.commune ? `${ml.commune}${ml.codePostal ? ` ${ml.codePostal}` : ""}` : undefined,
  }));

  return (
    <OnboardingLayout
      sidebar={
        <OnboardingSidePanel
          illustration={SIDE_PANEL_ILLUSTRATION}
          intro={SIDE_PANEL_INTRO}
          cfaCount={info.cfaConnectesCount}
          missionsLocales={mlItems}
        />
      }
      title={title}
    >
      <div className={styles.card}>
        {step === 1 && <Step1 info={info} onNext={() => setStep(2)} />}
        {step === 2 && <Step2 info={info} onSubmit={handleStep2Submit} />}
        {step === 3 && <Step3 email={info.email} />}
      </div>
      {step === 2 && <LoginBlock />}
    </OnboardingLayout>
  );
}
