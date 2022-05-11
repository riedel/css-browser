import "bootstrap";
import "@fortawesome/fontawesome-free/css/all.css";
import "bootstrap/dist/css/bootstrap.css";
import "./styles.scss";

document.getElementById("subject").value = Math.floor(
  (1 + Math.random()) * 0x10000
).toString(16);

var defaultTags = {};

const MobileDetect = require("mobile-detect");
const mobile = new MobileDetect(window.navigator.userAgent);

if (mobile.mobile()) {
  defaultTags.mobile = mobile.mobile();
}

if (mobile.userAgent()) {
  defaultTags.browser = mobile.userAgent();
}

const sensors = {
  deviceorientation: {
    listener: function (/** @type {DeviceOrientationEvent} */ evt) {
      if (evt.alpha === null) return;
      record(
        evt.type,
        {
          alpha: evt.alpha,
          beta: evt.beta,
          gamma: evt.gamma
        },
        evt.timeStamp + performance.timing.navigationStart
      );
    }
  },
  devicemotion: {
    listener: function (/** @type {DeviceMotionEvent} */ evt) {
      if (evt.acceleration.x === null) return;

      record(
        evt.type,
        {
          x0: evt.acceleration.x,
          y0: evt.acceleration.y,
          z0: evt.acceleration.z,
          x: evt.accelerationIncludingGravity.x,
          y: evt.accelerationIncludingGravity.y,
          z: evt.accelerationIncludingGravity.z,
          alpha: evt.rotationRate.alpha,
          beta: evt.rotationRate.beta,
          gamma: evt.rotationRate.gamma
        },
        evt.timeStamp + performance.timing.navigationStart
      );
    }
  }
};

const datasetCollector = require("edge-ml").datasetCollector;

async function start_recording() {
  for (const [sensor, fun] of Object.entries(sensors)) {
    fun.collector = await datasetCollector(
      "https://app.edge-ml.org", // Backend-URL
      "darQUBlV4lzEtI2DcX1b+HSpyCPYUi+Y/yJWHZ35NCMis/BX+xrXu4UZrioOARqAdrkRZqOe0b+n4sZAamtGvw==", // API-Key
      sensor, // Name for the dataset
      false, // False to provide own timestamps

      // These two parameters can be omitted
      Object.assign(
        { participantId: document.getElementById("subject").value },
        defaultTags
      ), // Metadata: {} to omit
      "activities_" + document.getElementById("label").value // Labeling and label for the whole dataset. Format: {labeling}_{label}
    );

    window.addEventListener(sensor, fun.listener, true);
  }
}

async function stop_recording() {
  for (const [sensor, fun] of Object.entries(sensors)) {
    window.removeEventListener(sensor, fun.listener, true);
    await fun.collector.onComplete();
  }
}

function record(eventtype, fields, eventtime) {
  // time at which the event happend
  for (const [key, value] of Object.entries(fields)) {
    sensors[eventtype].collector.addDataPoint(eventtime, key, value);
  }
}

// Wir schalten einen Timer an/aus mit der checkbox
document.getElementById("record").onchange = function () {
  if (this.checked) {
    start_recording();
    document.getElementById("debug").innerHTML = "Recording.";
  } else {
    stop_recording();
    document.getElementById("debug").innerHTML = "Not recording.";
  }
};
