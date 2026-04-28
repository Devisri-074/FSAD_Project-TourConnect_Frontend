import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MapPin, Eye, EyeOff, Users, Shield } from "lucide-react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showCustomEmail, setShowCustomEmail] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [customGoogleName, setCustomGoogleName] = useState("");
  const [customGooglePassword, setCustomGooglePassword] = useState("");
  const [customGoogleStep, setCustomGoogleStep] = useState("email"); // "email" | "password"

  const handleGoogleLogin = () => {
    // 🚀 SHOW VISUAL SIMULATION
    setShowAccountPicker(true);
  };

  const loginWithGoogle = (fullName, email) => {
    const demoUser = {
      id: "google_" + Date.now(),
      fullName,
      email,
      role: "TOURIST",
      approvalStatus: "approved"
    };
    localStorage.setItem("user", JSON.stringify(demoUser));
    localStorage.setItem("token", "google-demo-token");
    const allUsers = JSON.parse(localStorage.getItem("users")) || [];
    if (!allUsers.find(u => u.email === email)) {
      allUsers.push({ fullName, email, role: "tourist", approvalStatus: "approved" });
      localStorage.setItem("users", JSON.stringify(allUsers));
    }
    setShowAccountPicker(false);
    setShowCustomEmail(false);
    alert(`Signed in as ${email}`);
    window.location.href = "/dashboard";
  };

  const selectDemoAccount = () => loginWithGoogle("DevisriChowdary Koya", "devisrichowdarykoya@gmail.com");

  const handleCustomGoogleEmailNext = () => {
    if (!customGoogleEmail.includes("@")) { alert("Enter a valid email"); return; }
    setCustomGoogleStep("password");
  };

  const handleCustomGoogleSubmit = () => {
    if (!customGooglePassword) { alert("Enter your password"); return; }
    const name = customGoogleName.trim() || customGoogleEmail.split("@")[0];
    loginWithGoogle(name, customGoogleEmail.trim());
  };

  const handleLogin = async (e) => {
  e.preventDefault();

  // ✅ ALWAYS seed default users before checking
  const defaultUsers = [
    { id: 1, fullName: "Admin Portal", email: "admin@test.com", password: "admin123", role: "admin", approvalStatus: "approved" },
    { id: 2, fullName: "Demo Host", email: "host@test.com", password: "host123", role: "host", approvalStatus: "approved" },
    { id: 3, fullName: "Demo Guide", email: "guide@test.com", password: "guide123", role: "guide", approvalStatus: "approved" }
  ];
  const existingUsers = JSON.parse(localStorage.getItem("users")) || [];
  // Always ensure defaults exist with correct passwords
  const merged = [...existingUsers.filter(u => !defaultUsers.find(d => d.email === u.email)), ...defaultUsers];
  localStorage.setItem("users", JSON.stringify(merged));
  const allUsers = merged;
  const localUser = allUsers.find(
    u => u.email?.toLowerCase().trim() === email.toLowerCase().trim() && u.password === password
  );

  // ✅ LOCAL FIRST — always works regardless of backend status
  if (localUser) {
    const userStatus = (localUser.approvalStatus || "approved").toLowerCase();
    const userRole = (localUser.role || "tourist").toLowerCase();

    if (userRole !== "tourist" && userRole !== "admin" && userStatus !== "approved") {
      alert(userStatus === "rejected" ? "Your account has been rejected by Admin." : "Your account is pending Admin approval.");
      return;
    }

    const roleMap = { admin: "ADMIN", tourist: "TOURIST", guide: "GUIDE", host: "HOST" };
    const mappedRole = roleMap[userRole] || "TOURIST";
    const userData = { ...localUser, id: localUser.id || Date.now(), fullName: localUser.fullName, name: localUser.fullName, role: mappedRole, approvalStatus: userStatus };
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", "local-token-" + Date.now());
    alert("Login Successful!");
    routeUser(mappedRole);
    return;
  }

  // ✅ ADMIN MAGIC BYPASS
  if (email.toLowerCase().startsWith("admin")) {
    const adminUser = { id: Date.now(), fullName: "Super Admin", email: email.toLowerCase(), role: "ADMIN" };
    localStorage.setItem("user", JSON.stringify(adminUser));
    localStorage.setItem("token", "dummy-jwt-token-for-admin-demo");
    alert("Admin Login Successful!");
    routeUser("ADMIN");
    return;
  }

  // ✅ BACKEND FALLBACK — only if not found locally
  try {
    const response = await fetch("https://fsad-tourconnect-backend.onrender.com/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data && data.id) {
      const userRole = (data.role || "TOURIST").toLowerCase();
      const userStatus = (data.approvalStatus || "approved").toLowerCase();

      if (userRole !== "tourist" && userRole !== "admin" && userStatus !== "approved") {
        alert(userStatus === "rejected" ? "Your account has been rejected by Admin." : "Your account is pending Admin approval.");
        return;
      }

      const userData = { ...data, fullName: data.name || data.fullName || "User" };
      localStorage.setItem("user", JSON.stringify(userData));
      if (data.token) localStorage.setItem("token", data.token);

      // Save to local users so next login works offline too
      const existing = JSON.parse(localStorage.getItem("users")) || [];
      if (!existing.find(u => u.email?.toLowerCase() === email.toLowerCase())) {
        existing.push({ ...userData, password, role: userRole });
        localStorage.setItem("users", JSON.stringify(existing));
      }

      alert("Login Successful!");
      routeUser(data.role || "TOURIST");
    } else {
      alert("Invalid credentials. Please check your email and password.");
    }
  } catch (error) {
    console.error(error);
    alert("Invalid credentials. Please check your email and password.");
  }
};

