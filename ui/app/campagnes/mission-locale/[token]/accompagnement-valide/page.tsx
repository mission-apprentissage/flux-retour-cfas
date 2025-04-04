"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Box, Stack, Typography } from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { _get, _post } from "@/common/httpClient";

import { MissionLocaleFaq } from "../../_components/faq";
import { MissionLocaleQuestion } from "../../_components/question";

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
  const { token } = useParams() as { token: string };
  const [phone, setPhone] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [changePhoneOpen, setChangePhoneOpen] = useState(false);

  const { data, isLoading, isError } = useQuery(
    ["ml-effectif", token],
    () => _get(`/api/v1/campagne/mission-locale/${token}`),
    {
      enabled: !!token,
      keepPreviousData: true,
      useErrorBoundary: true,
    }
  );

  const updatePhoneMutation = useMutation((telephone: string) =>
    _post(`/api/v1/campagne/mission-locale/${token}/telephone`, { telephone })
  );

  const handleSavePhone = () => {
    if (!newPhone.trim()) return;
    updatePhoneMutation.mutate(newPhone.trim(), {
      onSuccess: () => {
        setPhone(newPhone.trim());
        setNewPhone("");
        setChangePhoneOpen(false);
      },
    });
  };

  if (isLoading) {
    return <></>;
  }

  if (isError) {
    return <Typography color="error">Une erreur est survenue.</Typography>;
  }

  return (
    <Stack spacing={3}>
      <Stack justifyContent="end" alignItems="center">
        <Box
          component="img"
          src="/images/support_solid.svg"
          alt="Accompagner les apprentis"
          sx={{
            height: "180px",
            userSelect: "none",
            marginBottom: "16px",
            marginLeft: "auto",
          }}
        />
      </Stack>
      <Typography variant="h2" sx={{ color: "var(--text-title-blue-france)" }}>
        C’est noté !
      </Typography>
      <Stack p={{ xs: 2, md: 4 }} spacing={2} sx={{ background: "var(--background-alt-blue-france)" }}>
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
      <MissionLocaleQuestion />
      <MissionLocaleFaq missionLocalNom={data?.missionLocale?.nom} />
    </Stack>
  );
}
