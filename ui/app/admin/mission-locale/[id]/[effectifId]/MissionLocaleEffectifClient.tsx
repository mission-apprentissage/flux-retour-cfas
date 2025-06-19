"use client";

import { Grid } from "@mui/material";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { API_EFFECTIF_LISTE, IEffecifMissionLocale, IUpdateMissionLocaleEffectif, SITUATION_ENUM } from "shared";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { RightColumnSkeleton } from "@/app/_components/mission-locale/effectifs/RightColumnSkeleton";
import { MissionLocaleEffectifDisplay } from "@/app/_components/mission-locale/MissionLocaleEffctifDisplay";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { _put } from "@/common/httpClient";

const MIN_LOADING_TIME = 500;
const SUCCESS_DISPLAY_TIME = 1000;

interface MissionLocaleEffectifClientProps {
  id: string;
  effectifId: string;
  data: IEffecifMissionLocale | null;
}

export default function MissionLocaleEffectifClient({
  id,
  effectifId: _effectifId,
  data,
}: MissionLocaleEffectifClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const nomListe = (searchParams?.get("nom_liste") as API_EFFECTIF_LISTE) || API_EFFECTIF_LISTE.A_TRAITER;
  const [saveStatus, setSaveStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  function handleResult(success: boolean) {
    if (!success) {
      setSaveStatus("error");
      return;
    }
    setSaveStatus("success");

    setTimeout(() => {
      router.push(`/admin/mission-locale/${id}`);
    }, SUCCESS_DISPLAY_TIME);
  }

  async function handleSave(formData: IUpdateMissionLocaleEffectif, effectifId: string) {
    setSaveStatus("loading");
    const startTime = Date.now();
    let success = false;

    try {
      await _put(`/api/v1/admin/mission-locale/effectif`, {
        mission_locale_id: id,
        effectif_id: effectifId,
        situation: formData.situation,
        situation_autre: formData.situation === SITUATION_ENUM.AUTRE ? formData.situation_autre : "",
        commentaires: formData.commentaires,
        deja_connu: formData.deja_connu,
      });
      success = true;
    } catch (error) {
      success = false;
    } finally {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = MIN_LOADING_TIME - elapsedTime;
      if (remainingTime > 0) {
        setTimeout(() => handleResult(success), remainingTime);
      } else {
        handleResult(success);
      }
    }
  }

  return (
    <Grid container>
      <Grid
        size={{ xs: 12, md: 3 }}
        sx={{
          px: { xs: 2, md: 3 },
          py: { xs: 2, md: 2 },
        }}
      >
        <DsfrLink href={`/admin/mission-locale/${id}`} arrow="left">
          Retour à la liste
        </DsfrLink>
      </Grid>

      <Grid
        size={{ xs: 12, md: 9 }}
        sx={{
          borderLeft: "1px solid",
          borderColor: "var(--border-default-grey)",
          pl: { xs: 2, md: 6 },
          pr: { xs: 2, md: 2 },
          py: { xs: 2, md: 2 },
        }}
      >
        <SuspenseWrapper fallback={<RightColumnSkeleton />}>
          {data && (
            <MissionLocaleEffectifDisplay
              effectifPayload={data}
              nomListe={nomListe}
              saveStatus={saveStatus}
              onSave={(_goNext, formData) => handleSave(formData, data.effectif.id.toString())}
              isAdmin
            />
          )}
        </SuspenseWrapper>
      </Grid>
    </Grid>
  );
}
