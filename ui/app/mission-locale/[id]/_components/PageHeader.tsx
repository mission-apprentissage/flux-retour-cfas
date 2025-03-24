import { Box, Skeleton, Typography } from "@mui/material";

import { DsfrLink } from "@/app/_components/link/DsfrLink";

export function PageHeader({ previous, next, total, currentIndex, isLoading, isATraiter }) {
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      p={2}
      sx={{ border: "1px solid var(--border-default-grey)" }}
    >
      {previous ? (
        <DsfrLink
          href={`/mission-locale/${previous.id}`}
          arrow="none"
          className="fr-link--icon-left fr-icon-arrow-left-s-line"
        >
          Précédent
        </DsfrLink>
      ) : (
        <Box />
      )}

      <Box display="flex" alignItems="center">
        {!isLoading && total !== undefined ? (
          <>
            <Typography fontWeight="bold">
              Dossier n°{currentIndex + 1} sur {total} {isATraiter ? "encore à traiter" : "traité"}
            </Typography>
            <Typography component="span" sx={{ marginLeft: 1 }}>
              (tous mois confondus)
            </Typography>
          </>
        ) : (
          <Skeleton animation="wave" variant="text" width={480} />
        )}
      </Box>

      {next ? (
        <DsfrLink
          href={`/mission-locale/${next.id}`}
          arrow="none"
          className="fr-link--icon-right fr-icon-arrow-right-s-line"
        >
          Suivant
        </DsfrLink>
      ) : (
        <Box />
      )}
    </Box>
  );
}
