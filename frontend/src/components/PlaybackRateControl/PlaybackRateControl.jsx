import "./PlaybackRateControl.css";

function PlaybackRateControl({ playbackRate, onChange }) {
  const options = [
    { label: "천천히", value: 0.8},
    { label: "보통", value: 1 },
    { label: "빠르게", value: 1.5 },
  ];

  return (
    <div className="playback-rate-card">
      <div className="playback-rate-options">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`playback-rate-option ${
              playbackRate === option.value ? "active" : ""
            }`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default PlaybackRateControl;