const routeUser = (role) => {
    const roleUpper = role.toUpperCase();
    
    // ✅ REDIRECT BACK IF 'FROM' STATE EXISTS
    if (location.state?.from && location.state.from !== "/") {
      if (roleUpper === "TOURIST") {
        navigate(location.state.from, { state: { city: location.state.city } });
        return;
      }
    }

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

const handleGoogleResponse = (response) => {
    // Placeholder for real GSI response if user configures Client ID later
    console.log("Real Google Response Received", response);
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
      {/* ✅ GOOGLE ACCOUNT PICKER SIMULATION MODAL */}
      {showAccountPicker && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{
            backgroundColor: 'white', width: '360px', borderRadius: '12px', padding: '24px',
            color: '#3c4043', textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
            animation: 'slideUp 0.3s ease-out'
          }}>
            <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" width="40" alt="G" style={{marginBottom:'10px'}} />
            <h3 style={{fontSize:'22px', fontWeight:'500', marginBottom:'5px'}}>Choose an account</h3>
            <p style={{fontSize:'14px', color:'#5f6368', marginBottom:'20px'}}>to continue to TourConnect</p>
            
            <div 
              onClick={selectDemoAccount}
              style={{
                display:'flex', alignItems:'center', gap:'12px', padding:'12px', 
                borderBottom:'1px solid #e8eaed', cursor:'pointer', textAlign:'left'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{width:'36px', height:'36px', backgroundColor:'#1a73e8', borderRadius:'50%', display:'flex', justifyContent:'center', alignItems:'center', color:'white', fontWeight:'bold'}}>D</div>
              <div>
                <p style={{fontSize:'14px', fontWeight:'500', margin:0}}>DevisriChowdary Koya</p>
                <p style={{fontSize:'12px', color:'#5f6368', margin:0}}>devisrichowdarykoya@gmail.com</p>
              </div>
            </div>

            <div 
              onClick={() => setShowCustomEmail(true)}
              style={{display:'flex', alignItems:'center', gap:'12px', padding:'12px', cursor:'pointer', textAlign:'left'}}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{width:'36px', height:'36px', border:'1px solid #e8eaed', borderRadius:'50%', display:'flex', justifyContent:'center', alignItems:'center'}}>
                <Users size={18} color="#5f6368" />
              </div>
              <p style={{fontSize:'14px', fontWeight:'500', margin:0}}>Use another account</p>
            </div>

            {showCustomEmail && customGoogleStep === "email" && (
              <div style={{marginTop:'12px', textAlign:'left'}}>
                <input
                  placeholder="Name (optional)"
                  value={customGoogleName}
                  onChange={e => setCustomGoogleName(e.target.value)}
                  style={{width:'100%', padding:'8px', marginBottom:'8px', borderRadius:'6px', border:'1px solid #e8eaed', fontSize:'13px', boxSizing:'border-box'}}
                />
                <input
                  placeholder="Email"
                  value={customGoogleEmail}
                  onChange={e => setCustomGoogleEmail(e.target.value)}
                  style={{width:'100%', padding:'8px', marginBottom:'8px', borderRadius:'6px', border:'1px solid #e8eaed', fontSize:'13px', boxSizing:'border-box'}}
                />
                <button onClick={handleCustomGoogleEmailNext} style={{width:'100%', padding:'8px', backgroundColor:'#1a73e8', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'13px'}}>Next</button>
              </div>
            )}

            {showCustomEmail && customGoogleStep === "password" && (
              <div style={{marginTop:'12px', textAlign:'left'}}>
                <p style={{fontSize:'13px', color:'#3c4043', marginBottom:'8px'}}>Welcome, <strong>{customGoogleName || customGoogleEmail.split("@")[0]}</strong></p>
                <p style={{fontSize:'12px', color:'#5f6368', marginBottom:'8px'}}>{customGoogleEmail}</p>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={customGooglePassword}
                  onChange={e => setCustomGooglePassword(e.target.value)}
                  style={{width:'100%', padding:'8px', marginBottom:'8px', borderRadius:'6px', border:'1px solid #e8eaed', fontSize:'13px', boxSizing:'border-box'}}
                />
                <div style={{display:'flex', gap:'8px'}}>
                  <button onClick={() => setCustomGoogleStep("email")} style={{flex:1, padding:'8px', backgroundColor:'white', color:'#1a73e8', border:'1px solid #e8eaed', borderRadius:'6px', cursor:'pointer', fontSize:'13px'}}>Back</button>
                  <button onClick={handleCustomGoogleSubmit} style={{flex:1, padding:'8px', backgroundColor:'#1a73e8', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'13px'}}>Sign in</button>
                </div>
              </div>
            )}

            <p style={{fontSize:'12px', color:'#5f6368', marginTop:'24px', textAlign:'left', lineHeight:'1.5'}}>
              To continue, Google will share your name, email address, and profile picture with TourConnect.
            </p>
            
            <button onClick={() => { setShowAccountPicker(false); setShowCustomEmail(false); setCustomGoogleStep("email"); setCustomGooglePassword(""); }} style={{marginTop:'20px', color:'#1a73e8', fontWeight:'500', background:'none', border:'none', cursor:'pointer'}}>Cancel</button>
          </div>
          <style>{`
            @keyframes slideUp {
              from { transform: translateY(30px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}
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
            width: "380px",
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

            {/* ✅ PROFESSIONAL DEMO GOOGLE BUTTON */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              style={{
                width: "100%",
                padding: "12px",
                background: "white",
                border: "none",
                borderRadius: "8px",
                color: "#1f2937",
                marginBottom: "15px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                fontWeight: "600",
                fontSize: "14px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}
            >
              <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" width="18" alt="G" />
              Sign in with Google
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