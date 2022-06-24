import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Bar, getElementAtEvent } from 'react-chartjs-2';
import Zoom from 'chartjs-plugin-zoom';
import 'chartjs-adapter-date-fns';
import styled from '@emotion/styled';
import { Button, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import axios from 'axios';

const TimelineDiv = styled.div`
  position: relative;
  width: 80%;
  height: 80%;
  margin: 10px;
  padding: 10px;
`;

const EditModal = styled.div`
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(255, 255, 255, 1);
  box-shadow: 0px 0px 8px 8px rgba(255, 255, 255, 1);
  border-radius: 25px;
  padding: 15px;
  > * {
    margin: 10px
  }
`;

Tooltip.positioners.cursor = (elem, coordinates) => (coordinates);

const options = {
  indexAxis: 'y',
  elements: {
    bar: {
      borderWidth: 0,
    },
  },
  plugins: {
    legend: {
      display: false,
    },
    zoom: {
      limits: {
        x: { min: 'original', max: 'original', minRange: 86400000 },
        y: { min: 'original', max: 'original' },
      },
      pan: { enabled: true, mode: 'xy', threshold: 10 },
      zoom: {
        mode: 'xy',
        wheel: {
          enabled: true,
        },
      },
    },
    tooltip: {
      enabled: true,
      position: 'cursor',
      callbacks: {
        label: ({ raw }) => (`${raw[0]} - ${raw[1].substring(0, raw[1].indexOf(' '))}`),
      },
    },
  },
};

const convertStart = (d) => (`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${(d.getDate()).toString().padStart(2, '0')}`);
const convertEnd = (d) => (`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${(d.getDate()).toString().padStart(2, '0')} 23:59:00`);

function hslToHex(h, s, l) {
  const a = (s * Math.min(l / 100, 1 - l / 100)) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const clr = l / 100 - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * clr).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function TimelineChart({
  timeData, setTimeData, labels, setLabels,
}) {
  const [data, setData] = useState({ labels: [], datasets: [] });
  const [edit, setEdit] = useState(false);
  const [editEvent, setEditEvent] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [index, setIndex] = useState(0);
  const [color, setColor] = useState('');
  const [helper, setHelper] = useState(false);
  const chartRef = useRef();
  const editEventRef = useRef();

  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Zoom,
    TimeScale,
  );

  const handleClick = (e) => {
    const element = getElementAtEvent(chartRef.current, e);
    if (element.length) {
      setIndex(element[0].index);
      setEditEvent(labels[element[0].index]);
      setEditStartDate(timeData[element[0].index].startDate);
      setEditEndDate(timeData[element[0].index].endDate);
      let clr = timeData[element[0].index].backgroundColor;
      if (clr[0] === 'h') {
        const match = clr.match(/\d+/g);
        clr = hslToHex(Number(match[0]), Number(match[1]), Number(match[2]));
      }
      setColor(clr);
      setEdit(true);
    } else {
      setEdit(false);
    }
  };

  useEffect(() => {
    const data2 = [];
    const backgroundColor = [];
    let minDate = Date.now();
    let maxDate = Date.now();

    timeData.forEach((entry) => {
      if (entry.startDate < minDate) {
        minDate = entry.startDate;
      }
      if (entry.endDate > maxDate) {
        maxDate = entry.endDate;
      }
      data2.push([convertStart(entry.startDate), convertEnd(entry.endDate)]);
      backgroundColor.push(entry.backgroundColor);
    });

    options.scales = {
      x: {
        type: 'time',
        min: minDate.valueOf() - 86400000,
        max: maxDate.valueOf() + 86400000,
        time: {
          minUnit: 'day',
          displayFormats: {
            day: 'MMM d yyyy',
          },
        },
      },
    };

    setData({
      labels,
      datasets: [
        {
          label: 'Events',
          data: data2,
          backgroundColor,
        },
      ],
    });
  }, [timeData]);

  return (
    <TimelineDiv>
      <Bar
        data={data}
        options={options}
        ref={chartRef}
        onClick={handleClick}
      />
      {edit ? (
        <EditModal>
          <div>
            <TextField
              variant="outlined"
              label="Event"
              value={editEvent}
              inputRef={editEventRef}
              onChange={(e) => { setEditEvent(e.target.value); }}
              helperText={helper ? 'Please enter an event.' : ''}
            />
          </div>
          <div>
            <DatePicker
              label="Start Date"
              renderInput={(params) => <TextField {...params} />}
              value={editStartDate}
              onChange={(d) => { setEditStartDate(d); }}
            />
          </div>
          <div>
            <DatePicker
              label="End Date"
              renderInput={(params) => <TextField {...params} />}
              value={editEndDate}
              onChange={(d) => { setEditEndDate(d); }}
            />
          </div>
          <div>
            <Button
              variant="contained"
              onClick={() => {
                if (editEvent.length) {
                  setHelper(false);
                  const newTimeData = [...timeData];
                  newTimeData[index].startDate = editStartDate;
                  newTimeData[index].endDate = editEndDate;
                  newTimeData[index].event = editEvent;
                  // newTimeData[index].backgroundColor = color;
                  const newLabels = [...labels];
                  newLabels[index] = editEvent;
                  axios.patch('/editEvent', newTimeData[index])
                    .then(() => {
                      setLabels(newLabels);
                      setTimeData(newTimeData);
                      setEdit(false);
                    })
                    .catch((err) => {
                      console.log(err);
                    });
                } else if (editEventRef.current) {
                  setHelper(true);
                  editEventRef.current.focus();
                }
              }}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                axios.delete('/deleteEvent', { data: timeData[index] })
                  .then(() => {
                    const newTimeData = [...timeData];
                    const newLabels = [...labels];
                    newTimeData.splice(index, 1);
                    newLabels.splice(index, 1);
                    setLabels(newLabels);
                    setTimeData(newTimeData);
                    setEdit(false);
                  })
                  .catch((err) => {
                    console.log(err);
                  });
              }}
            >
              Delete
            </Button>
          </div>
          <div>
            <Button
              variant="outlined"
              onClick={() => {
                if (index > 0) {
                  const newTimeData = [...timeData];
                  const newLabels = [...labels];
                  const movingTimeData = newTimeData[index];
                  const movingLabel = newLabels[index];
                  newTimeData.splice(index, 1);
                  newLabels.splice(index, 1);
                  newTimeData.splice(index - 1, 0, movingTimeData);
                  newLabels.splice(index - 1, 0, movingLabel);
                  setIndex(index - 1);
                  setLabels(newLabels);
                  setTimeData(newTimeData);
                }
              }}
            >
              Move Up
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                if (index < timeData.length - 1) {
                  const newTimeData = [...timeData];
                  const newLabels = [...labels];
                  const movingTimeData = newTimeData[index];
                  const movingLabel = newLabels[index];
                  newTimeData.splice(index, 1);
                  newLabels.splice(index, 1);
                  newTimeData.splice(index + 1, 0, movingTimeData);
                  newLabels.splice(index + 1, 0, movingLabel);
                  setIndex(index + 1);
                  setLabels(newLabels);
                  setTimeData(newTimeData);
                }
              }}
            >
              Move Down
            </Button>
          </div>
          {/* <input
            type="color"
            value={color}
            onChange={(e) => { setColor(e.target.value); }}
          /> */}
        </EditModal>
      ) : null}
    </TimelineDiv>
  );
}

export default TimelineChart;
