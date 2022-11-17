import { IconButton, Input as ChackraInput } from "@chakra-ui/react";

import React, { forwardRef, useMemo } from "react";
import { InputWrapper } from "./InputWrapper";
import { DateTime } from "luxon";
import range from "lodash.range";
import { IMask, IMaskMixin } from "react-imask";
import { IoArrowBackward, IoArrowForward } from "../../../../../theme/components/icons";
import DatePicker, { registerLocale } from "react-datepicker";
import fr from "date-fns/locale/fr";
registerLocale("fr", fr);

export const DateInput = (props) => {
  const { name, onChange, error, value, label, locked } = props;
  return (
    <InputWrapper {...props}>
      <DateInputIn
        variant="cerfa"
        isInvalid={!!error}
        name={name}
        locked={locked}
        onChange={onChange}
        value={value}
        placeholder={label}
      />
    </InputWrapper>
  );
};

const DateInputIn = (props) => {
  const { onChange, value, locked } = props;
  const dateValue = useMemo(() => {
    if (!value) return "";
    if (typeof value === "number") return DateTime.fromMillis(value).setLocale("fr-FR").toJSDate();
    return DateTime.fromISO(value).setLocale("fr-FR").toJSDate();
  }, [value]);

  const years = range(1900, 2035);
  const months = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Aout",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];

  const CustomHeader = ({
    date,
    changeYear,
    changeMonth,
    decreaseMonth,
    increaseMonth,
    prevMonthButtonDisabled,
    nextMonthButtonDisabled,
  }) => {
    const yearValue = date.getFullYear() >= 1930 && date.getFullYear() <= 2035 ? date.getFullYear() : 2022;
    return (
      <div
        style={{
          margin: 10,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <IconButton
          isDisabled={prevMonthButtonDisabled}
          variant="unstyled"
          onClick={decreaseMonth}
          minW={2}
          icon={<IoArrowBackward olor={"disablegrey"} boxSize="4" />}
          size="sm"
          mt={-2}
        />
        <select value={yearValue} onChange={({ target: { value } }) => changeYear(value)}>
          {years.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          value={months[date.getMonth()]}
          onChange={({ target: { value } }) => changeMonth(months.indexOf(value))}
        >
          {months.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <IconButton
          isDisabled={nextMonthButtonDisabled}
          onClick={increaseMonth}
          variant="unstyled"
          minW={2}
          icon={<IoArrowForward olor={"disablegrey"} boxSize="4" />}
          size="sm"
          mt={-2}
        />
      </div>
    );
  };

  return (
    <DatePicker
      dateFormat="ddMMyyyy"
      locale="fr"
      disabled={locked}
      selected={dateValue}
      closeOnScroll={true}
      renderCustomHeader={CustomHeader}
      customInput={<CustomDateInput {...props} value={value} />}
      onChange={(date) => onChange(DateTime.fromJSDate(date).setLocale("fr-FR").toUTC().toISO())}
      fixedHeight
    />
  );
};

const MInput = IMaskMixin(({ inputRef, ...props }) => <ChackraInput {...props} ref={inputRef} />);

// eslint-disable-next-line react/display-name
const CustomDateInput = forwardRef(({ value, onChange, onFocus, locked, onClick, ...props }, ref) => {
  const actions = !locked
    ? { onClick: onClick, onFocus: onFocus }
    : {
        onKeyDown: (e) => {
          e.preventDefault();
        },
      };

  return (
    <MInput
      {...props}
      isDisabled={locked}
      mask="d/m/Y"
      unmask={true}
      lazy={false}
      placeholderChar="_"
      autofix={true}
      blocks={{
        d: { mask: IMask.MaskedRange, placeholderChar: "j", from: 1, to: 31, maxLength: 2 },
        m: { mask: IMask.MaskedRange, placeholderChar: "m", from: 1, to: 12, maxLength: 2 },
        Y: { mask: IMask.MaskedRange, placeholderChar: "a", from: 1900, to: 2999, maxLength: 4 },
      }}
      onAccept={(val) => {
        if (val.length === 8 || !val) {
          onChange({ persist: () => {}, target: { value: val } });
        }
      }}
      ref={ref}
      value={value}
      {...actions}
    />
  );
});
