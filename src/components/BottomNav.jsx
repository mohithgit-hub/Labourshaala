import { Home, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <footer className="fixed bottom-0 w-full bg-white border-t flex justify-around p-2">
      <button
        onClick={() => navigate("/")}
        className={`flex flex-col items-center ${
          location.pathname === "/" ? "text-orange-600" : "text-gray-500"
        }`}
      >
        <Home />
        <span className="text-xs">Customer</span>
      </button>

      <button
        onClick={() => navigate("/worker-dashboard")}
        className={`flex flex-col items-center ${
          location.pathname === "/worker-dashboard"
            ? "text-orange-600"
            : "text-gray-500"
        }`}
      >
        <User />
        <span className="text-xs">Worker</span>
      </button>
    </footer>
  );
}
