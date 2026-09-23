import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Header from "./components/Header";
import BottomNav from "./components/BottomNav";

import Home from "./pages/Home";
import WorkerList from "./pages/WorkerList";
import WorkerDetail from "./pages/WorkerDetail";
import MyWorks from "./pages/MyWorks";
import WorkerDashboard from "./pages/WorkerDashboard";
import AuthPage from "./pages/AuthPage";

export default function App() {
  const { currentUser, isLoading } = useAuth();

  // Loading state while restoring session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-orange-600 animate-pulse">
          LabourShaala
        </h1>
        <p className="text-xs text-gray-500 mt-2">Loading your account...</p>
      </div>
    );
  }

  // If no user is logged in, show Auth Page
  if (!currentUser) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-16">
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/workers" element={<WorkerList />} />
        <Route path="/worker/:id" element={<WorkerDetail />} />
        <Route path="/my-works" element={<MyWorks />} />
        <Route path="/worker-dashboard" element={<WorkerDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <BottomNav />
    </div>
  );
}
