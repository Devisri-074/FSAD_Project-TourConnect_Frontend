import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Eye, EyeOff, Users } from "lucide-react";

function Signup() {
  const navigate = useNavigate();
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showCustomEmail, setShowCustomEmail] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [customGoogleName, setCustomGoogleName] = useState("");
  const [customGooglePassword, setCustomGooglePassword] = useState("");
  const [customGoogleStep, setCustomGoogleStep] = useState("email"); // "email" | "password"

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    countryCode: "+91",
    role: "tourist", 
    city: "Hyderabad", // ✅ ADDED
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (form.password !== form.confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  const roleNeedsApproval = form.role.toLowerCase() === "guide" || form.role.toLowerCase() === "host";
  const searchEmail = form.email.trim().toLowerCase();

  const existingUsers = JSON.parse(localStorage.getItem("users")) || [];
  
  // ✅ PREVENT DUPLICATE EMAILS
  const isDuplicate = existingUsers.some(u => u.email && u.email.trim().toLowerCase() === searchEmail);
  if (isDuplicate) {
    alert("An account with this email already exists! Please use a different email or Login.");
    return;
  }
  const newUser = {
    fullName: form.fullName,
    email: form.email.trim(),
    phone: form.phone,
    countryCode: form.countryCode,
    password: form.password,
    role: form.role.toLowerCase(),
    city: form.role === "tourist" ? "N/A" : form.city, // ✅ STORE CITY
    approvalStatus: roleNeedsApproval ? "pending" : "approved",
    approved: !roleNeedsApproval,
    id: Date.now() // Mock ID for offline mode
  };

  try {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: form.fullName,
        email: form.email.trim(),
        password: form.password,
        role: form.role.toUpperCase(),
      }),
    });

    if (response.ok) {
      localStorage.setItem("users", JSON.stringify([...existingUsers, newUser]));
      if (roleNeedsApproval) {
        alert("Registration request sent to Admin! You can log in once approved.");
      } else {
        alert("Signup successful!");
      }
      navigate("/login");
    } else {
      // ✅ LOCAL FALLBACK if backend returns error
      console.warn("Backend signup failed, falling back to local storage.");
      localStorage.setItem("users", JSON.stringify([...existingUsers, newUser]));
      if (roleNeedsApproval) {
        alert("Registration request sent to Admin (Local Mode)! You can log in once approved.");
      } else {
        alert("Signup successful! (Local Mode)");
      }
      navigate("/login");
    }
  } catch (error) {
    console.error(error);
    // FALLBACK for offline demo mode
    localStorage.setItem("users", JSON.stringify([...existingUsers, newUser]));
    if (roleNeedsApproval) {
      alert("Registration request sent to Admin (Offline Mode)! You can log in once approved.");
    } else {
      alert("Signup successful! (Offline Mode)");
    }
    navigate("/login");
  }
};

  const handleGoogleLogin = () => {
    // 🚀 SHOW VISUAL SIMULATION
    setShowAccountPicker(true);
  };

  const loginWithGoogle = (fullName, email) => {
    const googleUser = {
      id: "google_" + Date.now(),
      fullName,
      email,
      role: "TOURIST",
      approvalStatus: "approved"
    };
    localStorage.setItem("user", JSON.stringify(googleUser));
    const allUsers = JSON.parse(localStorage.getItem("users")) || [];
    if (!allUsers.find(u => u.email === email)) {
      allUsers.push({ fullName, email, role: "tourist", approvalStatus: "approved" });
      localStorage.setItem("users", JSON.stringify(allUsers));
    }
    setShowAccountPicker(false);
    setShowCustomEmail(false);
    alert("Signed up & Logged in via Google successfully!");
    navigate("/dashboard");
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

  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        color: "white",
        overflow: "hidden",
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
          background: "rgba(0,0,0,0.45)",
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
            width: "400px",
            padding: "30px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <MapPin size={40} />
            <h2 style={{ marginTop: "10px" }}>Create an account</h2>
            <p style={{ fontSize: "14px", opacity: 0.8 }}>
              Enter your information to get started
            </p>
          </div>
          

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "12px" }}>
              <label>Full name</label>
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label>Email</label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label>Phone Number</label>

              <div style={{ display: "flex", gap: "8px" }}>
                <select
                  name="countryCode"
                  value={form.countryCode}
                  onChange={handleChange}
                  style={{ ...inputStyle, width: "110px" }}
                >
                  <option value="+91">IN (+91)</option>
                  <option value="+1">US (+1)</option>
                </select>

                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>
            </div>
            

            {/* ✅ ROLE DROPDOWN */}
            <div style={{ marginBottom: "12px" }}>
              <label>Select Role</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="tourist">Tourist 🧳</option>
                <option value="guide">Guide 👨‍🏫</option>
                <option value="host">Host 🏡</option>
              </select>
              {(form.role === "guide" || form.role === "host") && (
                <p style={{ fontSize: "11px", color: "#f4b400", marginTop: "4px", opacity: 0.9 }}>
                  * This role requires manual Admin approval before you can access your dashboard.
                </p>
              )}
            </div>

            {/* ✅ CITY/AREA field for Guides/Hosts */}
            {(form.role === "guide" || form.role === "host") && (
              <div style={{ marginBottom: "12px" }}>
                <label>Operating City / Area</label>
                <select
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  {(JSON.parse(localStorage.getItem("availableCities")) || ["Hyderabad", "Warangal", "Mysore", "Chennai", "Madurai", "Jaipur", "Udaipur", "Mumbai", "Pune", "Delhi", "Bangalore", "Goa", "Kochi", "Munnar", "Kolkata", "Manali", "Shimla"]).sort().map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ marginBottom: "12px" }}>
              <label>Password</label>

              <div style={{ position: "relative" }}>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  style={{ ...inputStyle, paddingRight: "40px" }}
                />

                <span
                  onClick={() => setShowPassword(!showPassword)}
                  style={eyeStyle}
                >
                  {showPassword ? <Eye /> : <EyeOff />}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label>Confirm Password</label>

              <div style={{ position: "relative" }}>
                <input
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  style={{ ...inputStyle, paddingRight: "40px" }}
                />

                <span
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={eyeStyle}
                >
                  {showConfirm ? <Eye /> : <EyeOff />}
                </span>
              </div>
            </div>

            <button style={btnStyle}>Create an account</button>

            <button type="button" onClick={handleGoogleLogin} style={outlineBtn}>
              Sign up with Google
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "10px" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#f4b400" }}>
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "5px",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.3)",
  background: "rgba(255,255,255,0.1)",
  color: "white",
};

const eyeStyle = {
  position: "absolute",
  right: "10px",
  top: "50%",
  transform: "translateY(-50%)",
  cursor: "pointer",
};

const btnStyle = {
  width: "100%",
  padding: "10px",
  backgroundColor: "#f4b400",
  border: "none",
  borderRadius: "8px",
  color: "white",
  marginBottom: "10px",
  cursor: "pointer",
};

const outlineBtn = {
  width: "100%",
  padding: "10px",
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.5)",
  borderRadius: "8px",
  color: "white",
  cursor: "pointer",
};

export default Signup;