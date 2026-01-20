"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { ListItemIcon, ListSubheader } from "@mui/material";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useState } from "react";
import { ORGANISATION_TYPE } from "shared";

import { _post } from "@/common/httpClient";
import { AuthContext } from "@/common/internal/AuthContext";
import { getAccountLabel } from "@/common/utils/accountUtils";

import { useAuth } from "../_context/UserContext";

export const UserConnectedHeader = () => {
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const logout = async () => {
    await _post("/api/v1/auth/logout");
    window.location.href = "/";
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const hasRight = (entry: string) => {
    const organisationType = user?.organisation?.type;
    switch (entry) {
      case "ROLES":
        return organisationType !== ORGANISATION_TYPE.MISSION_LOCALE;
      case "TRANSMISSIONS":
        return organisationType === ORGANISATION_TYPE.ORGANISME_FORMATION;
      case "ADMIN":
        return organisationType === ORGANISATION_TYPE.ADMINISTRATEUR;
      default:
        return false;
    }
  };

  return (
    <>
      {user && (
        <>
          <Button iconId="ri-account-circle-fill" priority="tertiary no outline" onClick={handleClick}>
            {getAccountLabel(user as AuthContext)}
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
            <MenuItem component="a" href="/mon-compte" onClick={handleClose}>
              <ListItemIcon>
                <i className={fr.cx("fr-icon-settings-5-line", "fr-icon--md")}></i>
              </ListItemIcon>
              Informations
            </MenuItem>

            {hasRight("ROLES") && (
              <MenuItem component="a" href="/organisation/membres" onClick={handleClose}>
                <ListItemIcon>
                  <i className={fr.cx("fr-icon-settings-5-line", "fr-icon--md")}></i>
                </ListItemIcon>
                Rôles et habilitations
              </MenuItem>
            )}

            {hasRight("TRANSMISSIONS") && (
              <MenuItem component="a" href="/transmissions" onClick={handleClose}>
                <ListItemIcon>
                  <i className={fr.cx("fr-icon-settings-5-line", "fr-icon--md")}></i>
                </ListItemIcon>
                Transmissions
              </MenuItem>
            )}

            {hasRight("ADMIN") && [
              <ListSubheader key="admin-header" component="div" sx={{ fontWeight: "bold", color: "text.primary" }}>
                Administration
              </ListSubheader>,
              <MenuItem key="admin-transmissions" component="a" href="/admin/transmissions" onClick={handleClose}>
                <ListItemIcon>
                  <i className={fr.cx("fr-icon-settings-5-line", "fr-icon--md")}></i>
                </ListItemIcon>
                Toutes les transmissions
              </MenuItem>,
              <MenuItem key="admin-users" component="a" href="/admin/users" onClick={handleClose}>
                <ListItemIcon>
                  <i className={fr.cx("fr-icon-settings-5-line", "fr-icon--md")}></i>
                </ListItemIcon>
                Gestion des utilisateurs
              </MenuItem>,
              <MenuItem key="admin-reseaux" component="a" href="/admin/reseaux" onClick={handleClose}>
                <ListItemIcon>
                  <i className={fr.cx("fr-icon-settings-5-line", "fr-icon--md")}></i>
                </ListItemIcon>
                Gestion des réseaux
              </MenuItem>,
              <MenuItem
                key="admin-organismes-recherche"
                component="a"
                href="/admin/organismes/recherche"
                onClick={handleClose}
              >
                <ListItemIcon>
                  <i className={fr.cx("fr-icon-settings-5-line", "fr-icon--md")}></i>
                </ListItemIcon>
                Recherche organisme
              </MenuItem>,
              <MenuItem
                key="admin-fusion-organismes"
                component="a"
                href="/admin/fusion-organismes"
                onClick={handleClose}
              >
                <ListItemIcon>
                  <i className={fr.cx("fr-icon-settings-5-line", "fr-icon--md")}></i>
                </ListItemIcon>
                Fusion d&apos;organismes
              </MenuItem>,
              <MenuItem
                key="admin-organismes-gestion"
                component="a"
                href="/admin/organismes/gestion"
                onClick={handleClose}
              >
                <ListItemIcon>
                  <i className={fr.cx("fr-icon-settings-5-line", "fr-icon--md")}></i>
                </ListItemIcon>
                Gestion des organismes
              </MenuItem>,
              <MenuItem key="admin-maintenance" component="a" href="/admin/maintenance" onClick={handleClose}>
                <ListItemIcon>
                  <i className={fr.cx("fr-icon-settings-5-line", "fr-icon--md")}></i>
                </ListItemIcon>
                Message de maintenance
              </MenuItem>,
              <MenuItem key="admin-impostures" component="a" href="/admin/impostures" onClick={handleClose}>
                <ListItemIcon>
                  <i className={fr.cx("fr-icon-eye-line", "fr-icon--md")}></i>
                </ListItemIcon>
                Impostures
              </MenuItem>,
            ]}

            <MenuItem onClick={logout}>
              <ListItemIcon>
                <i className={fr.cx("fr-icon-logout-box-r-line", "fr-icon--md")}></i>
              </ListItemIcon>
              Déconnexion
            </MenuItem>
          </Menu>
        </>
      )}
    </>
  );
};
