import { Route, Routes } from "react-router-dom";
import HomePage from "../mainpage/HomePage/HomePage.jsx";
import FamilyVoicesViewPage from "../pages/FamilyVoicesViewPage/FamilyVoicesViewPage.jsx";
import StoryListViewPage from "../pages/StoryListViewPage/StoryListViewPage.jsx";
import StorySearchPage from "../pages/StorySearchPage/StorySearchPage.jsx";
import StoryViewerPage from "../pages/StoryViewerPage/StoryViewerPage.jsx";
import WhoIsItViewPage from "../pages/WhoIsItViewPage/WhoIsItViewPage.jsx";
import RecentStoriesPage from "../pages/RecentStoriesPage/RecentStoriesPage.jsx";


function MainRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/pages/FamilyVoicesViewPage" element={<FamilyVoicesViewPage />} />
      <Route path="/pages/StoryListViewPage" element={<StoryListViewPage />} />
      <Route path="/story/:storyId" element={<StoryViewerPage />} />
      <Route path="/story/search" element={<StorySearchPage />} />
      <Route path="/pages/WhoIsItViewPage" element={<WhoIsItViewPage />} /> 
      <Route path="/recent-stories" element={<RecentStoriesPage />} />
    </Routes>
  );
}

export default MainRouter;
