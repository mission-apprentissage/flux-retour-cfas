import type { ReactNode } from "react";

// Style partagé des filtres "collaboration" : met en gras la mention "hors collaboration"
// dans un libellé d'option. Utilisé aussi bien par le filtre "Statut collaboration ML"
// (liste rupture) que "Statut suivi ML" (page collaborations), dont les libellés diffèrent.
export function highlightHorsCollab(label: string): ReactNode {
  const marker = "hors collaboration";
  const index = label.toLowerCase().indexOf(marker);
  if (index === -1) {
    return label;
  }
  return (
    <>
      {label.slice(0, index)}
      <strong>{label.slice(index, index + marker.length)}</strong>
      {label.slice(index + marker.length)}
    </>
  );
}
