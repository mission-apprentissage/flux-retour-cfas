import "react-datepicker/dist/react-datepicker.css";
import "./PeriodeFilter.css";

import { format, isThisMonth, lastDayOfMonth } from "date-fns";
import fr from "date-fns/locale/fr";
import PropTypes from "prop-types";
import React from "react";
import DatePicker, { registerLocale } from "react-datepicker";

import { FilterButton } from "../../../../common/components";

registerLocale("fr", fr);

const PeriodeFilter = ({ value, onChange }) => {
  const buttonLabel = format(value, "MMMM yyyy", { locale: fr });

  const onChangeCb = (selectedDate) => {
    // by default, once a month is selected we use its last day
    const lastDayOfSelectedMonth = lastDayOfMonth(selectedDate);
    // if user has selected current month, we choose to use the current date instead of the last day in the month to avoid using dates in the future
    const date = isThisMonth(lastDayOfSelectedMonth) ? new Date() : lastDayOfSelectedMonth;
    onChange(date);
  };

  // latest month user can select is the current one. We need to pass the last day of current month to reat-datepicker to do so
  const maxDate = lastDayOfMonth(new Date());

  return (
    <div>
      <DatePicker
        selected={value}
        onChange={onChangeCb}
        showMonthYearPicker
        showFullMonthYearPicker
        showFourColumnMonthYearPicker
        locale="fr"
        maxDate={maxDate}
        customInput={
          <FilterButton icon="ri-calendar-event-fill">
            <span style={{ textTransform: "capitalize" }}>{buttonLabel}</span>
          </FilterButton>
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
