"use client";

import { format } from "date-fns/index";
import { fr } from "date-fns/locale";
import Image from "next/image";
import { useParams } from "next/navigation";
import React, { useMemo } from "react";
import { API_EFFECTIF_LISTE } from "shared";

import { LightTable } from "@/app/_components/table/LightTable";
import { useAuth } from "@/app/_context/UserContext";

import styles from "./PriorityTable.module.css";
import { EffectifPriorityData } from "./types";

type PriorityTableProps = {
  priorityData?: EffectifPriorityData[];
  searchTerm: string;
  hadEffectifsPrioritaires?: boolean;
};

function formatMonthAndYear(dateStr: string | undefined): string {
  if (!dateStr) return "Date inconnue";
  const d = new Date(dateStr);
  const raw = format(d, "MMMM yyyy", { locale: fr });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function PriorityBadge({ priorityData }: { priorityData: EffectifPriorityData[] }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
      <p className="fr-badge fr-badge--orange-terre-battue" style={{ gap: "0.5rem" }}>
        <i className="fr-icon-fire-fill fr-icon--sm" /> À TRAITER EN PRIORITÉ ({priorityData.length})
      </p>
    </div>
  );
}

export function PriorityTable({ priorityData = [], searchTerm, hadEffectifsPrioritaires = false }: PriorityTableProps) {
  const { user } = useAuth();
  const params = useParams();
  const mlId = params?.id as string | undefined;

  const columns = useMemo(() => {
    return [
      { label: "", dataKey: "monthBadge", width: 150 },
      { label: "", dataKey: "name", width: 200 },
      { label: "", dataKey: "formation", width: "auto" },
      { label: "", dataKey: "arrow", width: 40 },
    ];
  }, []);

  const tableData = useMemo(() => {
    return priorityData.map((effectif) => {
      const labelMonth = formatMonthAndYear(effectif.date_rupture || "");
      return {
        rawData: effectif,
        element: {
          id: effectif.id,
          monthBadge: <p className="fr-badge fr-badge--beige-gris-galet fr-badge--sm">{labelMonth}</p>,
          name: <strong>{`${effectif.nom} ${effectif.prenom}`}</strong>,
          formation: <span className="line-clamp-1">{effectif.libelle_formation}</span>,
          arrow: <i className="fr-icon-arrow-right-line fr-icon--sm" />,
        },
      };
    });
  }, [priorityData]);

  if (priorityData.length === 0 && !hadEffectifsPrioritaires) {
    return;
  }

  return (
    <div
      style={{
        padding: "16px",
        marginTop: "32px",
        background: "var(--background-alt-blue-france)",
      }}
      className={styles.priorityContainer}
    >
      {priorityData.length === 0 && hadEffectifsPrioritaires && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <PriorityBadge priorityData={priorityData} />
            <p style={{ fontWeight: "bold", margin: "0", fontSize: "14px" }}>
              Tous les jeunes de cette liste ont été contactés !
            </p>
          </div>
          <Image
            src="/images/mission-locale-valid-tick.svg"
            alt=""
            width={50}
            height={50}
            style={{
              width: "50px",
              height: "auto",
              userSelect: "none",
            }}
          />
        </div>
      )}

      {priorityData.length > 0 && (
        <>
          <PriorityBadge priorityData={priorityData} />
          <p style={{ margin: "0 0 16px 0", fontSize: "14px" }}>
            Nous affichons dans cette liste <strong>les jeunes âgés de 16 à 18 ans</strong> (obligation de formation)
            ainsi que <strong>les jeunes en situation de handicap (RQTH)</strong> et les{" "}
            <strong>jeunes qui ont indiqué avoir besoin d&apos;être accompagnés par vos services</strong> (campagne
            mailing)..
          </p>
          <LightTable
            caption=""
            data={tableData}
            columns={columns}
            itemsPerPage={7}
            emptyMessage="Aucun élément prioritaire"
            searchTerm={searchTerm}
            searchableColumns={["nom", "prenom"]}
            getRowLink={(rowData) => {
              return user.organisation.type === "ADMINISTRATEUR" && mlId
                ? `/admin/mission-locale/${mlId}/edit/${rowData.id}/?nom_liste=${API_EFFECTIF_LISTE.PRIORITAIRE}`
                : `/mission-locale/${rowData.id}?nom_liste=${API_EFFECTIF_LISTE.PRIORITAIRE}`;
            }}
          />
        </>
      )}
    </div>
  );
}
