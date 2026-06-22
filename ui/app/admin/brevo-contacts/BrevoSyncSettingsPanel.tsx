"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";

import { publicConfig } from "@/config.public";

import styles from "./brevo-contacts.module.scss";
import { type BrevoSyncSettingField, useBrevoSyncSettings, useSetBrevoSyncSetting } from "./hooks/useBrevoSyncSettings";

const isProd = publicConfig.env === "production";

export function BrevoSyncSettingsPanel() {
  const { data: settings, isLoading, error } = useBrevoSyncSettings();
  const setSetting = useSetBrevoSyncSetting();

  const handleToggle = (field: BrevoSyncSettingField) => (checked: boolean) => {
    setSetting.mutate({ field, enabled: checked });
  };

  // Hors production, les synchronisations sont inopérantes (garde serveur) :
  // les toggles sont affichés mais désactivés.
  const disabled = !isProd || isLoading || setSetting.isLoading;

  return (
    <section className={styles.settingsPanel}>
      <h2 className={styles.settingsTitle}>Pilotage de la synchronisation</h2>

      {!isProd && (
        <Alert
          severity="info"
          small
          description="Ces synchronisations ne sont activables qu'en production. Les interrupteurs sont désactivés sur cet environnement."
        />
      )}
      {error ? (
        <Alert
          severity="error"
          small
          description={`Erreur de chargement des réglages : ${error instanceof Error ? error.message : "inconnue"}`}
        />
      ) : null}
      {setSetting.error ? (
        <Alert
          severity="error"
          small
          description={`Échec de la mise à jour : ${setSetting.error instanceof Error ? setSetting.error.message : "inconnue"}`}
        />
      ) : null}

      <ToggleSwitch
        inputTitle="Synchronisation quotidienne"
        label="Synchronisation quotidienne (5h)"
        helperText="Réimporte chaque matin l'ensemble des contacts TBA vers Brevo."
        labelPosition="left"
        showCheckedHint
        checked={settings?.dailyFullSyncEnabled ?? false}
        disabled={disabled}
        onChange={handleToggle("dailyFullSyncEnabled")}
      />

      <ToggleSwitch
        inputTitle="Synchro instantanée"
        label="Synchro instantanée (création de compte / changement de statut)"
        helperText="Met à jour un contact dans Brevo dès qu'un compte est créé ou que son statut change."
        labelPosition="left"
        showCheckedHint
        checked={settings?.instantSyncEnabled ?? false}
        disabled={disabled}
        onChange={handleToggle("instantSyncEnabled")}
      />
    </section>
  );
}
