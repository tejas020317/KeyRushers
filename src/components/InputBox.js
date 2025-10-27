import React from "react";
import "./InputBox.css";

export default function InputBox({ userInput, setUserInput }) {
  return (
    <div className="input-box">
      <textarea
        className="typing-input"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        placeholder="Start typing here..."
      />
    </div>
  );
}
