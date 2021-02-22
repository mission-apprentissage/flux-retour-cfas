import "react-datepicker/dist/react-datepicker.css";

import PropTypes from "prop-types";
import React from "react";
import DatePicker from "react-datepicker";

import { FilterButton } from "../../../../common/components";
import { formatDate } from "../../../../common/utils/dateUtils";

const PeriodeFilter = ({ date1, date2, onChange }) => {
  return (
    <div>
      <DatePicker
        selectsRange
        selected={date1}
        onChange={(dates) => {
          const [start, end] = dates;
          onChange({ date1: start, date2: end });
        }}
        startDate={date1}
        endDate={date2}
        monthsShown={3}
        maxDate={new Date()}
        customInput={
          <FilterButton icon="ri-calendar-event-fill">
            Entre le {formatDate(date1)} et le {formatDate(date2)}
          </FilterButton>
        }
        todayButton="Aujourd'hui"
        shouldCloseOnSelect={false}
      />
    </div>
  );
};

PeriodeFilter.propTypes = {
  date1: PropTypes.instanceOf(Date).isRequired,
  date2: PropTypes.instanceOf(Date).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default PeriodeFilter;
