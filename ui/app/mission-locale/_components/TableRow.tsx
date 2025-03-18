"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";

import { EffectifData } from "./types";

type TableRowProps = {
  student: EffectifData;
  isTraite: boolean;
};

export const TableRow = ({ student, isTraite }: TableRowProps) => {
  return [
    <div
      key={`badge-${student.id}`}
      className="fr-text--bold"
      style={{ display: "flex", alignItems: "center", gap: "8px" }}
    >
      <Badge key={student.id} severity={isTraite ? "success" : "new"} small>
        {isTraite ? "traité" : "à traiter"}
      </Badge>
      {`${student.nom} ${student.prenom}`}
    </div>,
    <span key={`formation-${student.id}`} className="line-clamp-1">
      {student.libelle_formation}
    </span>,
    <i key={`icon-${student.id}`} className={isTraite ? "ri-check-line" : "ri-arrow-right-line"}></i>,
  ];
};
