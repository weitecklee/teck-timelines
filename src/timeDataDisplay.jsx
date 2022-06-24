import React from 'react';

function TimeDataDisplay({ timeData }) {
  return (
    <>
      {timeData.map((data, i) => (
        <p key={i}>
          {data.event}
          <br />
          {data.startDate}
          <br />
          {data.endDate}
        </p>
      ))}
    </>
  );
}

export default TimeDataDisplay;
