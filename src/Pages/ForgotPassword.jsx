import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, ArrowLeft, MailCheck, ShieldCheck } from "lucide-react";

function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
        const res = await fetch(`http://localhost:8080/api/auth/send-otp?email=${encodeURIComponent(email)}`, { method: "POST" });
        if (res.ok) {
           setStep(2);
        } else {
           const errText = await res.text();
           alert("Error sending OTP: " + errText);
        }
    } catch (err) {
        console.error(err);
        alert("Cannot reach backend server. Make sure STS is running on port 8080.");
    } finally {
        setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
        const res = await fetch(`http://localhost:8080/api/auth/verify-otp?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`, { method: "POST" });
        const text = await res.text();
        
        if (res.ok && text.includes("verified")) {
           setStep(3);
        } else {
           alert("Invalid OTP! " + text);
        }
    } catch (err) {
        console.error(err);
        alert("Cannot reach backend server to verify OTP.");
    } finally {
        setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
       alert("Passwords do not match!");
       return;
    }
    
    setLoading(true);
    try {
        // Live Backend Sync
        const res = await fetch(`http://localhost:8080/api/auth/reset-password?email=${encodeURIComponent(email)}&newPassword=${encodeURIComponent(newPassword)}`, { method: "POST" });
        
        if (res.ok) {
            // Also securely sync to offline local storage to ensure demo resilience
            const allUsers = JSON.parse(localStorage.getItem("users")) || [];
            const updatedUsers = allUsers.map(u => 
                u.email.toLowerCase() === email.toLowerCase() ? { ...u, password: newPassword } : u
            );
            localStorage.setItem("users", JSON.stringify(updatedUsers));

            alert("Password reset successfully! You can now login.");
            navigate("/login");
        } else {
            alert("Failed to reset password in Database.");
        }
    } catch (err) {
        console.error(err);
        alert("Could not reach backend to save the new password.");
    } finally {
        setLoading(false);
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
        src="https://picsum.photos/1920/1080?random=2"
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
          backgroundColor: "rgba(0,0,0,0.65)",
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
            padding: "40px 30px",
            borderRadius: "15px",
            background: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.2)",
            textAlign: "center",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
             <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(244, 180, 0, 0.2)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', border: '1px solid rgba(244, 180, 0, 0.5)' }}>
               {step === 1 ? <KeyRound size={28} color="#f4b400" /> : step === 2 ? <MailCheck size={28} color="#f4b400" /> : <ShieldCheck size={28} color="#f4b400" />}
             </div>
          </div>

          <h2 style={{ marginBottom: "10px", fontSize: "24px", fontWeight: "600" }}>
             {step === 1 ? "Reset Password" : step === 2 ? "Verify OTP" : "New Password"}
          </h2>
          
          {/* STEP 1: EMAIL */}
          {step === 1 && (
             <>
               <p style={{ fontSize: "14px", opacity: 0.8, marginBottom: "25px", lineHeight: "1.5" }}>
                 Enter the email address associated with your TourConnect account to receive an OTP.
               </p>

               <form onSubmit={handleEmailSubmit}>
                 <div style={{ textAlign: "left", marginBottom: "20px" }}>
                   <label style={{ fontSize: "14px", fontWeight: "500", marginLeft: "2px" }}>Email Address</label>
                   <input
                     type="email"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     required
                     placeholder="Enter your email"
                     style={{
                       width: "100%",
                       padding: "12px 15px",
                       marginTop: "8px",
                       borderRadius: "10px",
                       border: "1px solid rgba(255,255,255,0.3)",
                       background: "rgba(0,0,0,0.2)",
                       color: "white",
                       outline: "none",
                       transition: "all 0.3s"
                     }}
                   />
                 </div>

                 <button
                   type="submit"
                   style={{
                     width: "100%",
                     padding: "12px",
                     backgroundColor: "#f4b400",
                     border: "none",
                     borderRadius: "10px",
                     color: "#1a1a1a",
                     fontWeight: "bold",
                     fontSize: "15px",
                     cursor: "pointer",
                     transition: "background 0.3s",
                     marginBottom: "20px"
                   }}
                 >
                   Generate OTP
                 </button>
               </form>
             </>
          )}

          {/* STEP 2: OTP */}
          {step === 2 && (
             <>
               <p style={{ fontSize: "14px", opacity: 0.8, marginBottom: "25px", lineHeight: "1.5" }}>
                 We've sent a 6-digit code to <strong>{email}</strong>. Enter it below to verify your identity.
               </p>

               <form onSubmit={handleOtpSubmit}>
                 <div style={{ textAlign: "left", marginBottom: "20px" }}>
                   <label style={{ fontSize: "14px", fontWeight: "500", marginLeft: "2px" }}>One-Time Password</label>
                   <input
                     type="text"
                     maxLength="6"
                     value={otp}
                     onChange={(e) => setOtp(e.target.value)}
                     required
                     placeholder="e.g. 123456"
                     style={{
                       width: "100%",
                       padding: "12px 15px",
                       marginTop: "8px",
                       borderRadius: "10px",
                       border: "1px solid rgba(255,255,255,0.3)",
                       background: "rgba(0,0,0,0.2)",
                       color: "white",
                       outline: "none",
                       letterSpacing: "4px",
                       textAlign: "center",
                       fontSize: "18px",
                       transition: "all 0.3s"
                     }}
                   />
                 </div>

                 <button
                   type="submit"
                   style={{
                     width: "100%",
                     padding: "12px",
                     backgroundColor: "#f4b400",
                     border: "none",
                     borderRadius: "10px",
                     color: "#1a1a1a",
                     fontWeight: "bold",
                     fontSize: "15px",
                     cursor: "pointer",
                     marginBottom: "20px"
                   }}
                 >
                   Verify Code
                 </button>
               </form>
             </>
          )}

          {/* STEP 3: NEW PASSWORD */}
          {step === 3 && (
             <>
               <p style={{ fontSize: "14px", opacity: 0.8, marginBottom: "25px", lineHeight: "1.5" }}>
                 OTP verified! Please create a new secure password for your account.
               </p>

               <form onSubmit={handlePasswordSubmit}>
                 <div style={{ textAlign: "left", marginBottom: "15px" }}>
                   <label style={{ fontSize: "14px", fontWeight: "500", marginLeft: "2px" }}>New Password</label>
                   <input
                     type="password"
                     value={newPassword}
                     onChange={(e) => setNewPassword(e.target.value)}
                     required
                     placeholder="Enter new password"
                     style={{
                       width: "100%",
                       padding: "12px 15px",
                       marginTop: "5px",
                       borderRadius: "10px",
                       border: "1px solid rgba(255,255,255,0.3)",
                       background: "rgba(0,0,0,0.2)",
                       color: "white",
                       outline: "none",
                     }}
                   />
                 </div>
                 
                 <div style={{ textAlign: "left", marginBottom: "20px" }}>
                   <label style={{ fontSize: "14px", fontWeight: "500", marginLeft: "2px" }}>Confirm Password</label>
                   <input
                     type="password"
                     value={confirmPassword}
                     onChange={(e) => setConfirmPassword(e.target.value)}
                     required
                     placeholder="Confirm new password"
                     style={{
                       width: "100%",
                       padding: "12px 15px",
                       marginTop: "5px",
                       borderRadius: "10px",
                       border: "1px solid rgba(255,255,255,0.3)",
                       background: "rgba(0,0,0,0.2)",
                       color: "white",
                       outline: "none",
                     }}
                   />
                 </div>

                 <button
                   type="submit"
                   style={{
                     width: "100%",
                     padding: "12px",
                     backgroundColor: "#4ade80",
                     border: "none",
                     borderRadius: "10px",
                     color: "#064e3b",
                     fontWeight: "bold",
                     fontSize: "15px",
                     cursor: "pointer",
                     marginBottom: "20px"
                   }}
                 >
                   Save & Login
                 </button>
               </form>
             </>
          )}

          <div style={{ display: "flex", justifyContent: "center" }}>
            <button 
                onClick={() => {
                   if (step > 1) setStep(step - 1);
                   else navigate("/login");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "white",
                  opacity: 0.8,
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                }}
            >
               <ArrowLeft size={16} /> {step > 1 ? "Go Back" : "Back to Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
