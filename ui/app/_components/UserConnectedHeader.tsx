"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { ListItemIcon } from "@mui/material";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useState } from "react";

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

  return (
    <>
      {user && (
        <>
          <Button iconId="ri-account-circle-fill" priority="tertiary no outline" onClick={handleClick}>
            {getAccountLabel(user as AuthContext)}
          </Button>
          <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
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
