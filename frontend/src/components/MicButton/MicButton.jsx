import "./MicButton.css";

function MicButton({ isListening, onClick }) {
  const buttonClassName = isListening ? "mic-button listening" : "mic-button";

  return (
    <button className={buttonClassName} onClick={onClick} aria-label="음성 인식 시작">
      <span className="mic-icon">{isListening ? "⏳" : "🎤"}</span>
    </button>
  );
}

export default MicButton;