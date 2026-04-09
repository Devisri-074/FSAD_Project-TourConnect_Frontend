import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MapPin, Eye, EyeOff } from "lucide-react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
  e.preventDefault();

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data && data.id) {
      const allUsers = JSON.parse(localStorage.getItem("users")) || [];
      const localUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

      // ✅ CHECK APPROVAL STATUS
      const userRole = (data.role || localUser?.role || "TOURIST").toLowerCase();
      const userStatus = data.approvalStatus || localUser?.approvalStatus || "approved";

      if (userRole !== "tourist" && userRole !== "admin" && userStatus !== "approved") {
        alert(userStatus === "rejected" ? "Your account has been rejected by Admin." : "Your account is pending Admin approval.");
        return;
      }

      localStorage.setItem("user", JSON.stringify({
        ...data,
        fullName: data.name || localUser?.fullName || "User",
        phone: data.phone || localUser?.phone || "",
        countryCode: data.countryCode || localUser?.countryCode || "+91"
      }));

      alert("Login Successful!");
      routeUser(data.role || (localUser ? localUser.role : "TOURIST"));
    } else {
      // BACKEND RETURNED NO ID OR UNAUTHORIZED -> Before rejecting, check local demo accounts!
      const allUsers = JSON.parse(localStorage.getItem("users")) || [];
      const localUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      
      if (localUser) {
         // ✅ CHECK APPROVAL STATUS
         if (localUser.role !== "tourist" && localUser.role !== "admin" && localUser.approvalStatus !== "approved") {
            alert(localUser.approvalStatus === "rejected" ? "Your account has been rejected by Admin." : "Your account is pending Admin approval.");
            return;
         }

         const roleMap = { admin: "ADMIN", tourist: "TOURIST", guide: "GUIDE", host: "HOST" };
         const userRoleMapping = roleMap[localUser.role.toLowerCase()] || "TOURIST";
         const fakeData = { 
           ...localUser, 
           id: localUser.id || Date.now(), 
           name: localUser.fullName, 
           role: userRoleMapping 
         };
         localStorage.setItem("user", JSON.stringify(fakeData));
         alert("Login Successful! (Offline/Local Sync Mode)");
         routeUser(userRoleMapping);
      } else if (email.toLowerCase().startsWith("admin")) {
         // MAGIC ADMIN OVERRIDE FOR PRESENTATIONS
         const adminUser = { id: Date.now(), fullName: "Super Admin", email: email.toLowerCase(), role: "ADMIN" };
         localStorage.setItem("user", JSON.stringify(adminUser));
         alert("Admin Master Bypass Successful!");
         routeUser("ADMIN");
      } else {
         alert("Invalid credentials");
      }
    }

  } catch (error) {
    console.error(error);
    // FALLBACK for offline demo mode
    const allUsers = JSON.parse(localStorage.getItem("users")) || [];
    const localUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    
    if (localUser) {
       // ✅ CHECK APPROVAL STATUS
       if (localUser.role !== "tourist" && localUser.role !== "admin" && localUser.approvalStatus !== "approved") {
          alert(localUser.approvalStatus === "rejected" ? "Your account has been rejected by Admin." : "Your account is pending Admin approval.");
          return;
       }

       const roleMap = { admin: "ADMIN", tourist: "TOURIST", guide: "GUIDE", host: "HOST" };
       const userRoleMapping = roleMap[localUser.role.toLowerCase()] || "TOURIST";
       const fakeData = { 
         ...localUser, 
         id: localUser.id || Date.now(), 
         name: localUser.fullName, 
         role: userRoleMapping 
       };
       localStorage.setItem("user", JSON.stringify(fakeData));
       alert("Login Successful! (Offline Mode)");
       routeUser(userRoleMapping);
    } else if (email.toLowerCase().startsWith("admin")) {
         // MAGIC ADMIN OVERRIDE FOR PRESENTATIONS
         const adminUser = { id: Date.now(), fullName: "Super Admin", email: email.toLowerCase(), role: "ADMIN" };
         localStorage.setItem("user", JSON.stringify(adminUser));
         alert("Admin Master Bypass Successful!");
         routeUser("ADMIN");
    } else {
       alert("Something went wrong or Invalid Credentials (Offline)");
    }
  }
};

const routeUser = (role) => {
    const roleUpper = role.toUpperCase();
    if (roleUpper === "ADMIN") {
      navigate("/admin-dashboard");
    } else if (roleUpper === "TOURIST") {
      navigate("/dashboard");
    } else if (roleUpper === "GUIDE") {
      navigate("/guide-dashboard");
    } else if (roleUpper === "HOST") {
      navigate("/host-dashboard");
    } else {
      navigate("/dashboard");
    }
};

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        position: "relative",
        overflow: "hidden",
        color: "white",
      }}
    >
      <img
        src="https://picsum.photos/1920/1080"
        alt="bg"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.45)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "350px",
            padding: "30px",
            borderRadius: "15px",
            background: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.2)",
            textAlign: "center",
          }}
        >
          <MapPin size={40} style={{ marginBottom: "10px" }} />

          <h2 style={{ marginBottom: "5px" }}>Login to TourConnect</h2>
          <p style={{ fontSize: "14px", opacity: 0.8, marginBottom: "20px" }}>
            Enter your credentials to access your account
          </p>

          <form onSubmit={handleLogin}>
            <div style={{ textAlign: "left", marginBottom: "10px" }}>
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  marginTop: "5px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.3)",
                  background: "rgba(255,255,255,0.1)",
                  color: "white",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "14px",
                  marginBottom: "5px",
                }}
              >
                <label>Password</label>
                <span 
                  onClick={() => navigate("/forgot-password")}
                  style={{ cursor: "pointer", textDecoration: "underline", color: "#f4b400" }}
                >
                  Forgot password?
                </span>
              </div>

              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 40px 10px 10px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.3)",
                    background: "rgba(255,255,255,0.1)",
                    color: "white",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "#f4b400",
                border: "none",
                borderRadius: "8px",
                color: "white",
                fontWeight: "bold",
                marginBottom: "10px",
                cursor: "pointer",
              }}
            >
              Login
            </button>

            <button
              type="button"
              style={{
                width: "100%",
                padding: "10px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.5)",
                borderRadius: "8px",
                color: "white",
                marginBottom: "15px",
                cursor: "pointer",
              }}
            >
              Login with Google
            </button>
            
          </form>

          <p style={{ fontSize: "14px" }}>
            Don't have an account?{" "}
            <Link
              to="/signup"
              state={{ from: location.state?.from || "/" }}
              style={{ color: "#f4b400" }}
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;