"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { ListItemIcon, ListSubheader } from "@mui/material";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useState } from "react";
import { CRISP_FAQ, ORGANISATION_TYPE } from "shared";

import { _post } from "@/common/httpClient";
import { AuthContext } from "@/common/internal/AuthContext";
import { getAccountLabel } from "@/common/utils/accountUtils";
import { isCfaWithMlBeta as checkCfaWithMlBeta } from "@/common/utils/cfaUtils";

import { useAuth } from "../_context/UserContext";

export const UserConnectedHeader = () => {
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const isCfaWithMlBeta = checkCfaWithMlBeta(user?.organisation);

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
        return organisationType !== ORGANISATION_TYPE.MISSION_LOCALE && !isCfaWithMlBeta;
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
            {isCfaWithMlBeta && user.prenom && user.nom ? (
              <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.3 }}>
                <span
                  style={{ fontWeight: 700 }}
                >{`${user.prenom.charAt(0).toUpperCase()}${user.prenom.slice(1)} ${user.nom.charAt(0).toUpperCase()}.`}</span>
                {user.organisation_nom && (
                  <span style={{ fontSize: "0.75rem", fontWeight: 400 }}>{user.organisation_nom}</span>
                )}
              </span>
            ) : (
              getAccountLabel(user as AuthContext)
            )}
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            slotProps={{
              paper: {
                sx: {
                  "& a, & .MuiMenuItem-root": {
                    backgroundImage: "none !important",
                    color: "var(--text-action-high-blue-france)",
                    "&:hover": {
                      backgroundColor: "rgba(0, 0, 0, 0.04)",
                    },
                  },
                  "& .MuiListItemIcon-root": {
                    color: "var(--text-action-high-blue-france)",
                    minWidth: 28,
                  },
                },
              },
            }}
          >
            <MenuItem component="a" href="/mon-compte" onClick={handleClose}>
              <ListItemIcon>
                <i className={fr.cx("ri-account-circle-fill", "fr-icon--sm")}></i>
              </ListItemIcon>
              Mon compte
            </MenuItem>

            {hasRight("ROLES") && (
              <MenuItem component="a" href="/organisation/membres" onClick={handleClose}>
                <ListItemIcon>
                  <i className={fr.cx("fr-icon-team-fill", "fr-icon--sm")}></i>
                </ListItemIcon>
                Rôles et habilitations
              </MenuItem>
            )}

            {hasRight("TRANSMISSIONS") && (
              <MenuItem component="a" href="/transmissions" onClick={handleClose}>
                <ListItemIcon>
                  <i className={fr.cx("fr-icon-send-plane-fill", "fr-icon--sm")}></i>
                </ListItemIcon>
                Transmissions
              </MenuItem>
            )}

            {isCfaWithMlBeta && (user?.organisation_role === "admin" || user?.impersonating === true) && (
              <MenuItem component="a" href="/cfa/roles-habilitations" onClick={handleClose}>
                <ListItemIcon>
                  <i className={fr.cx("fr-icon-team-fill", "fr-icon--sm")}></i>
                </ListItemIcon>
                Rôles et habilitations
              </MenuItem>
            )}

            {isCfaWithMlBeta && [
              <MenuItem key="cfa-parametres" component="a" href="/cfa/parametres" onClick={handleClose}>
                <ListItemIcon>
                  <i className={fr.cx("fr-icon-settings-5-fill", "fr-icon--sm")}></i>
                </ListItemIcon>
                Paramètres de connexion ERP
              </MenuItem>,
              <ListSubheader
                key="cfa-aide-header"
                component="div"
                sx={{ fontWeight: "bold", color: "var(--text-action-high-blue-france)" }}
              >
                Aide et ressources
              </ListSubheader>,
              <MenuItem key="cfa-aide-centre" component="a" href={CRISP_FAQ} target="_blank" onClick={handleClose}>
                <ListItemIcon>
                  <i className={fr.cx("fr-icon-question-fill", "fr-icon--sm")}></i>
                </ListItemIcon>
                Centre d&apos;aide
              </MenuItem>,
              <MenuItem key="cfa-aide-glossaire" component="a" href="/glossaire" onClick={handleClose}>
                <ListItemIcon>
                  <i className={fr.cx("fr-icon-book-2-fill", "fr-icon--sm")}></i>
                </ListItemIcon>
                Glossaire
              </MenuItem>,
              <MenuItem
                key="cfa-aide-referencement"
                component="a"
                href="/referencement-organisme"
                onClick={handleClose}
              >
                <ListItemIcon>
                  <i className={fr.cx("fr-icon-building-fill", "fr-icon--sm")}></i>
                </ListItemIcon>
                Référencement organisme
              </MenuItem>,
            ]}

            {hasRight("ADMIN") && [
              <ListSubheader key="admin-header" component="div" sx={{ fontWeight: "bold", color: "text.primary" }}>
                Administration
              </ListSubheader>,
              <MenuItem key="admin-transmissions" component="a" href="/admin/transmissions" onClick={handleClose}>
                <ListItemIcon>
                  <i className={fr.cx("fr-icon-settings-5-fill", "fr-icon--sm")}></i>
                </ListItemIcon>
                Toutes les transmissions
              </MenuItem>,
              <MenuItem key="admin-users" component="a" href="/admin/users" onClick={handleClose}>
                <ListItemIcon>
                  <i className={fr.cx("fr-icon-settings-5-fill", "fr-icon--sm")}></i>
                </ListItemIcon>
                Gestion des utilisateurs
              </MenuItem>,
              <MenuItem key="admin-reseaux" component="a" href="/admin/reseaux" onClick={handleClose}>
                <ListItemIcon>
                  <i className={fr.cx("fr-icon-settings-5-fill", "fr-icon--sm")}></i>
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
                  <i className={fr.cx("fr-icon-settings-5-fill", "fr-icon--sm")}></i>
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
                  <i className={fr.cx("fr-icon-settings-5-fill", "fr-icon--sm")}></i>
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
                  <i className={fr.cx("fr-icon-settings-5-fill", "fr-icon--sm")}></i>
                </ListItemIcon>
                Gestion des organismes
              </MenuItem>,
              <MenuItem key="admin-maintenance" component="a" href="/admin/maintenance" onClick={handleClose}>
                <ListItemIcon>
                  <i className={fr.cx("fr-icon-settings-5-fill", "fr-icon--sm")}></i>
                </ListItemIcon>
                Message de maintenance
              </MenuItem>,
              <MenuItem key="admin-impostures" component="a" href="/admin/impostures" onClick={handleClose}>
                <ListItemIcon>
                  <i className={fr.cx("fr-icon-eye-fill", "fr-icon--sm")}></i>
                </ListItemIcon>
                Impostures
              </MenuItem>,
            ]}

            <MenuItem onClick={logout} sx={{ borderTop: "1px solid var(--border-default-grey)", mt: 1, pt: 1 }}>
              <ListItemIcon>
                <i
                  className={fr.cx("fr-icon-logout-box-r-fill", "fr-icon--sm")}
                  style={{ color: "var(--text-default-error)" }}
                ></i>
              </ListItemIcon>
              <span style={{ color: "var(--text-default-error)" }}>Déconnexion</span>
            </MenuItem>
          </Menu>
        </>
      )}
    </>
  );
};
