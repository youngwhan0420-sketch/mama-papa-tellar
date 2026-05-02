import { Route, Routes } from "react-router-dom";
import HomePage from "../mainpage/HomePage/HomePage.jsx";
import FamilyVoicesViewPage from "../pages/FamilyVoicesViewPage/FamilyVoicesViewPage.jsx";
import StoryListViewPage from "../pages/StoryListViewPage/StoryListViewPage.jsx";
import StoryViewerPage from "../pages/StoryViewerPage/StoryViewerPage.jsx";
import WhoIsItViewPage from "../pages/WhoIsItViewPage/WhoIsItViewPage.jsx";

function MainRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/pages/FamilyVoicesViewPage" element={<FamilyVoicesViewPage />} />
      <Route path="/pages/StoryListViewPage" element={<StoryListViewPage />} />
      <Route path="/story/:storyId" element={<StoryViewerPage />} />
      <Route path="/pages/WhoIsItViewPage" element={<WhoIsItViewPage />} />
    </Routes>
  );
}

export default MainRouter;
