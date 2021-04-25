import "bootstrap";
import "@fortawesome/fontawesome-free/css/all.css";
import "bootstrap/dist/css/bootstrap.css";
import "./styles.scss";

document.getElementById("subject").value = Math.floor(
  (1 + Math.random()) * 0x10000
).toString(16);
