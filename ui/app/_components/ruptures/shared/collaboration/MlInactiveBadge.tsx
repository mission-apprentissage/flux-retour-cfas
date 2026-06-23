import { Badge } from "@codegouvfr/react-dsfr/Badge";

// Tag « partie distante pas encore utilisatrice du Tableau de bord ».
// Symétrique du tag affiché côté ML pour un CFA non utilisateur (même style DSFR error, même libellé).
export function MlInactiveBadge() {
  return (
    <Badge as="span" severity="error">
      N&apos;utilise pas encore le Tableau de bord
    </Badge>
  );
}
