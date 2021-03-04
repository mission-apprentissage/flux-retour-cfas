import "react-datepicker/dist/react-datepicker.css";
import "./PeriodeFilter.css";

import fr from "date-fns/locale/fr";
import PropTypes from "prop-types";
import React from "react";
import DatePicker, { registerLocale } from "react-datepicker";

import { FilterButton } from "../../../../common/components";
import { formatDate } from "../../../../common/utils/dateUtils";

registerLocale("fr", fr);

const PeriodeFilter = ({ value, onChange }) => {
  return (
    <div>
      <DatePicker
        locale="fr"
        selectsRange
        selected={value.startDate}
        onChange={(dates) => {
          const [start, end] = dates;
          onChange({ startDate: start, endDate: end });
        }}
        startDate={value.startDate}
        endDate={value.endDate}
        monthsShown={3}
        maxDate={new Date()}
        customInput={
          <FilterButton icon="ri-calendar-event-fill">
            Entre le {formatDate(value.startDate)} et le {formatDate(value.endDate)}
          </FilterButton>
        }
        todayButton="Aujourd'hui"
        shouldCloseOnSelect={false}
      />
    </div>
  );
};

PeriodeFilter.propTypes = {
  value: PropTypes.shape({
    startDate: PropTypes.instanceOf(Date).isRequired,
    endDate: PropTypes.instanceOf(Date).isRequired,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default PeriodeFilter;
