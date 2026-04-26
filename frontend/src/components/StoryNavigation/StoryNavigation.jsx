import "./StoryNavigation.css";

function StoryNavigation({ currentPageIndex, lastPageIndex, onPrev, onNext }) {
  const isFirstPage = currentPageIndex === 0;
  const isLastPage = currentPageIndex === lastPageIndex;

  return (
    <div className="navigation-buttons">
      <button className="nav-button" onClick={onPrev} disabled={isFirstPage}>
        이전
      </button>

      <button className="nav-button" onClick={onNext} disabled={isLastPage}>
        다음
      </button>
    </div>
  );
}

export default StoryNavigation;
