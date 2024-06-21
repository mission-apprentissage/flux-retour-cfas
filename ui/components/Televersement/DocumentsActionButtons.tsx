import { Flex } from "@chakra-ui/react";

import InfoTeleversement from "@/modules/organismes/InfoTeleversement";
import { Book } from "@/theme/components/icons";
import DownloadSimple from "@/theme/components/icons/DownloadSimple";
import Eye from "@/theme/components/icons/Eye";
import Video from "@/theme/components/icons/Video";

import ButtonTeleversement from "../buttons/ButtonTeleversement";
import { BasicModal } from "../Modals/BasicModal";

export default function DocumentsActionButtons() {
  return (
    <Flex mt={4} gap={6} mb={5}>
      <ButtonTeleversement href="/modele-import.xlsx">
        <DownloadSimple mr={2} />
        Télécharger le modèle Excel
      </ButtonTeleversement>
      <BasicModal
        renderTrigger={(onOpen) => (
          <ButtonTeleversement
            onClick={(e) => {
              e.preventDefault();
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
      <ButtonTeleversement href="https://mission-apprentissage.notion.site/Guide-des-donn-es-57bc2515bac34cee9359e517a504df20">
        <Book mr={2} />
        Guide des données
      </ButtonTeleversement>
      <ButtonTeleversement href="https://www.canva.com/design/DAF0aDLacTk/ZxY16rI7C_vBzEuyrEpbIA/watch">
        <Video mr={2} />
        Tutoriel en vidéo
      </ButtonTeleversement>
    </Flex>
  );
}
