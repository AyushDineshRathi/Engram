import React from "react";
import ReactDOM from "react-dom/client";

function Popup() {
  return (
    <div style={{ padding: 16 }}>
      <h2>Engram</h2>
      <p>Agent Mode: OFF</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<Popup />);