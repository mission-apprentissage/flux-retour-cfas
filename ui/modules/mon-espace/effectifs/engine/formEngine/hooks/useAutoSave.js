import { useEffect, useRef } from "react";
import { atom, useRecoilCallback, useRecoilValue, useSetRecoilState } from "recoil";
import { isEmptyValue } from "../utils/isEmptyValue";
import { getValues } from "../utils/getValues";
import { apiService } from "../../services/api.service";
import debounce from "lodash.debounce";
import { effectifIdAtom } from "../../atoms";
import setWith from "lodash.setwith";
import { organismeAtom } from "../../../../../../hooks/organismeAtoms";
import { effectifStateSelector } from "../atoms";

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
  const getOrganisme = useRecoilCallback(
    ({ snapshot }) =>
      async () =>
        snapshot.getPromise(organismeAtom),
    []
  );
  const effectifId = useRecoilValue(effectifIdAtom);
  const setEffectifsState = useSetRecoilState(effectifStateSelector(effectifId));
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

        const data = { ...getValues(toSave), is_lock: getIsLocked(toSave) };
        const organisme = await getOrganisme();
        try {
          await apiService.saveCerfa({
            organisme_id: organisme._id,
            data,
            effectifId,
            inputNames: inputNamesRef.current,
          });

          setEffectifsState({ inputNames: inputNamesRef.current });

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
  }, [controller, effectifId, getOrganisme, setAutoSave, setEffectifsState]);
};
