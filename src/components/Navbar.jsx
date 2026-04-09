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
    background: "rgba(255, 255, 255, 0.05)",
    border: `1px solid ${isLightPage ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)"}`,
    color: isLightPage ? "black" : "white",
    padding: "8px 20px",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "500",
    transition: "all 0.3s ease",
    backdropFilter: "blur(5px)",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "15px 40px",
        background: isLightPage
          ? "rgba(255, 255, 255, 0.7)"
          : "rgba(0, 0, 0, 0.2)",
        backdropFilter: "blur(15px)",
        WebkitBackdropFilter: "blur(15px)",
        borderBottom: `1px solid ${isLightPage ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.1)"}`,
        position: "fixed",
        width: "100%",
        top: 0,
        left: 0,
        zIndex: 1000,
      }}
    >
      {/* ✅ LEFT: BACK + LOGO */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>

        {/* 🔥 BACK BUTTON (hide on home) */}
        {location.pathname !== "/" && (
          <div 
            onClick={() => navigate(-1)}
            style={{ 
              cursor: "pointer", 
              color: isLightPage ? "black" : "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
              transition: "background 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
            onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
          >
            <ArrowLeft size={18} />
          </div>
        )}

        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: isLightPage ? "#000" : "#fff",
            textDecoration: "none",
            fontSize: "22px",
            fontWeight: "700",
            letterSpacing: "-0.5px"
          }}
        >
          <div style={{ 
            background: "#f4b400", 
            padding: "6px", 
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <MapPin size={22} color="white" />
          </div>
          <span>TourConnect</span>
        </Link>
      </div>

      {/* ✅ RIGHT: BUTTONS */}
      <div style={{ display: "flex", gap: "20px" }}>
        <button 
          style={btn} 
          onClick={() => navigate("/about")}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.15)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          About Us
        </button>

        {!user ? (
          <button 
            style={{ ...btn, background: "#f4b400", borderColor: "#f4b400", color: "white", fontWeight: "600" }} 
            onClick={() => navigate("/login")}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#ffc107";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(244, 180, 0, 0.4)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#f4b400";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Login
          </button>
        ) : (
          <div style={{ display: "flex", gap: "12px" }}>
            <button 
              style={{ ...btn, border: "none" }} 
              onClick={() => {
                const role = user?.role?.toLowerCase();
                if (role === "admin") navigate("/admin-dashboard");
                else if (role === "guide") navigate("/guide-dashboard");
                else if (role === "host") navigate("/host-dashboard");
                else navigate("/dashboard");
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
              onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
            >
              Dashboard
            </button>
            <button 
              style={{ ...btn, color: "#ff4d4d", borderColor: "rgba(255,77,77,0.3)" }} 
              onClick={handleLogout}
              onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,77,77,0.1)"}
              onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Navbar;