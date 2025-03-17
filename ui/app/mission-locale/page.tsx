"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import { SideMenu } from "@codegouvfr/react-dsfr/SideMenu";
import Grid from "@mui/material/Grid2";
import { useQuery } from "@tanstack/react-query";
import format from "date-fns/format/index";
import { fr } from "date-fns/locale";
import mime from "mime";
import { useState, useMemo, useEffect } from "react";
import { API_TRAITEMENT_TYPE } from "shared";

import { _get, _getBlob } from "@/common/httpClient";
import { downloadObject } from "@/common/utils/browser";

import { Table } from "../_components/Table";

function formatMonthAndYear(dateString: string) {
  const date = new Date(dateString);
  return format(date, "MMMM yyyy", { locale: fr });
}

function sortDataByMonthDescending(data: any[]) {
  return [...data].sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime());
}

function anchorFromLabel(label: string) {
  return label.replace(/\s/g, "-").toLowerCase();
}

export default function Page() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeAnchor, setActiveAnchor] = useState("");

  const { data: monthsData } = useQuery(
    ["effectifs-per-month"],
    async () => {
      return await _get(`/api/v1/organisation/mission-locale/effectifs-per-month`, {
        params: {
          type: "A_TRAITER",
        },
      });
    },
    { keepPreviousData: true }
  );
  console.log("CONSOLE LOG ~ Page ~ monthsData:", monthsData);

  const sortedData = useMemo(() => {
    if (!monthsData?.data) return [];
    return sortDataByMonthDescending(monthsData.data);
  }, [monthsData]);

  const totalToTreat = useMemo(() => {
    if (!sortedData.length) return 0;
    return sortedData.reduce((acc, item) => acc + item.data.length, 0);
  }, [sortedData]);

  useEffect(() => {
    if (sortedData.length > 0 && activeAnchor === "") {
      const label = formatMonthAndYear(sortedData[0].month);
      const anchorId = anchorFromLabel(label);
      setActiveAnchor(anchorId);
    }
  }, [sortedData, activeAnchor]);

  const sideMenuItems = useMemo(() => {
    if (!sortedData.length) return [];
    return [
      {
        text: `A traiter (${totalToTreat})`,
        expandedByDefault: true,
        items: sortedData.map((monthItem) => {
          const label = formatMonthAndYear(monthItem.month);
          const anchorId = anchorFromLabel(label);
          return {
            linkProps: {
              href: `#${anchorId}`,
              onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                setActiveAnchor(anchorId);
                const element = document.getElementById(anchorId);
                if (element) {
                  element.scrollIntoView({ behavior: "smooth" });
                }
              },
            },
            text: `${label.charAt(0).toUpperCase() + label.slice(1)} (${monthItem.data.length})`,
            isActive: activeAnchor === anchorId,
          };
        }),
      },
      {
        text: "Déjà traité",
        linkProps: {
          href: "#",
          onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault();
            setActiveAnchor("deja-traite");
          },
        },
        isActive: activeAnchor === "deja-traite",
      },
    ];
  }, [sortedData, totalToTreat, activeAnchor]);

  const onDownloadList = async (type: API_TRAITEMENT_TYPE) => {
    const fileName = `Rupturants_TBA_${new Date().toISOString().split("T")[0]}.xlsx`;

    const { data } = await _getBlob(`/api/v1/organisation/mission-locale/export/effectifs?type=${type}`);
    downloadObject(data, fileName, mime.getType("xlsx") ?? "text/plain");
  };

  return (
    <div className="fr-container">
      <Alert
        closable
        description="Nous vous mettons à disposition les contacts des jeunes et leur CFA : vous êtes encouragé à les contacter. Ne partagez pas ces listes."
        onClose={function noRefCheck() {}}
        severity="warning"
        title=""
        classes={{
          root: "fr-mb-3w",
        }}
      />

      <div className="fr-grid-row fr-grid-row--gutters fr-mb-1w fr-items-center">
        <div className="fr-col">
          <h1 className="fr-h1">Liste des jeunes en ruptures de contrat</h1>
          <p className="fr-text--sm fr-text--bold fr-mb-1w">
            Nous affichons sur le TBA tous les jeunes ayant un statut de rupture, en les classant par date de rupture
            (du plus récent au plus ancien).
          </p>
          <p className="fr-text--xs">
            Sources : CFA et <a href="#">DECA</a>
          </p>
        </div>
        <div
          className="fr-col-auto fr-text-align--right"
          style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
        >
          <Button
            iconId="ri-arrow-right-line"
            iconPosition="right"
            onClick={() => onDownloadList(API_TRAITEMENT_TYPE.A_TRAITER)}
          >
            Télécharger la liste
          </Button>
        </div>
      </div>
      <p className="fr-hr"></p>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4} size={3}>
          <SideMenu
            align="left"
            burgerMenuButtonText="Dans cette rubrique"
            sticky
            items={sideMenuItems}
            style={{ paddingRight: 0 }}
          />
        </Grid>
        <Grid item xs={12} md={8} size={9} pl={4}>
          <h2 className="fr-h2 fr-text--blue-france fr-mb-2w">A traiter</h2>

          <div>
            <SearchBar
              label="Rechercher par nom, prénom ou formation"
              renderInput={({ id, className, placeholder }) => (
                <input
                  id={id}
                  className={className}
                  placeholder={placeholder}
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              )}
            />
          </div>

          {sortedData.map((monthItem) => {
            const label = formatMonthAndYear(monthItem.month);
            const anchorId = anchorFromLabel(label);
            const dataRows = monthItem.data.map((d: any) => [
              <div
                key={`badge-${d.id}`}
                className="fr-text--bold"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Badge key={d.id} severity="new" small>
                  à traiter
                </Badge>
                {`${d.nom} ${d.prenom}`}
              </div>,
              <span key={`formation-${d.id}`} className="line-clamp-1">
                {d.libelle_formation}
              </span>,
              <i key={`icon-${d.id}`} className="ri-arrow-right-line"></i>,
            ]);

            return (
              <div key={monthItem.month} id={anchorId} className="fr-mb-4w">
                <Table
                  caption={label.charAt(0).toUpperCase() + label.slice(1) + ` (${monthItem.data.length})`}
                  data={dataRows}
                  columnWidths={["46%", "46%", "8%"]}
                  searchTerm={searchTerm}
                  searchableColumns={[0, 1]}
                  itemsPerPage={5}
                  className="fr-pt-1w"
                  getRowLink={(rowIndex) => {
                    const item = monthItem.data[rowIndex];
                    return `/mission-locale/${item.id}`;
                  }}
                  emptyMessage="Pas de rupturant à afficher ce mois-ci"
                />
              </div>
            );
          })}
        </Grid>
      </Grid>
    </div>
  );
}
