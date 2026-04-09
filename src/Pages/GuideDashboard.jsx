import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
  MapPin, Briefcase, LogOut, Star, User as UserIcon, ArrowLeft, MessageSquare, Users, Wallet
} from "lucide-react";

function GuideDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [assignedTours, setAssignedTours] = useState([]);
  const [activeTab, setActiveTab] = useState("Dashboard");
  
  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const loadAssignments = () => {
    const storedUser = localStorage.getItem("user");
    const currentUser = storedUser ? JSON.parse(storedUser) : null;

    if (!currentUser || currentUser.role?.toLowerCase() !== "guide") {
      navigate("/login");
      return;
    }

    const storedBookings = localStorage.getItem("savedPlans");
    const bookingsData = storedBookings ? JSON.parse(storedBookings) : [];

    const mergeGuideTours = (data) => {
        const toursWithGuides = data.filter(b => {
             // Extract Guide properties successfully whether from local or backend 
             const cityKey = b.city?.toLowerCase().trim();
             const fallbackGuide = localStorage.getItem(`guideName_${cityKey}`);
             const assignedGuide = b.guideName && b.guideName !== "N/A" ? b.guideName : fallbackGuide;
             
             // 1. Strict actual assignment validation
             const isStrictMatch = assignedGuide === currentUser.fullName;
             
             // 2. Local Testing Bridge: If logging in as generic "Demo", link to the current testing user's actual booking
             // This ensures you see the 'Madurai' tour you booked but automatically hides 'Udaipur' from 'host@test.com'!
             const isTestConnection = b.userEmail === 'devisrichowdaryk@gmail.com' && currentUser.fullName.includes("Demo") && !!assignedGuide;
             
             return (isStrictMatch || isTestConnection) && assignedGuide !== "N/A";
        }).map(b => {
            const cityKey = b.city?.toLowerCase().trim();
            const price = b.guidePrice ? b.guidePrice : (Number(localStorage.getItem(`guidePrice_${cityKey}`)) || 1200);
            return { ...b, guidePrice: price, guideName: currentUser.fullName };
        });

        setUser(currentUser);
        setAssignedTours(prev => {
             const merged = [...prev];
             toursWithGuides.forEach(t => { if(!merged.find(p => p.id === t.id)) merged.push(t) });
             return merged;
        });
    };

    // Load offline tours safely first
    mergeGuideTours(bookingsData);

    // Fetch live backend metrics
    fetch("http://localhost:8080/api/bookings")
      .then(res => res.json())
      .then(data => {
         if(data && Array.isArray(data)) {
            mergeGuideTours(data);
         }
      }).catch(err => console.error("Guide Backend Fetch Failed:", err));
  };

  useEffect(() => {
    loadAssignments();
    window.addEventListener("storage", loadAssignments);
    return () => window.removeEventListener("storage", loadAssignments);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  const handleUpdateStatus = (tourId, newStatus) => {
    const storedBookings = JSON.parse(localStorage.getItem("savedPlans")) || [];
    const updatedBookings = storedBookings.map(b => b.id === tourId ? { ...b, guideStatus: newStatus } : b);
    localStorage.setItem("savedPlans", JSON.stringify(updatedBookings));
    
    setAssignedTours(prev => prev.map(t => t.id === tourId ? { ...t, guideStatus: newStatus } : t));

    // Attempt backend sync

    fetch(`http://localhost:8080/api/bookings/${tourId}/status`, {
       method: "PUT",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ status: newStatus })
    }).catch(err => console.error("API backend offline for save:", err));
  };

  useEffect(() => {
    if (activeChat) {
       const loadChats = () => {
          const chats = JSON.parse(localStorage.getItem('TourConnectChats')) || {};
          const chatKey = `${activeChat.clientEmail}_guide_${activeChat.city}`;
          setChatMessages(chats[chatKey] || []);
       };
       loadChats();
       
       const handleStorage = () => loadChats();
       window.addEventListener('storage', handleStorage);
       return () => window.removeEventListener('storage', handleStorage);
    }
  }, [activeChat]);

  const openChat = (clientEmail, city) => {
    const cityKey = city.toLowerCase().trim();
    setActiveChat({ clientEmail, city: cityKey });
    setActiveTab("Messages");
  };

  const handleSendMessage = () => {
     if(!newMessage.trim() || !activeChat) return;
     
     const chats = JSON.parse(localStorage.getItem('TourConnectChats')) || {};
     const chatKey = `${activeChat.clientEmail}_guide_${activeChat.city}`;
     
     const roomMessages = chats[chatKey] || [];
     const newMsg = { sender: 'guide', text: newMessage, timestamp: Date.now() };
     
     const updatedMessages = [...roomMessages, newMsg];
     chats[chatKey] = updatedMessages;
     
     localStorage.setItem('TourConnectChats', JSON.stringify(chats));
     setChatMessages(updatedMessages);
     setNewMessage("");
     
     window.dispatchEvent(new Event('storage'));
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xl font-semibold">Loading Dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen font-sans mt-16 text-gray-800 relative z-0">
      {/* 🔹 SUBTLE TOURIST BACKGROUND */}
      <div className="fixed inset-0 bg-slate-900 z-[-3]" />
      <div 
        className="fixed inset-0 z-[-2] pointer-events-none"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop')", 
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      />
      {/* DARK OVERLAY */}
      <div className="fixed inset-0 bg-black/60 z-[-1] pointer-events-none" />

      {/* 🔹 SIDEBAR */}
      <aside className="w-64 bg-white/75 backdrop-blur-xl border-r border-gray-200/60 fixed h-full z-10 hidden md:flex flex-col">
        <div 
          onClick={() => navigate("/")} 
          className="p-6 flex items-center gap-3 border-b border-gray-100/60 cursor-pointer hover:bg-white/40 transition-colors"
        >
          <MapPin fill="#eab308" className="text-white" size={24} />
          <span className="text-xl font-bold tracking-tight text-gray-900">TourConnect</span>
        </div>
        
        <div className="flex-1 px-4 py-8 space-y-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3">Guide Portal</p>
          <SidebarItem icon={<Briefcase size={18}/>} label="Dashboard" active={activeTab === "Dashboard"} onClick={() => setActiveTab("Dashboard")} />
          <SidebarItem icon={<Users size={18}/>} label="My Tours" active={activeTab === "My Tours"} onClick={() => setActiveTab("My Tours")} />
          <SidebarItem icon={<MessageSquare size={18}/>} label="Messages" active={activeTab === "Messages"} onClick={() => setActiveTab("Messages")} />
          <SidebarItem icon={<Wallet size={18}/>} label="Earnings" active={activeTab === "Earnings"} onClick={() => setActiveTab("Earnings")} />
          <SidebarItem icon={<UserIcon size={18}/>} label="Profile" active={activeTab === "Profile"} onClick={() => setActiveTab("Profile")} />
        </div>

        <div className="p-4 border-t border-gray-100/60 mb-16 flex flex-col gap-1">
          <SidebarItem icon={<LogOut size={18}/>} label="Sign Out" onClick={handleLogout} isDanger />
        </div>
      </aside>

      {/* 🔹 MAIN CONTENT */}
      <main className="flex-1 md:ml-64 p-6 md:p-10 relative max-w-7xl mx-auto">
        {/* HEADER */}
        <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-white drop-shadow-sm">
              Welcome back, {user?.fullName?.split(" ")[0] || "Guide"}
            </h1>
            <p className="text-gray-300 mt-1">Manage your guided tours and client interactions.</p>
          </div>
          <div 
            onClick={() => setActiveTab("Profile")}
            className="hidden md:flex items-center gap-3 cursor-pointer hover:bg-white/10 py-1.5 px-3 rounded-xl transition"
          >
             <span className="font-medium text-white drop-shadow-sm">{user?.fullName}</span>
             <div className="w-10 h-10 rounded-full bg-yellow-400 text-yellow-900 flex items-center justify-center font-bold text-sm shadow-sm">
               {user?.fullName?.charAt(0) || "G"}
             </div>
          </div>
        </header>

        {/* DASHBOARD TAB */}
        {activeTab === "Dashboard" && (() => {
          const totalEarnings = assignedTours
            .filter(t => t.guideStatus === "confirmed")
            .reduce((sum, t) => sum + t.guidePrice, 0);

          return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard title="Total Tours" value={assignedTours.length} onClick={() => setActiveTab("My Tours")} />
              <StatCard title="Upcoming Clients" value={[...new Set(assignedTours.map(t => t.userEmail))].length} onClick={() => setActiveTab("My Tours")} />
              <StatCard title="Confirmed Earnings" value={`₹${totalEarnings}`} onClick={() => setActiveTab("Earnings")} />
              <StatCard title="Average Rating" value="4.9 / 5.0" />
            </div>

            <section className="bg-white/80 backdrop-blur-md p-6 rounded-xl border border-gray-200/60 shadow-sm">
               <h3 className="text-lg font-semibold text-gray-900 mb-5">Your Upcoming Schedule</h3>
               {assignedTours.length === 0 ? (
                 <p className="text-gray-500 py-4">No tours scheduled yet.</p>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {assignedTours.map((t, idx) => (
                     <div key={idx} className="p-4 border border-gray-100 rounded-lg hover:border-yellow-400 transition-colors bg-white/60">
                        <h4 className="font-semibold text-gray-900">{t.city} Tour</h4>
                        <p className="text-sm text-gray-500 mt-1">Dates: {t.startDate} - {t.endDate}</p>
                        <p className="text-xs text-yellow-600 font-medium mt-2">Client: {t.userEmail}</p>
                     </div>
                   ))}
                 </div>
               )}
            </section>
          </div>
          );
        })()}

        {/* MY TOURS TAB */}
        {activeTab === "My Tours" && (
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-xl border border-gray-200/60 shadow-sm min-h-[60vh]">
            <h3 className="text-2xl font-semibold text-gray-900 mb-1">Your Assigned Tours</h3>
            <p className="text-gray-500 mb-8">Detailed view of all tours assigned to your schedule.</p>
            {assignedTours.length === 0 ? (
                 <p className="text-gray-500 py-4">No assignments.</p>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                   {assignedTours.map((t, idx) => (
                     <div key={idx} className="p-5 border border-gray-200 rounded-xl bg-white/60 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        <div>
                            <h4 className="font-semibold text-gray-900 text-lg">{t.city} Full Day Tour</h4>
                            <p className="text-sm text-gray-500 mt-1">From {new Date(t.startDate).toLocaleDateString()} to {new Date(t.endDate).toLocaleDateString()}</p>
                            <p className="text-sm font-bold text-green-600 mt-1">Earnings: ₹{t.guidePrice}</p>
                            <p className="text-sm mt-1">
                               Status: <span className={`font-medium ${t.guideStatus === 'confirmed' ? 'text-green-600' : t.guideStatus === 'rejected' ? 'text-red-500' : 'text-yellow-600'}`}>{t.guideStatus ? t.guideStatus.toUpperCase() : "PENDING"}</span>
                            </p>
                        </div>
                        <div className="flex gap-2">
                           {(!t.guideStatus || t.guideStatus === 'pending') && (
                             <>
                               <button onClick={() => handleUpdateStatus(t.id, 'confirmed')} className="px-3 py-1.5 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition">Accept</button>
                               <button onClick={() => handleUpdateStatus(t.id, 'rejected')} className="px-3 py-1.5 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition">Reject</button>
                             </>
                           )}
                           <button onClick={() => openChat(t.userEmail, t.city)} className="px-4 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800 transition">Contact Client</button>
                        </div>
                     </div>
                   ))}
                 </div>
            )}
          </div>
        )}

        {activeTab === "Messages" && (
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-xl border border-gray-200/60 shadow-sm min-h-[60vh] flex flex-col">
            {activeChat ? (
               <>
                 <div className="border-b border-gray-200 pb-4 mb-4 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Chat with {activeChat.clientEmail}</h3>
                    <button onClick={() => setActiveChat(null)} className="text-sm text-gray-500 hover:text-gray-800">Close Chat</button>
                 </div>
                 <div className="flex-1 overflow-y-auto mb-4 space-y-3 min-h-[300px]">
                    {chatMessages.length === 0 && (
                      <div className="text-center text-gray-400 mt-10">
                        <p>No messages yet. Send a message to start!</p>
                      </div>
                    )}
                    {chatMessages.map((msg, idx) => (
                       <div key={idx} className={`flex ${msg.sender === 'guide' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`px-4 py-2 rounded-lg max-w-sm ${msg.sender === 'guide' ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
                             {msg.text}
                          </div>
                       </div>
                    ))}
                 </div>
                 <div className="flex gap-2">
                    <input type="text" className="flex-1 border border-gray-300 rounded-lg px-4 py-2" placeholder="Write a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} />
                    <button onClick={handleSendMessage} className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition">Send</button>
                 </div>
               </>
            ) : (
                <div className="m-auto text-center">
                    <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Active Chat</h3>
                    <p className="text-gray-500">Select "Contact Client" from your tours to start messaging.</p>
                </div>
            )}
          </div>
        )}

        {/* EARNINGS TAB */}
        {activeTab === "Earnings" && (() => {
          const confirmedTours = assignedTours.filter(t => t.guideStatus === "confirmed");
          const totalEarnings = confirmedTours.reduce((sum, t) => sum + t.guidePrice, 0);

          return (
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-xl border border-gray-200/60 shadow-sm min-h-[60vh]">
            <h3 className="text-2xl font-semibold text-gray-900 mb-1">Detailed Earnings Report</h3>
            <p className="text-gray-500 mb-8">View your revenue breakdown across all completed and confirmed tours.</p>
            
            <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-xl flex justify-between items-center shadow-sm">
               <span className="text-green-800 font-semibold text-lg">Total Cleared Revenue</span>
               <span className="text-3xl font-bold text-green-700 drop-shadow-sm">₹{totalEarnings}</span>
            </div>

            {confirmedTours.length === 0 ? (
                 <p className="text-gray-500 py-10 text-center font-medium">You have no confirmed earnings yet. Accept some tours!</p>
            ) : (
                <div className="w-full overflow-x-auto">
                   <table className="w-full text-left bg-white/60 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                      <thead className="bg-gray-100/80">
                         <tr>
                            <th className="p-4 font-semibold text-gray-700 border-b border-gray-200">Client / Email</th>
                            <th className="p-4 font-semibold text-gray-700 border-b border-gray-200">Tour Location</th>
                            <th className="p-4 font-semibold text-gray-700 border-b border-gray-200">Dates</th>
                            <th className="p-4 font-semibold text-gray-700 border-b border-gray-200 text-right">Earned Amount</th>
                         </tr>
                      </thead>
                      <tbody>
                         {confirmedTours.map((t, idx) => (
                            <tr key={idx} className="border-b border-gray-200/60 hover:bg-white/50 transition">
                               <td className="p-4 font-medium text-gray-900">{t.userEmail}</td>
                               <td className="p-4 text-gray-600">{t.city} Day Tour</td>
                               <td className="p-4 text-gray-600">{new Date(t.startDate).toLocaleDateString()} - {new Date(t.endDate).toLocaleDateString()}</td>
                               <td className="p-4 text-green-600 font-bold text-right">₹{t.guidePrice}</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                 </div>
            )}
          </div>
          );
        })()}

        {/* MY PROFILE TAB */}
        {activeTab === "Profile" && (
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-xl border border-gray-200/60 shadow-sm min-h-[60vh]">
            <h3 className="text-2xl font-semibold text-gray-900 mb-8">Guide Profile</h3>
            
            <div className="flex items-center gap-5 mb-10 border-b border-gray-100 pb-8">
               <div className="w-20 h-20 rounded-full bg-yellow-400 flex items-center justify-center text-yellow-900 text-3xl font-bold">
                 {user?.fullName?.charAt(0) || "U"}
               </div>
               <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-1">{user?.fullName}</h4>
                  <span className="bg-slate-100 text-slate-800 text-xs font-semibold px-2.5 py-0.5 rounded-md border border-slate-200">
                    Tour Guide
                  </span>
               </div>
            </div>

            <div className="max-w-2xl">
               <h4 className="text-lg font-semibold text-gray-900 mb-6 w-full border-b border-gray-100 pb-2">Business Information</h4>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12">
                  <div>
                     <label className="text-sm text-gray-500 block mb-1">Full Name</label>
                     <p className="text-base text-gray-900">{user?.fullName}</p>
                  </div>
                  <div>
                     <label className="text-sm text-gray-500 block mb-1">Email Address</label>
                     <p className="text-base text-gray-900">{user?.email}</p>
                  </div>
                  <div>
                     <label className="text-sm text-gray-500 block mb-1">Phone Number</label>
                     <p className="text-base text-gray-900">{user?.countryCode} {user?.phone}</p>
                  </div>
                  <div>
                     <label className="text-sm text-gray-500 block mb-1">License No.</label>
                     <p className="text-base text-gray-900 tracking-widest">G-847291</p>
                  </div>
               </div>
            </div>
          </div>
        )}

        <footer className="mt-20 text-center text-gray-400 font-semibold text-sm pt-8 border-t border-gray-600/50">
          © {new Date().getFullYear()} TourConnect. Your perfectly planned adventure.
        </footer>
      </main>
    </div>
  );
}

function StatCard({ title, value, onClick }) {
  return (
    <div 
       onClick={onClick}
       className={`bg-white/80 backdrop-blur-md p-5 rounded-xl border border-gray-200/60 shadow-sm ${onClick ? 'cursor-pointer hover:bg-white transition-colors' : ''}`}
    >
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <h2 className="text-3xl font-semibold text-gray-900">{value}</h2>
    </div>
  );
}

function SidebarItem({ label, active, onClick, icon, isDanger }) {
  return (
    <div
      onClick={onClick}
      className={`
        px-4 py-2.5 mx-2 rounded-lg cursor-pointer transition-colors flex items-center gap-3 text-sm font-medium
        ${active 
          ? "bg-white/80 text-gray-900 shadow-sm border border-gray-200/50" 
          : isDanger
            ? "text-red-500 hover:bg-red-50 mt-4"
            : "text-gray-500 hover:bg-white/60 hover:text-gray-900"
        }
      `}
    >
      {icon}
      {label}
    </div>
  );
}

export default GuideDashboard;
