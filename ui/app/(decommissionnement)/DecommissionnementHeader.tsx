"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Header as DsfrHeader } from "@codegouvfr/react-dsfr/Header";
import { ListItemIcon } from "@mui/material";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useState } from "react";
import { getOrganisationLabel, IOrganisationCreate } from "shared";

import { _post } from "@/common/httpClient";

import { useAuth } from "../_context/UserContext";

function LogoutMenu() {
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  if (!user) {
    return null;
  }

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const logout = async () => {
    await _post("/api/v1/auth/logout");
    window.location.href = "/";
  };

  return (
    <>
      <Button iconId="ri-account-circle-fill" priority="tertiary no outline" onClick={handleClick}>
        {getOrganisationLabel(user.organisation as IOrganisationCreate)}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              "& a": {
                backgroundImage: "none !important",
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                },
              },
            },
          },
        }}
      >
        <MenuItem onClick={logout}>
          <ListItemIcon>
            <i className={fr.cx("fr-icon-logout-box-r-line", "fr-icon--md")}></i>
          </ListItemIcon>
          Déconnexion
        </MenuItem>
      </Menu>
    </>
  );
}

export function DecommissionnementHeader() {
  return (
    <DsfrHeader
      brandTop={<>RÉPUBLIQUE FRANÇAISE</>}
      homeLinkProps={{
        href: "/decommissionnement",
        title: "Tableau de bord de l'apprentissage",
      }}
      id="fr-header-decommissionnement"
      serviceTitle={<>Tableau de bord de l&apos;apprentissage</>}
      quickAccessItems={[<LogoutMenu key="logout-menu" />]}
    />
  );
}
