"use client";

import { Grid2 } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useState } from "react";
import {
  API_EFFECTIF_LISTE,
  IEffecifMissionLocale,
  IUpdateMissionLocaleEffectif,
  IUpdateOrganismeFormationEffectif,
  SITUATION_ENUM,
} from "shared";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { EffectifDetailDisplay } from "@/app/_components/ruptures/EffectifDetailDisplay";
import { RightColumnSkeleton } from "@/app/_components/ruptures/effectifs/RightColumnSkeleton";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { _get, _put } from "@/common/httpClient";

const MIN_LOADING_TIME = 500;
const SUCCESS_DISPLAY_TIME = 1500;

export default function MissionLocaleEffectifClient() {
  const params = useParams();
  const { id, effectifId } = params as { id: string; effectifId: string };
  const searchParams = useSearchParams();
  const router = useRouter();
  const nomListe = (searchParams?.get("nom_liste") as API_EFFECTIF_LISTE) || API_EFFECTIF_LISTE.A_TRAITER;
  const [saveStatus, setSaveStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const { data } = useQuery(
    ["effectif", id, nomListe],
    async () => {
      if (!id) return null;
      return await _get<IEffecifMissionLocale>(`/api/v1/admin/mission-locale/${id}/effectif/${effectifId}`, {
        params: {
          nom_liste: nomListe,
        },
      });
    },
    {
      enabled: !!id,
      suspense: true,
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
      router.push(`/admin/mission-locale/${id}/edit`);
    }, SUCCESS_DISPLAY_TIME);
  }

  async function handleSave(
    formData: IUpdateMissionLocaleEffectif | IUpdateOrganismeFormationEffectif,
    effectifId: string
  ) {
    setSaveStatus("loading");
    const startTime = Date.now();
    let success = false;

    try {
      if ("situation" in formData) {
        const missionLocaleData = formData as IUpdateMissionLocaleEffectif;
        await _put(`/api/v1/admin/mission-locale/effectif`, {
          mission_locale_id: id,
          effectif_id: effectifId,
          situation: missionLocaleData.situation,
          situation_autre:
            missionLocaleData.situation === SITUATION_ENUM.AUTRE ? missionLocaleData.situation_autre : "",
          commentaires: missionLocaleData.commentaires || "",
          deja_connu: missionLocaleData.deja_connu,
        });
      }
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
    <Grid2 container>
      <Grid2
        size={{ xs: 12, md: 3 }}
        sx={{
          px: { xs: 2, md: 3 },
          py: { xs: 2, md: 2 },
        }}
      >
        <DsfrLink href={`/admin/mission-locale/${id}`} arrow="left">
          Retour à la liste
        </DsfrLink>
      </Grid2>

      <Grid2
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
            <EffectifDetailDisplay
              effectifPayload={data}
              nomListe={nomListe}
              saveStatus={saveStatus}
              onSave={(_goNext, formData) => handleSave(formData, data.effectif.id.toString())}
              isAdmin
            />
          )}
        </SuspenseWrapper>
      </Grid2>
    </Grid2>
  );
}
