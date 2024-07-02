import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const CalendarWidget = ({ selectedDate, onDateChange }) => {
  return (
    <DatePicker
      selected={selectedDate}
      onChange={date => onDateChange(date)}
      dateFormat="yyyy/MM/dd"
    />
  );
};

export default CalendarWidget;