import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import EmotionBar from "../../components/EmotionBar/EmotionBar.jsx";
import StoryNavigation from "../../components/StoryNavigation/StoryNavigation.jsx";
import StorySlide from "../../components/StorySlide/StorySlide.jsx";
import { mockStoryPages } from "../../data/story/mockStoryPages.js";
import "./StoryViewerPage.css";

function StoryViewerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const currentPage = mockStoryPages[currentPageIndex];
  const lastPageIndex = mockStoryPages.length - 1;
  const situation = location.state?.situation;

  const handlePrevPage = () => {
    if (currentPageIndex === 0) {
      return;
    }

    setCurrentPageIndex(currentPageIndex - 1);
  };

  const handleNextPage = () => {
    if (currentPageIndex === lastPageIndex) {
      return;
    }

    setCurrentPageIndex(currentPageIndex + 1);
  };

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="tablet-page">
      <main className="tablet-frame">
        <section className="storybook-section">
          <div className="storybook-header">
            <button className="home-button" onClick={handleGoHome}>
              처음으로
            </button>

            <p className="page-count">
              {currentPageIndex + 1} / {mockStoryPages.length}
            </p>
          </div>

          {situation && <p className="situation-summary">입력 상황: {situation}</p>}

          <StorySlide page={currentPage} />

          <EmotionBar
            emotion={currentPage.emotion}
            emotionLevel={currentPage.emotionLevel}
          />

          <StoryNavigation
            currentPageIndex={currentPageIndex}
            lastPageIndex={lastPageIndex}
            onPrev={handlePrevPage}
            onNext={handleNextPage}
          />
        </section>
      </main>
    </div>
  );
}

export default StoryViewerPage;
