import { CATALOGUE } from "./catalogue";
import type { SeedCase } from "./catalogue/types";
import { COMPTES, type Compte } from "./catalogue/utilisateurs";
import { CFA_HOST_CODES, HOST_LABELS, HOSTS_RECETTE, ML_HOST_CODES } from "./hosts";
import { email, identite } from "./identites";
import { seedId } from "./seed-ids";

const LISTES_ML = { a_traiter_ou_recontacter: "À traiter ou recontacter", traite: "Traités" } as const;
const RUPTURES_CFA = { moins_45j: "Ruptures de moins de 45 j", plus_45j: "Ruptures de 45 j et plus" } as const;
const SUIVI_CFA = { collab: "Suivi ML › Collaborations", hors_collab: "Suivi ML › Hors collaboration" } as const;

function ouVoir(seedCase: SeedCase): string {
  const { ml, cfa } = seedCase.attendu;
  const lieux: string[] = [];

  if (ml) {
    if (ml.liste === null) {
      lieux.push(`${ml.ml} : absent des listes (vérifie un filtre)`);
    } else {
      const extras = [ml.dansPrioritaires && "Dossiers prioritaires", ml.dansCollaborations && "Collaborations"]
        .filter(Boolean)
        .join(", ");
      lieux.push(`${ml.ml} › ${LISTES_ML[ml.liste]}${extras ? ` (+ ${extras})` : ""}`);
    }
  }

  if (cfa) {
    const vues = [
      cfa.ruptures && RUPTURES_CFA[cfa.ruptures],
      cfa.suivi && SUIVI_CFA[cfa.suivi],
      cfa.dansEffectifs && "Effectifs",
    ].filter(Boolean);
    lieux.push(`${cfa.cfa} › ${vues.length > 0 ? vues.join(", ") : "absent des ruptures"}`);
  }

  return lieux.join(" ; ") || "—";
}

function lien(seedCase: SeedCase): string {
  const id = seedId(seedCase.source === "DECA" ? "effectifDeca" : "effectif", seedCase.n).toHexString();
  if (seedCase.attendu.ml?.liste) return `\`/mission-locale/${id}\``;
  if (seedCase.attendu.cfa) return `\`/cfa/${id}\``;
  return "—";
}

const ligneCas = (c: SeedCase) => {
  const { prenom, nom } = identite(c.n);
  return `| ${c.code} | ${prenom} ${nom} | ${c.titre} | ${ouVoir(c)} | ${lien(c)} |`;
};

const ligneCompte = ([code, compte]: [string, Compte]) =>
  `| ${compte.prenom} ${compte.nom} | ${email(compte.prenom, compte.nom)} | ${compte.hote} | ${compte.role ?? "—"} | ${code} |`;

export function renderReadme(): string {
  const hotes = [...ML_HOST_CODES, ...CFA_HOST_CODES].map((code) => {
    const id =
      code === "ML_A" || code === "ML_B"
        ? HOSTS_RECETTE.missionsLocales[code].toHexString()
        : HOSTS_RECETTE.cfas[code].organisationId.toHexString();
    return `| ${code} | ${HOST_LABELS[code].nom} | ${HOST_LABELS[code].role} | \`${id}\` |`;
  });

  const casJeunes = CATALOGUE.filter((c) => c.attendu.ml || c.attendu.cfa);
  const autres = CATALOGUE.filter((c) => !c.attendu.ml && !c.attendu.cfa);

  return [
    "# Jeu de données fictif de recette (`seed:recette`)",
    "",
    "Fichier généré par `readme.ts` à partir du catalogue — ne pas éditer à la main.",
    "Regénérer : `npx vitest run --project server tests/unit/jobs/seed-recette-readme.test.ts -u`.",
    "",
    "## Fonctionnement",
    "",
    "- Régénéré chaque nuit à 05h30 sur recette (cron déclaré uniquement si `MNA_TDB_ENV=recette`) : purge de tout le jeu fictif, puis recréation avec des dates recalculées au jour même. **Les manipulations de la veille sont perdues.**",
    "- À la main : `yarn cli seed:recette` (`--dry-run` pour simuler, `--uninstall` pour tout retirer et remettre les flags des hôtes).",
    "- Refuse de tourner hors recette/local/test, et s'arrête sans rien écrire (désinstallation comprise) si un hôte a une activité réelle : effectif ou dossier ML actif hors seed (les anciens dossiers soft-deleted sont ignorés). En cron, l'échec remonte dans Sentry.",
    "- Tout le jeu est construit avant la moindre écriture : une erreur de construction ne laisse aucun état partiel.",
    "- La purge ne touche que le jeu fictif : `_id` en `5eed`, dossiers des ML hôtes créés sur un effectif fictif, invitations émises par un compte fictif.",
    "- Si un vrai dossier porte déjà le même nom, prénom et date de naissance qu'un jeune fictif, la date de naissance fictive est décalée de quelques jours (l'index est unique sur toutes les ML).",
    "- Tous les `_id` créés commencent par `5eed` ; les URL ci-dessous restent valides d'une nuit à l'autre.",
    "- Identités fictives : e-mails en `@example.com` (domaine réservé), téléphones dans la plage de fiction ARCEP 06 39 98.",
    "- WhatsApp : hors production, aucun envoi sans `MNA_TDB_WHATSAPP_TEST_PHONE_OVERRIDE`, et tout part alors vers ce seul numéro.",
    "",
    "## Hôtes (organisations réelles de recette)",
    "",
    "Accès par impersonation admin depuis l'organisation, ou avec un compte ci-dessous.",
    "",
    "| Code | Organisation | Rôle dans le jeu | Organisation `_id` |",
    "| --- | --- | --- | --- |",
    ...hotes,
    "",
    "## Comptes",
    "",
    "Mot de passe commun : variable `MNA_TDB_SEED_RECETTE_PASSWORD` (sops, `env.recette.yml`) — à demander, jamais écrit ici. Sans elle, les comptes existent mais ne sont pas connectables.",
    "",
    "| Nom | E-mail | Hôte | Rôle CFA | Code |",
    "| --- | --- | --- | --- | --- |",
    ...Object.entries(COMPTES).map(ligneCompte),
    "",
    "## Jeunes et cas testés",
    "",
    "| Cas | Jeune | Ce qu'il teste | Où le voir | Fiche |",
    "| --- | --- | --- | --- | --- |",
    ...casJeunes.map(ligneCas),
    "",
    "## Autres données",
    "",
    ...autres.map((c) => `- **${c.code}** : ${c.titre}`),
    "",
  ].join("\n");
}
