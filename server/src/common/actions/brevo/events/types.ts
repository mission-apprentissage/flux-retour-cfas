import { BrevoEventPayload } from "@/common/services/brevo/brevo";

/**
 * Contexte sérialisable transporté par le job `brevo-events:track`. Volontairement
 * minimal (identifiants) : `buildPayload` relit les données fraîches en base au
 * moment du traitement.
 */
export type BrevoEventInput = { userId: string };

/**
 * Ce que `buildPayload` produit : le payload SDK complet SAUF `eventName`
 */
export type BrevoEventBuildResult = Omit<BrevoEventPayload, "eventName">;

/**
 * Définition d'un événement Brevo pour un usecase donné.
 *
 * Ajouter un événement = créer un fichier `*.event.ts` qui exporte une définition,
 * puis l'enregistrer dans `registry.ts`. Aucun autre point du code n'est à modifier.
 */
export type BrevoEventDefinition = {
  // Clé d'usecase interne : identifie l'événement dans le registry et le payload de job.
  key: string;
  // Nom de l'événement tel qu'attendu par le scénario d'automation côté Brevo.
  eventName: string;
  // Construit le payload à envoyer.
  buildPayload: (input: BrevoEventInput) => Promise<BrevoEventBuildResult | null>;
};
