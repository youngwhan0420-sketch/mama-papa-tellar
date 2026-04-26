import "./EmotionBar.css";

function EmotionBar({ emotion, emotionLevel }) {
  return (
    <div className="emotion-card">
      <div className="emotion-header">
        <span>현재 감정</span>
        <strong>{emotion}</strong>
      </div>

      <div className="emotion-bar-background">
        <div
          className="emotion-bar-fill"
          style={{ width: `${emotionLevel}%` }}
        />
      </div>
    </div>
  );
}

export default EmotionBar;
