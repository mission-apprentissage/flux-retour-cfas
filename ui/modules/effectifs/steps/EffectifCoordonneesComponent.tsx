import {
  Box,
  Input,
  Text,
  RadioGroup,
  Radio,
  VStack,
  Select,
  HStack,
  FormControl,
  FormLabel,
  InputGroup,
  InputLeftAddon,
  FormErrorMessage,
  Button,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { DERNIER_DIPLOME_OBTENU, PAYS, SITUATION_AVANT_CONTRAT } from "shared";
import {
  IEffectifCreationCoordonnesSchema,
  IEffectifCreationSchema,
  effectifCreationCoordonnesSchema,
} from "shared/models/apis/effectifsCreationSchema";

import { INDICE_DE_REPETITION_OPTIONS } from "@/modules/mon-espace/effectifs/engine/effectifForm/domain/indiceDeRepetionOptions";

interface EffectfCoordonneesComponent {
  data: IEffectifCreationSchema;
  onValidate: any;
  previous: any;
  next: any;
}

const EffectfCoordonneesComponent = ({ data, next, onValidate }: EffectfCoordonneesComponent) => {
  const [representantForm, setRepresentantForm] = useState(false);

  const { apprenant } = data;
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    mode: "onBlur",
    defaultValues: { apprenant },
    resolver: zodResolver(effectifCreationCoordonnesSchema),
  });
  const style = {
    border: "2px solid #F9F8F6",
    padding: "32px",
  };

  const rowStyle = {
    align: "stretch",
    width: "100%",
    marginBottom: "24px",
    alignItems: "flex-start",
  };

  const subTitleStyle = {
    fontSize: "20px",
    fontWeight: "700",
  };

  const inputStyle = {
    paddingRight: "20px",
  };

  const onSubmit = async (data: IEffectifCreationCoordonnesSchema) => {
    await onValidate(data);
    next.action();
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box style={style}>
        <VStack>
          <HStack style={rowStyle}>
            <FormControl style={inputStyle} isInvalid={!!errors.apprenant?.prenom?.message}>
              <FormLabel>Prénom de l&apos;apprenti(e)</FormLabel>
              <Input
                variant="effectifForm"
                placeholder="Exemple: Nathan"
                type="text"
                {...register("apprenant.prenom")}
              />
              <FormErrorMessage>
                {errors.apprenant?.prenom?.message && errors.apprenant?.prenom?.message}
              </FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.apprenant?.nom?.message}>
              <FormLabel>Nom de naissance de l&apos;apprenti(e)</FormLabel>
              <Input variant="effectifForm" placeholder="Exemple: Dupond" {...register("apprenant.nom")} />
              <FormErrorMessage>{errors.apprenant?.nom?.message}</FormErrorMessage>
            </FormControl>
          </HStack>
          <HStack style={rowStyle}>
            <FormControl isInvalid={!!errors.apprenant?.date_de_naissance?.message} style={inputStyle}>
              <FormLabel>Date de naissance</FormLabel>
              <Input variant="effectifForm" type="date" {...register("apprenant.date_de_naissance")} />
            </FormControl>
            <FormControl isInvalid={!!errors.apprenant?.sexe?.message}>
              <FormLabel>Sexe</FormLabel>
              <RadioGroup defaultValue={apprenant?.sexe ?? undefined}>
                <HStack spacing="24px">
                  <Radio value="F" {...register("apprenant.sexe")}>
                    Femme
                  </Radio>
                  <Radio value="M" {...register("apprenant.sexe")}>
                    Homme
                  </Radio>
                </HStack>
              </RadioGroup>
            </FormControl>
          </HStack>
          <HStack style={rowStyle}>
            <FormControl>
              <FormLabel>L’apprenti(e) est né(e) en France (Metropolitaine, DOM-TOM…) :</FormLabel>
              <RadioGroup>
                <HStack spacing="24px">
                  <Radio value="true">Oui</Radio>
                  <Radio value="false">Non</Radio>
                </HStack>
              </RadioGroup>
            </FormControl>
            <FormControl>
              <FormLabel>Nationalité</FormLabel>
              <Select
                placeholder="Sélectionnez"
                {...register("apprenant.nationalite", { setValueAs: (v) => parseInt(v) })}
              >
                <option value="1">Française</option>
                <option value="2">Union Européenne</option>
                <option value="3">Etranger hors Union Européenne</option>
              </Select>{" "}
            </FormControl>
          </HStack>
          <HStack style={rowStyle}>
            <FormControl style={inputStyle}>
              <FormLabel>Commune de naissance</FormLabel>
              <Input
                variant="effectifForm"
                placeholder="Exemple: Bourg-en-Bresse"
                name="Commune de naissance"
                type="text"
              />
            </FormControl>
            <FormControl isInvalid={!!errors.apprenant?.code_postal_de_naissance?.message}>
              <FormLabel>Code postal de naissance</FormLabel>
              <Input variant="effectifForm" type="text" {...register("apprenant.code_postal_de_naissance")} />
              <FormErrorMessage>{errors.apprenant?.code_postal_de_naissance?.message}</FormErrorMessage>
            </FormControl>
          </HStack>
          <HStack style={rowStyle}>
            <FormControl isInvalid={!!errors.apprenant?.ine?.message} style={inputStyle}>
              <FormLabel>INE (Identifiant National Etudiant unique)</FormLabel>
              <Input
                variant="effectifForm"
                placeholder="Exemple: Bourg-en-Bresse"
                type="text"
                {...register("apprenant.ine")}
              />
              <FormErrorMessage>{errors.apprenant?.ine?.message}</FormErrorMessage>
            </FormControl>
          </HStack>
          <HStack style={rowStyle}>
            <Text style={subTitleStyle}>Adresse et contact de l&apos;apprenti(e)</Text>
          </HStack>
          <HStack style={rowStyle}>
            <FormControl flex={1} isInvalid={!!errors.apprenant?.adresse?.numero?.message} style={inputStyle}>
              <FormLabel>N°</FormLabel>
              <Input
                variant="effectifForm"
                placeholder="Exemple: 12"
                type="number"
                {...register("apprenant.adresse.numero")}
              />
              <FormErrorMessage>{errors.apprenant?.adresse?.numero?.message}</FormErrorMessage>
            </FormControl>
            <FormControl flex={1} style={inputStyle}>
              <FormLabel>Indice de répétition</FormLabel>
              <Select
                placeholder="Sélectionnez"
                {...register("apprenant.adresse.repetition_voie", { setValueAs: (v) => (v !== "" ? v : undefined) })}
              >
                {INDICE_DE_REPETITION_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl flex={3} isInvalid={!!errors.apprenant?.adresse?.voie?.message}>
              <FormLabel>Voie</FormLabel>
              <Input
                variant="effectifForm"
                placeholder="Exemple: Boulevard de la liberté"
                type="text"
                {...register("apprenant.adresse.voie")}
              />
              <FormErrorMessage>{errors.apprenant?.adresse?.voie?.message}</FormErrorMessage>
            </FormControl>
          </HStack>
          <HStack style={rowStyle}>
            <FormControl isInvalid={!!errors.apprenant?.adresse?.complement?.message}>
              <FormLabel>Complément d&apos;adresse (optionnel)</FormLabel>
              <Input
                variant="effectifForm"
                placeholder="Exemple : Hôtel de ville, Entrée, Bâtiment ; Étage ; Service ; "
                type="text"
                {...register("apprenant.adresse.complement")}
              />
              <FormErrorMessage>{errors.apprenant?.adresse?.complement?.message}</FormErrorMessage>
            </FormControl>
          </HStack>
          <HStack style={rowStyle}>
            <FormControl flex={1} isInvalid={!!errors.apprenant?.adresse?.code_postal?.message} style={inputStyle}>
              <FormLabel>Code postal</FormLabel>
              <Input
                variant="effectifForm"
                placeholder="Exemple: 44000"
                type="string"
                {...register("apprenant.adresse.code_postal")}
              />
              <FormErrorMessage>{errors.apprenant?.adresse?.code_postal?.message}</FormErrorMessage>
            </FormControl>

            <FormControl flex={1} isInvalid={!!errors.apprenant?.adresse?.commune?.message} style={inputStyle}>
              <FormLabel>Commune</FormLabel>
              <Input
                variant="effectifForm"
                placeholder="Exemple: Nantes"
                type="text"
                {...register("apprenant.adresse.commune")}
              />
              <FormErrorMessage>{errors.apprenant?.adresse?.commune?.message}</FormErrorMessage>
            </FormControl>
            <FormControl flex={1}>
              <FormLabel>Pays</FormLabel>
              <Select placeholder="Sélectionnez" {...register("apprenant.adresse.pays")}>
                {PAYS.map(({ code, label }) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </Select>
            </FormControl>
          </HStack>
          <HStack style={rowStyle}>
            <FormControl flex={1} isInvalid={!!errors.apprenant?.telephone?.message} style={inputStyle}>
              <FormLabel>Téléphone de l&apos;apprenti(e)</FormLabel>
              <InputGroup>
                <InputLeftAddon backgroundColor="#e6e6e6">+33</InputLeftAddon>
                <Input
                  variant="effectifForm"
                  placeholder="Exemple: (0)6 00 00 00 00"
                  type="tel"
                  {...register("apprenant.telephone")}
                />
              </InputGroup>
              <FormErrorMessage>{errors.apprenant?.telephone?.message}</FormErrorMessage>
            </FormControl>

            <FormControl flex={1} isInvalid={!!errors.apprenant?.courriel?.message}>
              <FormLabel>Courriel de l&apos;apprenti(e)</FormLabel>
              <Input
                variant="effectifForm"
                placeholder="Exemple: genial@mail.com"
                type="email"
                {...register("apprenant.courriel")}
              />
              <FormErrorMessage>{errors.apprenant?.courriel?.message}</FormErrorMessage>
            </FormControl>
          </HStack>
          <HStack style={rowStyle}>
            <Text style={subTitleStyle}>Informations supplémentaires sur l&apos;apprenti(e)</Text>
          </HStack>
          <HStack style={rowStyle}>
            <FormControl>
              <FormLabel>
                Déclare être inscrit sur la liste des sportifs, entraîneurs, arbitres et juges sportifs de haut niveau :{" "}
              </FormLabel>
              <RadioGroup
                defaultValue={apprenant?.inscription_sportif_haut_niveau ? "true" : "false"}
                onChange={(e) => setValue("apprenant.inscription_sportif_haut_niveau", e === "true")}
              >
                <HStack spacing="24px">
                  <Radio value="true">Oui</Radio>
                  <Radio value="false">Non</Radio>
                </HStack>
              </RadioGroup>
            </FormControl>
          </HStack>
          <HStack style={rowStyle}>
            <FormControl flex={4}>
              <FormLabel>Déclare bénéficier de la reconnaissance de la qualité de travailleur handicapé : </FormLabel>
              <RadioGroup
                defaultValue={apprenant?.rqth ? "true" : "false"}
                onChange={(e) => setValue("apprenant.rqth", e === "true")}
              >
                <HStack spacing="24px">
                  <Radio value="true">Oui</Radio>
                  <Radio value="false">Non</Radio>
                </HStack>
              </RadioGroup>
            </FormControl>
            <FormControl flex={3} isInvalid={!!errors.apprenant?.date_rqth?.message}>
              <FormLabel>Date de reconnaissance travailleur handicapé RQTH</FormLabel>
              <Input variant="effectifForm" type="date" {...register("apprenant.date_rqth")} />
              <FormErrorMessage>{errors.apprenant?.date_rqth?.message}</FormErrorMessage>
            </FormControl>
          </HStack>
          <HStack style={rowStyle}>
            <FormControl flex={1} style={inputStyle}>
              <FormLabel>Situation avant ce contrat</FormLabel>
              <Select
                placeholder="Sélectionnez"
                {...register("apprenant.situation_avant_contrat", { setValueAs: (v) => parseInt(v) })}
              >
                {SITUATION_AVANT_CONTRAT.map(({ label, value }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl flex={1}>
              <FormLabel>Dernier diplôme ou titre préparé</FormLabel>
              <Select
                placeholder="Sélectionnez"
                {...register("apprenant.dernier_diplome", { setValueAs: (v) => parseInt(v) })}
              >
                {DERNIER_DIPLOME_OBTENU.map(({ label, value }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </FormControl>
          </HStack>
          <HStack style={rowStyle}>
            <FormControl flex={1} style={inputStyle}>
              <FormLabel>Intitulé précis du dernier diplôme ou titre préparé </FormLabel>
              <Input variant="effectifForm" placeholder="Exemple: BTS comptabilité gestion" type="text" />
            </FormControl>
            <FormControl flex={1}>
              <FormLabel>Diplôme ou titre le plus élevé obtenu </FormLabel>
              <Select placeholder="Sélectionnez">
                <option value="option1">Option 1</option>
                <option value="option2">Option 2</option>
                <option value="option3">Option 3</option>
              </Select>
            </FormControl>
          </HStack>
          <HStack style={rowStyle}>
            <FormControl>
              <FormLabel>
                L&apos;apprenti est sous la responsabilité d&apos;un représentant légal (non émancipé){" "}
              </FormLabel>
              <RadioGroup
                onChange={(v) => setRepresentantForm(v === "false")}
                value={representantForm ? "false" : "true"}
              >
                <HStack spacing="24px">
                  <Radio value="true">Oui</Radio>
                  <Radio value="false">Non</Radio>
                </HStack>
              </RadioGroup>
            </FormControl>
          </HStack>
          <HStack style={rowStyle}>
            <FormControl
              isDisabled={representantForm}
              isInvalid={!!errors.apprenant?.representant_legal?.nom?.message}
              style={inputStyle}
            >
              <FormLabel>Nom représentant </FormLabel>
              <Input
                variant="effectifForm"
                placeholder="Exemple: Dupond"
                type="text"
                {...register("apprenant.representant_legal.nom")}
              />
              <FormErrorMessage>{errors.apprenant?.representant_legal?.nom?.message}</FormErrorMessage>
            </FormControl>
            <FormControl
              isDisabled={representantForm}
              isInvalid={!!errors.apprenant?.representant_legal?.prenom?.message}
            >
              <FormLabel>Prénom représentant </FormLabel>
              <Input
                variant="effectifForm"
                placeholder="Exemple: Karim"
                type="text"
                {...register("apprenant.representant_legal.prenom")}
              />
              <FormErrorMessage>{errors.apprenant?.representant_legal?.prenom?.message}</FormErrorMessage>
            </FormControl>
          </HStack>
          <HStack style={rowStyle}>
            <FormControl
              isDisabled={representantForm}
              isInvalid={!!errors.apprenant?.representant_legal?.courriel?.message}
              style={inputStyle}
            >
              <FormLabel>Courriel représentant </FormLabel>
              <Input
                variant="effectifForm"
                placeholder="Exemple: incroyable@mail.com"
                type="email"
                {...register("apprenant.representant_legal.courriel")}
              />
              <FormErrorMessage>{errors.apprenant?.representant_legal?.courriel?.message}</FormErrorMessage>
            </FormControl>
            <FormControl
              isDisabled={representantForm}
              isInvalid={!!errors.apprenant?.representant_legal?.telephone?.message}
            >
              <FormLabel>Téléphone représentant </FormLabel>
              <InputGroup>
                <InputLeftAddon backgroundColor="#e6e6e6">+33</InputLeftAddon>
                <Input
                  variant="effectifForm"
                  placeholder="Exemple: (0)6 00 00 00 00"
                  type="tel"
                  {...register("apprenant.representant_legal.telephone")}
                />
                <FormErrorMessage>{errors.apprenant?.representant_legal?.telephone?.message}</FormErrorMessage>
              </InputGroup>
            </FormControl>
          </HStack>
        </VStack>
      </Box>
      <HStack justifyContent="end">
        {next.canGo && (
          <Button variant="primary" type="submit">
            <Text as="span">Enregistrer et passer à l&apos;étape suivante</Text>
          </Button>
        )}
      </HStack>
    </form>
  );
};

export default EffectfCoordonneesComponent;