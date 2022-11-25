import { useEffect, useRef } from "react";
import { atom, useRecoilCallback, useSetRecoilState } from "recoil";
import { isEmptyValue } from "../utils/isEmptyValue";
import { getValues } from "../utils/getValues";
import { apiService } from "../../services/api.service";
import debounce from "lodash.debounce";
import { dossierAtom } from "../../atoms";
import setWith from "lodash.setwith";

const getIsLocked = (fields) => {
  if (!fields) return undefined;
  const values = {};
  Object.entries(fields).forEach(([key, field]) => {
    setWith(values, key, field.locked);
  });
  return values;
};

export const autoSaveStatusAtom = atom({
  key: "autoSaveStatusAtom",
  default: "OK", // "OK" | "ERROR" | "PENDING"
});

export const useAutoSave = ({ controller }) => {
  const getDossier = useRecoilCallback(
    ({ snapshot }) =>
      async () =>
        snapshot.getPromise(dossierAtom),
    []
  );
  const inputNamesRef = useRef([]);
  const setAutoSave = useSetRecoilState(autoSaveStatusAtom);

  useEffect(() => {
    let timeout;
    const save = debounce(
      async ({ fields }) => {
        clearTimeout(timeout);
        const toSave = Object.fromEntries(
          Object.entries(fields)
            .filter(([, field]) => field.autosave !== false)
            .map(([name, field]) => {
              if (!field.error && !isEmptyValue(field.value)) {
                return [name, field];
              }
              return [name, { ...field, value: null }];
            })
        );

        const data = { ...getValues(toSave), isLockedField: getIsLocked(toSave) };
        const dossier = await getDossier();
        try {
          await apiService.saveCerfa({
            dossierId: dossier._id,
            data,
            cerfaId: dossier.cerfaId,
            inputNames: inputNamesRef.current,
          });
          inputNamesRef.current = [];
        } catch (e) {
          setAutoSave("ERROR");
          throw e;
        }
        timeout = setTimeout(() => {
          setAutoSave("OK");
        }, 800);
      },
      1000,
      { trailing: true }
    );

    const handler = ({ fields, inputName }) => {
      setAutoSave("PENDING");
      if (inputNamesRef.current.indexOf(inputName) === -1) {
        inputNamesRef.current = [...inputNamesRef.current, inputName];
      }
      save({ fields, inputName });
    };

    controller.on("CHANGE", handler);
    return () => {
      controller.off("CHANGE", handler);
      clearTimeout(timeout);
    };
  }, [controller, getDossier, setAutoSave]);
};
