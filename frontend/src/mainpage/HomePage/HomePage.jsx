import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MicButton from "../../components/MicButton/MicButton.jsx";
import "./HomePage.css";

function HomePage() {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [situation, setSituation] = useState("");

  const handleMicClick = () => {
    if (isListening) {
      setIsListening(false);
      setSituation("아이가 밤에 잠드는 것을 무서워해요.");
      return;
    }

    setIsListening(true);
  };

  const handleCreateStory = () => {
    if (!situation.trim()) {
      alert("아이의 상황을 먼저 입력하거나 마이크 버튼을 눌러주세요.");
      return;
    }

    navigate("/story", {
      state: {
        situation,
      },
    });
  };

  return (
    <div className="tablet-page">
      <main className="tablet-frame">
        <section className="voice-section">
          <p className="service-label">MAMA / PAPA TELLER</p>

          <h1>마마/파파 텔러</h1>

          <p className="main-description">
            아이의 상황을 말하면, 부모가 들려줄 수 있는 따뜻한 동화를
            만들어줘요.
          </p>

          <MicButton isListening={isListening} onClick={handleMicClick} />

          <textarea
            className="situation-input"
            value={situation}
            onChange={(event) => setSituation(event.target.value)}
            placeholder="예: 아이가 밤에 잠드는 것을 무서워해요."
          />

          <button className="create-button" onClick={handleCreateStory}>
            동화 만들기
          </button>
        </section>
      </main>
    </div>
  );
}

export default HomePage;
