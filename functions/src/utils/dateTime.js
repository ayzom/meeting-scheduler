import {
  format,
  isAfter,
  isBefore,
  parseISO,
  addMinutes
} from "date-fns";
import { format as tzFormat, zonedTimeToUtc } from "date-fns-tz";
const moment = require('moment-timezone');


const formatInTimeZone = function(time, fmt="yyyy-MM-dd kk:mm:ss xxx", tz="UTC") {
  const parsedTime = parseISO(time);
  return tzFormat(zonedTimeToUtc(parsedTime, tz), fmt, { timeZone: tz });
}


function getTimeRange(time='2021-04-10T19:30:00.00Z', duration=30) {
  let pTime = new Date(time);
  let result = [];
  let count = Math.ceil(duration/30);
  let i=0;
  while(i++ <count) {
    let startTime=pTime;
    pTime=addMinutes(pTime, 30);
    result.push({
      start: new Date(startTime).toUTCString(),
      end: new Date(pTime).toUTCString()
    });
  }
  return result;
}


const findAvailableSlot = function(result,range, timeZone) {
  let series = [];
  const isMeetingExist = function(resultSet, item, start, end) {
    let data = resultSet.filter((val, i) => {
      return start===val.startTime && end===val.endTime
    });
    return data.length ? false: true;
  }
  if(result && range) {
    series = range.map((item, j) => {
      let start = toTimeZone(new Date(item.start),timeZone);
      let end = toTimeZone(new Date(item.end), timeZone)
      return {
        start,
        end,
        available: isMeetingExist(result, item, start,end)
      }});
  }
  return series;
}

const isWithinInterval = function(start, end, timestamp){
  return isAfter(timestamp, start) && isBefore(timestamp, end);
}

function toTimeZone(time, zone, f='YYYY-MM-DDTHH:mm:ssZZ') {
  return moment(time, format).tz(zone).format(f);
}

export {
    findAvailableSlot,
    isWithinInterval,
    formatInTimeZone,
    getTimeRange,
    toTimeZone
}