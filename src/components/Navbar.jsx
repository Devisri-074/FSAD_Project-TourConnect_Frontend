import { useNavigate, useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { MapPin, ArrowLeft } from "lucide-react"; // ✅ added ArrowLeft

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const lightPages = ["/plan", "/guide", "/touristdashboard", "/homestay"];
  const isLightPage = lightPages.includes(location.pathname);


  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    setUser(storedUser ? JSON.parse(storedUser) : null);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/", { replace: true });
  };

  const btn = {
    background: "transparent",
    border: "none",
    color: isLightPage ? "black" : "white",
    padding: "6px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    opacity: 0.9,
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 25px",
        background: isLightPage
          ? "transparent"
          : "rgba(0,0,0,0.0)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
        position: "fixed",
        width: "100%",
        top: 0,
        left: 0,
        zIndex: 1000,
      }}
    >
      {/* ✅ LEFT: BACK + LOGO */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>

        {/* 🔥 BACK BUTTON (hide on home) */}
        {location.pathname !== "/" && (
          <ArrowLeft
            size={20}
            style={{
              cursor: "pointer",
              color: isLightPage ? "black" : "white",
            }}
            onClick={() => navigate(-1)}
          />
        )}

        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: isLightPage ? "black" : "white",
            textDecoration: "none",
            fontSize: "18px",
            fontWeight: "600",
          }}
        >
          <MapPin size={20} />
          <span>TourConnect</span>
        </Link>
      </div>

      {/* ✅ RIGHT: BUTTONS */}
      <div style={{ display: "flex", gap: "35px" }}>
        <button style={btn} onClick={() => navigate("/about")}>
          About Us
        </button>

        {!user ? (
          <button style={btn} onClick={() => navigate("/login")}>
            Login
          </button>
        ) : (
          <>
            <button style={btn} onClick={() => navigate("/dashboard")}>
              Dashboard
            </button>
            <button style={btn} onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Navbar;