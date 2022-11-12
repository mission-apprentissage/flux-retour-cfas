/* eslint-disable no-process-exit */
import axios from 'axios';

const isTrue = (v) => v === true;

axios
  .get("http://localhost:5000/api/healthcheck")
  .then((response) => {
    if (response.status === 200 && Object.values(response.data.healthcheck).every(isTrue)) {
      console.log("healthcheck passed!");
      process.exit(0);
    }
    console.error("Status code was", response.status);
    console.error("Response data", response.data);
    process.exit(1);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
