"use client";

import Grid from "@mui/material/Grid2";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { API_EFFECTIF_LISTE, IEffecifMissionLocale, IUpdateMissionLocaleEffectif, SITUATION_ENUM } from "shared";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { RightColumnSkeleton } from "@/app/_components/mission-locale/effectifs/RightColumnSkeleton";
import { MissionLocaleEffectifDisplay } from "@/app/_components/mission-locale/MissionLocaleEffctifDisplay";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { _get, _post, _put } from "@/common/httpClient";

const MIN_LOADING_TIME = 1500;
const SUCCESS_DISPLAY_TIME = 600;

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const mlId = params?.id as string | undefined;
  const effectifId = params?.effectifId as string | undefined;
  const nomListe = (searchParams?.get("nom_liste") as API_EFFECTIF_LISTE) || API_EFFECTIF_LISTE.A_TRAITER;

  const [saveStatus, setSaveStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const { data } = useQuery(
    ["effectif", mlId, nomListe],
    async () => {
      if (!mlId || !effectifId) return null;
      return await _get<IEffecifMissionLocale>(`/api/v1/admin/mission-locale/${mlId}/effectif/${effectifId}`, {
        params: {
          nom_liste: nomListe || API_EFFECTIF_LISTE.A_TRAITER,
        },
      });
    },
    {
      enabled: !!mlId,
      suspense: false,
      useErrorBoundary: true,
    }
  );

  function handleResult(success: boolean) {
    if (!success) {
      setSaveStatus("error");
      return;
    }
    setSaveStatus("success");

    setTimeout(() => {
      router.push(`/admin/mission-locale/${mlId}`);
    }, SUCCESS_DISPLAY_TIME);
  }

  async function handleSave(formData: IUpdateMissionLocaleEffectif, effectifId: string) {
    setSaveStatus("loading");
    const startTime = Date.now();
    let success = false;

    try {
      await _put(`/api/v1/admin/mission-locale/effectif`, {
        mission_locale_id: mlId,
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
        <DsfrLink href={`/admin/mission-locale/${mlId}`} arrow="left">
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
