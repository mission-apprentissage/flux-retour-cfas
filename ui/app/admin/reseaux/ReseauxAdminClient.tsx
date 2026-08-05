"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PAGES } from "@/app/_utils/routes.utils";
import { _get } from "@/common/httpClient";

import styles from "./reseaux.module.scss";

interface Reseau {
  _id: string;
  nom: string;
}

export default function ReseauxAdminClient() {
  const router = useRouter();
  const [selectedReseau, setSelectedReseau] = useState<string>("");

  const { data: reseauxData } = useQuery<Reseau[], any>(["reseau", "admin", "search"], ({ signal }) =>
    _get("/api/v1/admin/reseaux", { signal })
  );

  const handleNavigation = () => {
    if (!selectedReseau) return;
    router.push(PAGES.dynamic.adminReseau({ id: selectedReseau }).getPath());
  };

  return (
    <>
      <h1 className={styles.title}>Gestion des réseaux</h1>

      <div className={styles.form}>
        <Select
          label="Sélectionnez le réseau à mettre à jour :"
          placeholder="Sélectionner un réseau"
          options={(reseauxData ?? []).map((reseau) => ({ value: reseau._id, label: reseau.nom }))}
          nativeSelectProps={{
            value: selectedReseau,
            onChange: (event) => setSelectedReseau(event.target.value),
          }}
        />
        <Button onClick={handleNavigation} disabled={!selectedReseau} className={fr.cx("fr-mt-2w")}>
          Modifier ce réseau
        </Button>
      </div>
    </>
  );
}
