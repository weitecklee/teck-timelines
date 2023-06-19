import React, { useState, useEffect } from 'react';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import axios from 'axios';
import TimeInput from './timeInput';
import TimelineChart from './timelineChart';

function App() {
  const [timeData, setTimeData] = useState([]);
  const [labels, setLabels] = useState([]);
  const [reset, setReset] = useState(new Date());

  useEffect(() => {
    axios.get('/getEvents')
      .then((res) => {
        const newTimeData = [];
        const newLabels = [];
        res.data.forEach((a) => {
          newTimeData.push({
            startDate: new Date(a.startDate),
            endDate: new Date(a.endDate),
            backgroundColor: a.backgroundColor,
            event: a.event,
            _id: a._id,
          });
          newLabels.push(a.event);
        });
        setLabels(newLabels);
        setTimeData(newTimeData);
      })
      .catch((err) => {
        console.log(err);
      });
  }, [reset]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <TimeInput
        timeData={timeData}
        setTimeData={setTimeData}
        labels={labels}
        setLabels={setLabels}
        setReset={setReset}
      />
      <TimelineChart
        timeData={timeData}
        setTimeData={setTimeData}
        labels={labels}
        setLabels={setLabels}
      />
    </LocalizationProvider>
  );
}

export default App;
