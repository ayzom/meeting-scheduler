/* eslint-disable max-len */
// eslint-disable-next-line max-len
import {https} from "firebase-functions";
import {db} from "./utils/db";
import {findAvailableSlot, getTimeRange, isWithinInterval, toTimeZone} from "./utils/dateTime";
import * as admin from "firebase-admin";
import {isPast, addHours} from "date-fns";
import {format as tzFormat, zonedTimeToUtc} from "date-fns-tz";
const cors = require("cors")({origin: true});

const booking = db.collection("booking");
const statusCode = {
  ERROR: 400,
  OK: 200,
};
const userName = "DrJohn";

let responseStatus = statusCode.OK;

// eslint-disable-next-line require-jsdoc
async function addUser(body, userDB) {
  let responseBody;
  try {
    const {uTZ, uDuration, uStartTime} = body;
    await userDB.set({
      uTZ, uDuration, uStartTime,
    }, {
      merge: true,
    });
    responseBody="User added";
  } catch (err) {
    responseBody = "Failed to add user.";
    responseStatus = statusCode.ERROR;
  }
  return responseBody;
}

// eslint-disable-next-line require-jsdoc
async function getEvents(date, timeZone) {
  const result = [];
  if (!date || !timeZone) {
    responseStatus = statusCode.ERROR;
    throw new Error("No arguments passed.");
  }
  const prevData = await db.collection("booking").doc(userName).collection(date).doc("schedule").get().then((res) => {
    const resultSet = res.data()["records"];
    resultSet.forEach((item) => {
      const s = {
        startTime: toTimeZone(new Date(item.start), timeZone),
        endTime: toTimeZone(new Date(item.end), timeZone),
      };
      result.push(s);
    });
    return result;
  });
  return prevData ? result : [];
}

export const helloWorld = https.onRequest((request, response) => cors(request, response, async () => {
  const {body, query, path} = request;

  const user = booking.doc(userName);
  let responseBody;

  const env = await user.get().then((output) => {
    return output.data();
  });

  if (!env && path!=="/add-user") {
    responseStatus= statusCode.ERROR;
    responseBody="No User Exists. Please add User.";
    return response.status(responseStatus).json(responseBody);
  }

  if (path==="/add-user") {
    responseBody = await addUser(body, user);
    if (!responseBody) {
      responseBody = {
        message: "Failed to add user.",
      };
      responseStatus= statusCode.ERROR;
    }
    return response.status(responseStatus).json(responseBody);
  }

  const {uTZ: userTimeZone, uStartTime: userStartTime, uDuration: userDurationMinutes} = env;
  const minutesBlock = (userDurationMinutes*60);

  switch (path) {
    case "/find-slots": {
      const {Date: userDate, TimeZone} = query;
      const date = String(userDate).slice(0, 10);
      const result = await getEvents(date, TimeZone);
      const userStart = zonedTimeToUtc(`${date}T${userStartTime}`, userTimeZone);
      const range = getTimeRange(userStart, minutesBlock);
      responseBody=findAvailableSlot(result, range, TimeZone);
      break;
    }
    case "/create-event": {
      const {DateTime: userDateTime, Duration: userDuration} = body;

      const date = zonedTimeToUtc(userDateTime);
      const dbDate = tzFormat(date, "yyyy-MM-dd");
      const userStart = zonedTimeToUtc(`${dbDate}T${userStartTime}`, userTimeZone);
      const userEnd = addHours(userStart, userDurationMinutes);

      if (isPast(date) || !isWithinInterval(userStart, userEnd, date)) {
        responseBody= {
          message: "Invalid Time",
        };
        responseStatus= statusCode.ERROR;
      } else {
        const objKey = `${date}`;
        const inputData = {};
        const range = getTimeRange(date, userDuration);
        let flag = false;
        try {
          const prevData = await user.collection(dbDate).doc("schedule").get().then((res) => {
            return res.data()["records"];
          });
          prevData.forEach((i) => {
            range.forEach((j) => {
              if (i.start==j.end) {
                flag=true;
              }
            });
          });
        } catch (err) {
          console.error(err);
          responseStatus= statusCode.ERROR;
        }

        if (flag) {
          responseBody={
            message: "Meeting schedule already booked.",
          };
        } else {
          inputData[objKey] = [];

          // eslint-disable-next-line no-invalid-this
          const input = admin.firestore.FieldValue.arrayUnion.apply(this, range);
          await user.collection(dbDate).doc("schedule").set({
            records: input,
          }, {
            merge: true,
          });
          responseStatus= statusCode.OK;
          responseBody= {
            message: "Meeting created.",
          };
        }
      }
      break;
    }
    case "/get-events": {
      const userDate = String(query.Date).slice(0, 10);
      const userStart = zonedTimeToUtc(`${userDate}T${userStartTime}`, query.TimeZone);
      const userEnd = addHours(userStart, userDurationMinutes);
      try {
        const events =await getEvents(userDate, query.TimeZone);
        responseBody = {
          userStart: toTimeZone(userStart, query.TimeZone),
          userEnd: toTimeZone(userEnd, query.TimeZone),
          events,
        };
      } catch (err) {
        responseBody = {
          message: JSON.stringify(err),
        };
      }
      break;
    }
    default: {
      responseBody= {
        message: "No valid URL Path",
      };
      responseStatus= statusCode.ERROR;
    }
  }
  return response.status(responseStatus).json(responseBody);
}));
