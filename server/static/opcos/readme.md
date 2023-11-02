# Liste des fichiers OPCOs

- `2i.csv` : provient du fichier rncp_opco_2i.xlsx transmis par l'OPCO avec la première colonne extraite à la main
- `ep.csv` : provient du fichier RNCP_TDBAP_Vdef.xlsx transmis par l'OPCO avec la première colonne extraite à la main

Les fichiers ont été transformés avec la commande `cat server/static/opcos/ep.csv | sort | uniq` pour éliminer les doublons
