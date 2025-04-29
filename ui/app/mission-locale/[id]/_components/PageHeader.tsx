"use client";

import { Box, Skeleton, Typography } from "@mui/material";
import { API_EFFECTIF_LISTE } from "shared";

import { DsfrLink } from "@/app/_components/link/DsfrLink";

export function PageHeader({
  previous,
  next,
  total,
  currentIndex,
  isLoading,
  isATraiter,
  nomListe,
}: {
  previous?: { id: string };
  next?: { id: string };
  total?: number;
  currentIndex: number;
  isLoading?: boolean;
  isATraiter?: boolean;
  nomListe?: string;
}) {
  const getHref = (id: string) => `/mission-locale/${id}${nomListe ? `?nom_liste=${nomListe}` : ""}`;

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      p={2}
      sx={{ border: "1px solid var(--border-default-grey)" }}
    >
      {previous ? (
        <DsfrLink href={getHref(previous.id)} arrow="none" className="fr-link--icon-left fr-icon-arrow-left-s-line">
          Précédent
        </DsfrLink>
      ) : (
        <Box />
      )}

      <Box display="flex" alignItems="center">
        {!isLoading && total !== undefined ? (
          <>
            <Box display={{ xs: "none", sm: "flex" }} alignItems="center">
              {nomListe === API_EFFECTIF_LISTE.PRIORITAIRE ? (
                <Typography fontWeight="bold">
                  Dossier n°{currentIndex + 1} sur {total} à traiter en priorité
                </Typography>
              ) : nomListe === API_EFFECTIF_LISTE.INJOIGNABLE ? (
                <Typography fontWeight="bold">
                  Dossier n°{currentIndex + 1} sur {total} injoignable
                </Typography>
              ) : (
                <>
                  <Typography fontWeight="bold">
                    Dossier n°{currentIndex + 1} sur {total} {isATraiter ? "encore à traiter" : "traité"}
                  </Typography>
                </>
              )}
              <Typography component="span" sx={{ marginLeft: 1 }}>
                (tous mois confondus)
              </Typography>
            </Box>

            <Box display={{ xs: "flex", sm: "none" }} alignItems="center">
              <Typography fontWeight="bold">
                {currentIndex + 1}/{total}
              </Typography>
            </Box>
          </>
        ) : (
          <Skeleton animation="wave" variant="text" width={180} />
        )}
      </Box>

      {next ? (
        <DsfrLink href={getHref(next.id)} arrow="none" className="fr-link--icon-right fr-icon-arrow-right-s-line">
          Suivant
        </DsfrLink>
      ) : (
        <Box />
      )}
    </Box>
  );
}
