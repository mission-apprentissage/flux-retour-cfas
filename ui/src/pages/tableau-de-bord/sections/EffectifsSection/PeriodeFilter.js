import "react-datepicker/dist/react-datepicker.css";
import "./PeriodeFilter.css";

import { endOfMonth, format, isThisMonth } from "date-fns";
import fr from "date-fns/locale/fr";
import PropTypes from "prop-types";
import React, { useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";

import PrimarySelectButton from "../../../../common/components/SelectButton/PrimarySelectButton";

registerLocale("fr", fr);

const PeriodeFilter = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonLabel = format(value, "MMMM yyyy", { locale: fr });

  const onChangeCb = (selectedDate) => {
    // by default, once a month is selected we use its last day
    const lastDayOfSelectedMonth = endOfMonth(selectedDate);
    // if user has selected current month, we choose to use the current date instead of the last day in the month to avoid using dates in the future
    const date = isThisMonth(lastDayOfSelectedMonth) ? new Date() : lastDayOfSelectedMonth;
    onChange(date);
  };

  return (
    <div>
      <DatePicker
        selected={value}
        onChange={onChangeCb}
        showMonthYearPicker
        showFullMonthYearPicker
        showFourColumnMonthYearPicker
        locale="fr"
        onCalendarClose={() => setIsOpen(false)}
        onCalendarOpen={() => setIsOpen(true)}
        customInput={
          <PrimarySelectButton onClick={() => setIsOpen(!isOpen)} isOpen={isOpen}>
            en {buttonLabel}
          </PrimarySelectButton>
        }
      />
    </div>
  );
};

PeriodeFilter.propTypes = {
  value: PropTypes.instanceOf(Date).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default PeriodeFilter;
