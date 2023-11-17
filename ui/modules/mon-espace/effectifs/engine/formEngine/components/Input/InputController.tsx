import { memo, useCallback } from "react";
import { useRecoilValue } from "recoil";

import { fieldSelector } from "@/modules/mon-espace/effectifs/engine/formEngine/atoms";
import { useEffectifFormController } from "@/modules/mon-espace/effectifs/engine/formEngine/EffectifFormControllerContext";

import { InputField } from "./Input";

// eslint-disable-next-line react/display-name
export const InputController = memo(({ name, fieldType, mt, mb, ml, mr, w, onApplyAll }: any) => {
  const controller = useEffectifFormController();

  const handle = useCallback(
    (value, extra) => {
      controller.setField(name, value, { extra });
    },
    [controller, name]
  );

  const field = useRecoilValue<any>(fieldSelector(name));

  if (!field) return <></>;

  // if (!field) throw new Error(`Field ${name} is not defined.`);

  console.log(field);

  return (
    <InputField
      fieldType={fieldType ?? "text"}
      name={name}
      {...field}
      value={field.value ?? ""}
      onChange={handle}
      isRequired={field.required}
      showApplyAllOption={field.showApplyAllOption && field.value}
      onApplyAll={onApplyAll}
      mb={mb}
      mt={mt}
      ml={ml}
      mr={mr}
      w={w}
      success={false}
    />
  );
});
