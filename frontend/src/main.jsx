import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx"; // Application complète
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.min.css";
import "./styles/design-system.css"; // Import du design system moderne
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
