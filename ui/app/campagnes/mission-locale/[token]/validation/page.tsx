"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Box, Stack, Typography } from "@mui/material";
import { useState } from "react";

import { DsfrLink } from "@/app/_components/link/DsfrLink";

function PhoneForm({
  label,
  phoneValue,
  setPhoneValue,
  onSave,
}: {
  label: string;
  phoneValue: string;
  setPhoneValue: (val: string) => void;
  onSave: () => void;
}) {
  return (
    <Stack spacing={2}>
      <Input
        label={label}
        nativeInputProps={{
          placeholder: "Ex : 06 12 34 56 78",
          value: phoneValue,
          onChange: (e) => setPhoneValue(e.target.value),
        }}
        style={{ marginBottom: fr.spacing("2w") }}
      />
      <Button onClick={onSave}>Enregistrer</Button>
    </Stack>
  );
}

export default function Page() {
  const [phone, setPhone] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [changePhoneOpen, setChangePhoneOpen] = useState(false);

  const handleSavePhone = () => {
    if (newPhone.trim()) {
      setPhone(newPhone.trim());
    }
    setNewPhone("");
    setChangePhoneOpen(false);
  };

  return (
    <Stack spacing={3}>
      <Box
        component="img"
        src="/images/support_solid.svg"
        alt="Accompagner les apprentis"
        sx={{
          maxWidth: "auto",
          height: "180px",
          userSelect: "none",
          marginBottom: "16px",
          marginLeft: "auto",
        }}
      />
      <Typography variant="h2" sx={{ color: "var(--text-title-blue-france)" }}>
        C’est noté !
      </Typography>

      <Stack p={{ sm: 2, md: 4 }} spacing={2} sx={{ background: "var(--background-alt-blue-france)" }}>
        {!phone ? (
          <Stack spacing={2}>
            <Typography fontWeight="bold">
              Malheureusement, votre organisme de formation ne nous a pas communiqué de numéro où vous joindre.
            </Typography>
            <PhoneForm
              label="Merci de renseigner votre nouveau numéro"
              phoneValue={newPhone}
              setPhoneValue={setNewPhone}
              onSave={handleSavePhone}
            />
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Typography fontWeight="bold">
              La Mission Locale de Marseille va vous contacter au numéro suivant :
            </Typography>
            <Badge noIcon severity="error">
              {phone}
            </Badge>
            <DsfrLink
              href="#"
              arrow="none"
              onClick={() => setChangePhoneOpen((open) => !open)}
              className={`fr-link--icon-right ${changePhoneOpen ? "ri-arrow-drop-up-line" : "ri-arrow-drop-down-line"}`}
            >
              Ce n’est pas mon numéro
            </DsfrLink>
            {changePhoneOpen && (
              <PhoneForm
                label="Merci de renseigner votre nouveau numéro"
                phoneValue={newPhone}
                setPhoneValue={setNewPhone}
                onSave={handleSavePhone}
              />
            )}
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
