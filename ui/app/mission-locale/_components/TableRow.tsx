"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";

import { EffectifData } from "./types";

type TableRowProps = {
  student: EffectifData;
  isTraite: boolean;
};

export const TableRow = ({ student, isTraite }: TableRowProps) => {
  if (!isTraite) {
    return [
      <Badge key={student.id} severity="new" small>
        à traiter
      </Badge>,
      <div
        key={`badge-${student.id}`}
        className="fr-text--bold"
        style={{ display: "flex", alignItems: "center", gap: "8px" }}
      >
        {`${student.nom} ${student.prenom}`}
      </div>,
      <span key={`formation-${student.id}`} className="line-clamp-1">
        {student.libelle_formation}
      </span>,
      <i key={`icon-${student.id}`} className="fr-icon-arrow-right-line fr-icon--sm"></i>,
    ];
  }

  return [
    <div
      key={`badge-${student.id}`}
      className="fr-text--bold"
      style={{ display: "flex", alignItems: "center", gap: "8px" }}
    >
      {`${student.nom} ${student.prenom}`}
    </div>,
    <span key={`formation-${student.id}`} className="line-clamp-1">
      {student.libelle_formation}
    </span>,
    <Badge key={student.id} severity="success" small>
      traité
    </Badge>,
    <i key={`icon-${student.id}`} className="fr-icon-arrow-right-line fr-icon--sm"></i>,
  ];
};
