import { Route, Routes } from "react-router-dom";
import HomePage from "../mainpage/HomePage/HomePage.jsx";
import StoryViewerPage from "../pages/StoryViewerPage/StoryViewerPage.jsx";

function MainRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/story" element={<StoryViewerPage />} />
    </Routes>
  );
}

export default MainRouter;
