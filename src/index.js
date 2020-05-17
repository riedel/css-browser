import "bootstrap";
import "@fortawesome/fontawesome-free/css/all.css";
import "bootstrap/dist/css/bootstrap.css";
import "./styles.scss";

import MobileDetect from "mobile-detect";
// import influent  funktioniert nicht, mit parcel weil es denkt, dass es unter node läuft

import influent from "influent/dist/influent.js";

// Wir speichern erstmal alle Events um sie dann asynchron zu schreiben
var evts = [];
var recording = null; //nur wenn wir aufnehmen

//https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent
window.addEventListener("deviceorientation", function f(x) {
  if (recording != null) evts.push(x);
});

//https://developer.mozilla.org/en-US/docs/Web/API/DeviceOMotionEvent
window.addEventListener("devicemotion", function f(x) {
  if (recording != null) evts.push(x);
});

//  Ne statistik is nie schlecht
var data_count = 0;

// definiere mal wie oft ich pro Sekunde hochladen will....
var UPLOAD_RATE = 0.5;

// Dummyfunktion falls jemand recorded bevor es los geht
var write = function() {
  document.getElementById("debug").innerHTML = "Error Not connected.";
  document.getElementById("record").checked = false;
};

// Wir schalten einen Timer an/aus mit der checkbox
document.getElementById("record").onchange = function() {
  if (this.checked) {
    recording = window.setInterval(write, 1000 / UPLOAD_RATE);
    document.getElementById("debug").innerHTML = "Recording.";
  } else {
    window.clearInterval(recording);
    recording = null; //Schaltet auch die Speicherung ab
    document.getElementById("debug").innerHTML = "Not recording.";
    data_count = 0;
    evts = [];
  }
};

var md = new MobileDetect(window.navigator.userAgent);

//wir öffnen eine Verbindung zu unserem Server (https://github.com/gobwas/influent)
influent
  .createHttpClient({
    server: [
      {
        protocol: "https",
        host: "css20.dmz.teco.edu",
        port: 443
      }
    ],
    username: "css18",
    password: "css18",

    database: "browser"
  })
  .then(function(client) {
    write = function() {
      if (evts.length > 0) {
        let subject = document.getElementById("subject").value;
        let label = document.getElementById("label").value;

        var batch = new influent.Batch({ database: "browser" }); // da kommen alle zum versenden rein

        for (var i in evts) {
          var event = evts[i];
          var measurement = new influent.Measurement(event.type);
          measurement.setTimestamp(
            (
              performance.timing.navigationStart * 1000000 +
              parseInt(event.timeStamp * 1000000, 10)
            ).toString()
          );
          //das ist wichtige Groundtruth später
          measurement.addTag("label", label);
          measurement.addTag("subject", subject);
          measurement.addTag("mobile", "" + md.mobile());
          measurement.addTag("useragent", window.navigator.userAgent);
          //jetzt kommen die Daten
          if (event instanceof DeviceOrientationEvent) {
            for (var k1 in { alpha: 0, beta: 1, gamma: 2 })
              if (!isNaN(parseFloat(event[k1])))
                //sind manchmal leider leer
                measurement.addField(k1, new influent.F64(event[k1]));
          } else if (event instanceof DeviceMotionEvent) {
            for (var k2 in {
              acceleration: 0,
              accelerationIncludingGravity: 1,
              rotationRate: 2
            }) {
              for (var skey in event[k2])
                if (!isNaN(parseFloat(event[k2][skey])))
                  measurement.addField(
                    k2 + "." + skey,
                    new influent.F64(event[k2][skey])
                  );
            }
          }

          if (Object.keys(measurement.fields).length > 0) {
            //leere Messungen verursachen Fehler
            data_count++;
            batch.add(measurement);
          }
        }

        evts = []; //können wir jetzt löschen. Das tolle ist, dass jacascript singlethreaded ist!

        client.write(batch).then(function() {
          document.getElementById("debug").innerHTML =
            "Recorded... (" + data_count + ")"; //einfach nur um zu sehen, dass was passiert
        });
      }
    };
  });

//nur weil ich zu faul bin immer was einzutippen
document.getElementById("subject").value = Math.floor(
  (1 + Math.random()) * 0x10000
).toString(16);
