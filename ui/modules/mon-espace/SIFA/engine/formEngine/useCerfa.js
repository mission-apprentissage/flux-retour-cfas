import { useRecoilCallback, useSetRecoilState } from "recoil";
import { cerfaAtom, cerfaSetter, cerfaStatusGetter, fieldSelector, valuesSelector } from "./atoms";
import { validField } from "./utils/validField";
import { useMemo, useRef } from "react";
import { dossierAtom } from "../atoms";
import { isEmptyValue } from "./utils/isEmptyValue";
import { indexedDependencies } from "./cerfaSchema";
import { findDefinition } from "./utils";
import { getValues } from "./utils/getValues";
import { indexedDependencesRevalidationRules, indexedRules } from "./cerfaSchema";
import { findLogicErrors } from "./utils/findLogicErrors";

export const useCerfa = ({ schema } = {}) => {
  const setCerfa = useSetRecoilState(cerfaAtom);
  const patchFields = useSetRecoilState(cerfaSetter);

  const getData = useRecoilCallback(
    ({ snapshot }) =>
      async () => ({
        dossier: await snapshot.getPromise(dossierAtom),
        fields: await snapshot.getPromise(cerfaAtom),
        values: await snapshot.getPromise(valuesSelector),
      }),
    []
  );

  const getFields = useRecoilCallback(
    ({ snapshot }) =>
      async () =>
        await snapshot.getPromise(cerfaAtom),
    []
  );

  const abortControllers = useRef({});

  const getValue = useRecoilCallback(
    ({ snapshot }) =>
      async (name) =>
        (await snapshot.getPromise(cerfaAtom))[name].value,
    []
  );

  const registerField = useRecoilCallback(
    ({ snapshot }) =>
      async (name, fieldDefinition) => {
        const field = await snapshot.getPromise(fieldSelector(name));
        if (field) return;
        const fieldSchema = findDefinition({ name, schema }) ?? fieldDefinition;
        if (!fieldSchema) throw new Error(`Field ${name} is not defined.`);
        patchFields({ [name]: fieldSchema });
      },
    []
  );

  const getStatus = useRecoilCallback(
    ({ snapshot }) =>
      async () =>
        snapshot.getPromise(cerfaStatusGetter),
    []
  );

  const controller = useMemo(() => {
    const computeGlobal = async ({ name }) => {
      abortControllers.current[name] = new AbortController();
      for (let logic of indexedRules[name] ?? []) {
        const { values, dossier, fields } = await getData();
        try {
          const signal = abortControllers.current[name].signal;
          const { cascade, error, warning, cache } =
            (await logic.process({ fields, values, signal, dossier, name, cache: logic.cache })) ?? {};
          logic.cache = cache;
          if (error && !logic.target) {
            patchFields({ [name]: { error, success: false, warning: undefined } });
          } else if (warning) {
            patchFields({ [name]: { warning } });
          }
          if (cascade) {
            // eslint-disable-next-line no-undef
            await Promise.all(
              Object.keys(cascade).map(
                async (key) =>
                  await onCascadeField({
                    name: key,
                    patch: cascade[key],
                  })
              )
            );
          }
          if (error && !logic.target) return;
        } catch (e) {
          if (e.name !== "AbortError") throw e;
        }
      }
      await validDeps({ name });
    };

    const validDeps = async ({ name }) => {
      const { values, dossier, fields } = await getData();
      // eslint-disable-next-line no-undef
      await Promise.all(
        (indexedDependencies[name] ?? []).map(async (dep) => {
          const field = fields[dep];
          if (!field.error || isEmptyValue(field.value)) return;
          let error;
          error = (await validField({ field, value: field.value })).error;
          if (!error) {
            const logics = indexedDependencesRevalidationRules[name][dep];
            error = await findLogicErrors({ name: dep, logics, values, dossier, fields });
          }
          if (!error) {
            await processField({ name: dep, value: field.value });
          }
          patchFields({ [dep]: { error, success: !error } });
        })
      );
    };

    const onCascadeField = async ({ name, patch }) => {
      if (patch === undefined) {
        patchFields({ [name]: undefined });
        return;
      }

      await registerField(name, patch);
      const { fields, values } = await getData();
      const field = fields[name];

      if (patch.reset) {
        patchFields({
          [name]: {
            value: undefined,
            error: "",
            loading: false,
            success: undefined,
            touched: false,
            ...field?._init?.({ values }),
            ...patch,
          },
        });
        return;
      }

      if (patch.value === field?.value || (isEmptyValue(patch.value) && isEmptyValue(field.value))) {
        patch = { ...patch };
        delete patch.value;
        if (!Object.keys(patch).length) return;
        patchFields({ [name]: { ...patch, loading: false } });
        return;
      }
      abortControllers.current[name]?.abort();

      const { error } = await validField({ field, value: patch.value });
      patchFields({ [name]: { ...patch, error, loading: false, success: !error } });
      if (error) return;

      if (patch.cascade === false) {
        await validDeps({ name });
      } else {
        await computeGlobal({ name });
      }
    };

    const processField = async ({ name, value }) => {
      abortControllers.current[name]?.abort();
      const fields = await getFields();
      const { error } = await validField({ field: fields[name], value });
      patchFields({ [name]: { error, warning: undefined, loading: !error, success: !error, value } });
      if (error) return;
      await computeGlobal({ name });
      patchFields({ [name]: { loading: false } });
    };

    const triggerValidation = async (fieldNames) => {
      const { fields } = await getData();
      const patch = {};
      for (let name of fieldNames) {
        const field = fields[name];
        if (!field) continue;
        const { error } = await validField({ field, value: field.value });
        if (!fields[name].error) {
          patch[name] = { error };
        }
      }
      patchFields(patch);
    };
    const observers = {};
    return {
      getStatus,
      triggerValidation,
      setField: async (name, value, { extra, triggerSave = true }) => {
        patchFields({ [name]: { value, extra } });
        setTimeout(async () => {
          const currentValue = await getValue(name);
          await processField({ name, value: currentValue });
          if (triggerSave) {
            controller.dispatch("CHANGE", { fields: await getFields(), inputName: name });
          }
        });
      },
      setFields: (fields) => {
        const values = getValues(fields);
        const formattedFields = Object.fromEntries(
          Object.entries(fields).map(([key, field]) => {
            field = { ...field, ...field._init?.({ values, fields }) };
            return [key, field];
          })
        );
        setCerfa(formattedFields);
      },
      dispatch: (name, data) => (observers[name] ?? []).forEach((handler) => handler(data)),
      on(eventName, handler) {
        observers[eventName] = observers[eventName] ?? [];
        observers[eventName] = [...observers[eventName], handler];
      },
      off(eventName, handler) {
        observers[eventName] = observers[eventName] ?? {};
        observers[eventName] = observers[eventName].filter((item) => item !== handler);
      },
    };
  }, [getData, getFields, getStatus, getValue, patchFields, registerField, setCerfa]);
  return { controller };
};
