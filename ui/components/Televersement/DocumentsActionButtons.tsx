import { Flex } from "@chakra-ui/react";

import { MODEL_EXPORT_LAST_UPDATE } from "@/common/utils/exportUtils";
import { usePlausibleTracking } from "@/hooks/plausible";
import InfoTeleversement from "@/modules/organismes/InfoTeleversement";
import { Book } from "@/theme/components/icons";
import DownloadSimple from "@/theme/components/icons/DownloadSimple";
import Eye from "@/theme/components/icons/Eye";
import Video from "@/theme/components/icons/Video";

import ButtonTeleversement from "../buttons/ButtonTeleversement";
import { BasicModal } from "../Modals/BasicModal";

export default function DocumentsActionButtons() {
  const { trackPlausibleEvent } = usePlausibleTracking();

  return (
    <Flex mt={4} gap={6} mb={5}>
      <ButtonTeleversement
        href={`/modele-import-${MODEL_EXPORT_LAST_UPDATE}.xlsx`}
        onClick={() => trackPlausibleEvent("televersement_clic_telechargement_excel")}
      >
        <DownloadSimple mr={2} />
        Télécharger le modèle Excel
      </ButtonTeleversement>
      <BasicModal
        renderTrigger={(onOpen) => (
          <ButtonTeleversement
            onClick={(e) => {
              e.preventDefault();
              trackPlausibleEvent("televersement_clic_modale_donnees_obligatoires");
              onOpen();
            }}
          >
            <Eye mr={2} />
            Les données obligatoires
          </ButtonTeleversement>
        )}
        title="Les données obligatoires à renseigner"
        size="4xl"
      >
        <InfoTeleversement />
      </BasicModal>
      <ButtonTeleversement
        href="https://mission-apprentissage.notion.site/Guide-des-donn-es-57bc2515bac34cee9359e517a504df20"
        onClick={() => trackPlausibleEvent("televersement_clic_guide_donnees")}
      >
        <Book mr={2} />
        Guide des données
      </ButtonTeleversement>
      <ButtonTeleversement
        href="https://www.canva.com/design/DAGcu9l2gjM/tBojycBeRHW5ttGzvS0_BQ/watch?utm_content=D[%E2%80%A6]hare&utm_medium=link2&utm_source=uniquelinks&utlId=haf5a5d7f04"
        onClick={() => trackPlausibleEvent("televersement_clic_tutoriel_video")}
      >
        <Video mr={2} />
        Tutoriel en vidéo
      </ButtonTeleversement>
    </Flex>
  );
}
