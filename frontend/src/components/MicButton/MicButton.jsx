import "./MicButton.css";

function MicButton({ isListening, onClick }) {
  const buttonClassName = isListening ? "mic-button listening" : "mic-button";
  const buttonText = isListening ? "듣는 중..." : "눌러서 말하기";

  return (
    <button className={buttonClassName} onClick={onClick}>
      <span className="mic-icon">🎤</span>
      <span className="mic-text">{buttonText}</span>
    </button>
  );
}

export default MicButton;
