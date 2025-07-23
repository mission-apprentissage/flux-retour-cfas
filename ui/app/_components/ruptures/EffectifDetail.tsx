"use client";

import Grid from "@mui/material/Grid2";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { API_EFFECTIF_LISTE, IEffecifMissionLocale, SITUATION_ENUM } from "shared";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { EffectifDetailDisplay } from "@/app/_components/ruptures/EffectifDetailDisplay";
import { RightColumnSkeleton } from "@/app/_components/ruptures/effectifs/RightColumnSkeleton";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { _get, _post } from "@/common/httpClient";

export default function EffectifDetail({ data }: { data: IEffecifMissionLocale | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const nomListe = (searchParams?.get("nom_liste") as API_EFFECTIF_LISTE) || API_EFFECTIF_LISTE.A_TRAITER;
  const [saveStatus, setSaveStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  function computeRedirectUrl(
    goNext: boolean,
    nextId: string | undefined,
    nomListe: API_EFFECTIF_LISTE,
    total: number | undefined
  ): string {
    const orgType = pathname && pathname.startsWith("/cfa") ? "cfa" : "mission-locale";

    if (goNext && nextId) {
      return `/${orgType}/${nextId}?nom_liste=${nomListe}`;
    }

    if (total === 1) {
      return nomListe === API_EFFECTIF_LISTE.PRIORITAIRE
        ? `/${orgType}/validation/prioritaire`
        : `/${orgType}/validation`;
    }

    return `/${orgType}`;
  }

  function handleResult(success: boolean, goNext: boolean, nextId?: string): void {
    if (!success) {
      setSaveStatus("error");
      return;
    }

    setSaveStatus("success");

    const targetUrl = computeRedirectUrl(goNext, nextId, nomListe, data?.total);

    setTimeout(() => router.push(targetUrl), 600);
  }

  async function handleSave(goNext: boolean, formData: any, effectifId: string, nextId?: string) {
    setSaveStatus("loading");
    const startTime = Date.now();
    let success = false;

    try {
      await _post(`/api/v1/organisation/mission-locale/effectif/${effectifId}`, {
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
      const remainingTime = 1500 - elapsedTime;
      if (remainingTime > 0) {
        setTimeout(() => handleResult(success, goNext, nextId), remainingTime);
      } else {
        handleResult(success, goNext, nextId);
      }
    }
  }

  const backUrl = pathname && pathname.startsWith("/cfa") ? "/cfa" : "/mission-locale";

  return (
    <Grid container>
      <Grid
        size={{ xs: 12, md: 3 }}
        sx={{
          px: { xs: 2, md: 3 },
          py: { xs: 2, md: 2 },
        }}
      >
        <DsfrLink href={backUrl} arrow="left">
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
            <EffectifDetailDisplay
              effectifPayload={data}
              nomListe={nomListe}
              saveStatus={saveStatus}
              onSave={(goNext, formData) => handleSave(goNext, formData, data.effectif.id.toString(), data.next?.id)}
            />
          )}
        </SuspenseWrapper>
      </Grid>
    </Grid>
  );
}
