import "bootstrap";
import "@fortawesome/fontawesome-free/css/all.css";
import "bootstrap/dist/css/bootstrap.css";
import "./styles.scss";

document.getElementById("subject").value = Math.floor(
  (1 + Math.random()) * 0x10000
).toString(16);

//Copy from Influxdb

const { InfluxDB } = require("@influxdata/influxdb-client");

const token =
  "d5oSFVlZ-7TuaJgq4XYosp-6E5Bh_6MsJAit7GbcshHdUh7mKy5v-pFGfH4DGg775t_FwpK7pTsKDItRiM9nJQ==";
const org = "css21";
const bucket = "css21";

const client = new InfluxDB({ url: "https://css21.teco.edu", token: token });

const { Point } = require("@influxdata/influxdb-client");

const writeApi = client.getWriteApi(org, bucket);

const MobileDetect = require("mobile-detect");

const mobile = new MobileDetect(window.navigator.userAgent);

var defaultTags = new Object();

if (mobile.mobile()) {
  defaultTags.mobile = mobile.mobile();
}
if (mobile.userAgent()) {
  defaultTags.browser = mobile.userAgent();
}

writeApi.useDefaultTags(defaultTags);

function deviceorientation_listener(/** @type {DeviceOrientationEvent} */ evt) {
  record(
    evt.type,
    {
      alpha: evt.alpha,
      beta: evt.beta,
      gamma: evt.gamma
    },
    { absolute: evt.absolute },
    evt.timeStamp
  );
}

function devicemotion_listener(/** @type {DeviceMotionEvent} */ evt) {
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
    { absolute: evt.absolute },
    evt.timeStamp
  );
}

// Wir schalten einen Timer an/aus mit der checkbox
document.getElementById("record").onchange = function () {
  if (this.checked) {
    window.addEventListener(
      "deviceorientation",
      deviceorientation_listener,
      true
    );
    window.addEventListener("devicemotion", devicemotion_listener, true);

    document.getElementById("debug").innerHTML = "Recording.";
  } else {
    window.removeEventListener(
      "deviceorientation",
      deviceorientation_listener,
      true
    );
    window.removeEventListener("devicemotion", devicemotion_listener, true);
    document.getElementById("debug").innerHTML = "Not recording.";
  }
};

function record(eventtype, fields, tags, eventtime) {
  const point = new Point(eventtype);

  for (const [key, value] of Object.entries(fields)) {
    switch (typeof value) {
      case "number":
        point.floatField(key, value);
        break;
      default:
        point.stringField(key, value);
    }
  }

  point.tag("subject", document.getElementById("subject").value);
  point.tag("label", document.getElementById("label").value);

  point.timestamp(
    (
      performance.timing.navigationStart * 1000000 +
      parseInt(eventtime * 1000000, 10)
    ).toString()
  );

  for (const [key, value] of Object.entries(tags)) {
    point.tag(key, value);
  }

  writeApi.writePoint(point);
}

window.setInterval(function () {
  writeApi.flush();
});
