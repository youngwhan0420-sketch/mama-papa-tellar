import "./StorySlide.css";

function StorySlide({ page }) {
  return (
    <>
      <div className="illustration-card">
        <img
          className="illustration-image"
          src={page.image}
          alt="동화 이미지"
        />
      </div>

      <div className="story-text-card">
        <p>{page.text}</p>
      </div>
    </>
  );
}

export default StorySlide;
