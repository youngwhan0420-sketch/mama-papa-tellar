import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MicButton from "../../components/MicButton/MicButton.jsx";
import "./HomePage.css";

function HomePage() {
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [isVoiceRegistered, setIsVoiceRegistered] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  useEffect(() => {
    fetch("http://localhost:8000/api/stories")
      .then((res) => res.json())
      .then((data) => setStories(data.story))
      .catch((err) => console.error("데이터 로딩 실패:", err));

    const registered = localStorage.getItem("mpt_is_voice_registered") === "true";
    setIsVoiceRegistered(registered);
  }, []);

  // 페이지네이션 계산
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStories = stories.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(stories.length / itemsPerPage);

  return (
    <div className="tablet-page">
      <main className="tablet-frame">
        <header className="header-section">
          <p className="service-label">MAMA / PAPA TELLER</p>
          <h1 className="main-title">우리 아이 동화 도서관</h1>
        </header>

        <section className="story-list-section">
          <div className="story-grid">
            {currentStories.map((story) => (
              <div
                key={story.story_id}
                className={`story-card ${!isVoiceRegistered ? "locked" : ""}`}
                onClick={() => isVoiceRegistered && navigate(`/story/${story.story_id}`)}
              >
                <div className="image-container">
                  <img src={story.image_path} alt={story.title} className="story-image" />
                  {!isVoiceRegistered && <div className="lock-overlay">🔒</div>}
                </div>
                <div className="story-info">
                  <h3>{story.title}</h3>
                  <span className="duration-tag">{story.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 페이지네이션 컨트롤: 아이들이 누르기 쉽게 동글동글하게 */}
        <div className="pagination-container">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="pag-btn"
          >이전</button>
          <span className="page-indicator">{currentPage} / {totalPages}</span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="pag-btn"
          >다음</button>
        </div>

        <div className="fixed-mic-container">
          <MicButton />
          {/* 
            <MicButton onClick={() => navigate("/record")} /> 
              - 나중에 녹음 페이지를 따로 만들어야될지 여기서 바로 처리할지 TTS API 작업 상황 보고 결정해야될거 같아요
          */}
        </div>
      </main>
    </div>
  );
}

export default HomePage;