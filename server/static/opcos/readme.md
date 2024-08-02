# Liste des fichiers OPCOs

- `2i.csv` : provient du fichier rncp_opco_2i.xlsx transmis par l'OPCO avec la première colonne extraite à la main
- `ep.csv` : provient du fichier RNCP_TDBAP_Vdef.xlsx transmis par l'OPCO avec la première colonne extraite à la main
- `akto.csv` : provient du fichier Liste_RNCP_OPCO_Akto.xlsx - HCR.xlsx transmis par l'OPCO avec la première colonne extraite à la main
- `atlas.csv` : provient du fichier Liste_RNCP_OPCO_Atlas.xlsx - Feuil2.xlsx transmis par l'OPCO avec la première colonne extraite à la main
- `ocapiat.csv` : provient du fichier 20240731-RNCP-Ocapiat.xlsx - Feuil2.xlsx transmis par l’opco ocapiat
- `uniformation.csv` : provient du fichier rncp_opco_uniformation.csv transmis par l’opco uniformation

Les fichiers ont été transformés avec la commande `cat server/static/opcos/<fichier_a_transformer>.csv | sort | uniq` pour éliminer les doublons
