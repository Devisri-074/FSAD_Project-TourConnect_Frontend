import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  MapPin, Compass, Briefcase, LogOut, Ticket, 
  CheckCircle, Clock, Map as MapIcon, Home as HomeIcon, Star, X, User as UserIcon, SearchX, ArrowLeft, MessageSquare
} from "lucide-react";

function TouristDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [modalTitle, setModalTitle] = useState("");
  const [filteredBookings, setFilteredBookings] = useState(null);

  const userCities = [...new Set(bookings.map(b => b.city.toLowerCase().trim()))];
  
  const hiredGuides = bookings
    .filter(b => b.guideName && b.guideName !== "N/A")
    .map(b => ({
      city: b.city,
      name: b.guideName
    }));

  const bookedStays = bookings
    .filter(b => b.homestayName && b.homestayName !== "N/A")
    .map(b => ({
      city: b.city,
      name: b.homestayName,
      status: b.homestayStatus || "pending"
    }));

  const openModal = (title, filterFn) => {
    setModalTitle(title);
    setFilteredBookings(bookings.filter(filterFn));
  };

  const closeModal = () => {
    setFilteredBookings(null);
  };

  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileData, setProfileData] = useState({ fullName: "", phone: "", bio: "" });

  useEffect(() => {
    if (activeChat && user) {
       const loadChats = () => {
          const chats = JSON.parse(localStorage.getItem('TourConnectChats')) || {};
          const chatKey = `${user.email}_${activeChat.type}_${activeChat.city}`;
          setChatMessages(chats[chatKey] || []);
       };
       loadChats();
       
       const handleStorage = () => loadChats();
       window.addEventListener('storage', handleStorage);
       return () => window.removeEventListener('storage', handleStorage);
    }
  }, [activeChat, user]);

  const openChat = (name, city, type) => {
    const cityKey = city?.toLowerCase().trim();
    setActiveChat({ name, city: cityKey, type });
    setActiveTab("Messages");
  };

  const handleSendMessage = () => {
     if(!newMessage.trim() || !activeChat || !user) return;
     
     const chats = JSON.parse(localStorage.getItem('TourConnectChats')) || {};
     const chatKey = `${user.email}_${activeChat.type}_${activeChat.city}`;
     
     const roomMessages = chats[chatKey] || [];
     const newMsg = { sender: 'tourist', text: newMessage, timestamp: Date.now() };
     
     const updatedMessages = [...roomMessages, newMsg];
     chats[chatKey] = updatedMessages;
     
     localStorage.setItem('TourConnectChats', JSON.stringify(chats));
     setChatMessages(updatedMessages);
     setNewMessage("");
     
     window.dispatchEvent(new Event('storage'));
  };

  useEffect(() => {
    // 🚀 SYNC SESSION WITH BACKEND (FOR GOOGLE LOGIN SUCCESS)
    const checkSession = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("user", JSON.stringify(data));
          setUser(data);
          loadBookings(data);
        } else {
          throw new Error("No session");
        }
      } catch (err) {
        const storedUser = localStorage.getItem("user");
        if (!storedUser || storedUser === "null") {
          navigate("/login");
        } else {
          const currentUser = JSON.parse(storedUser);
          setUser(currentUser);
          loadBookings(currentUser);
        }
      }
    };

    const loadBookings = (currentUser) => {
      if (!currentUser || !currentUser.email) return;
      
      // Sync profile data state
      setProfileData({
        fullName: currentUser.fullName || "",
        phone: currentUser.phone || "",
        bio: currentUser.bio || "Passionate traveler looking to explore the hidden gems of India."
      });

      const storedBookings = localStorage.getItem("savedPlans");
      const bookingsData = storedBookings ? JSON.parse(storedBookings) : [];

      const computeOverallStatus = (b) => {
        const hasGuide = b.guideName && b.guideName !== "N/A";
        const hasHomestay = b.homestayName && b.homestayName !== "N/A";
        if (!hasGuide && !hasHomestay) return "pending";
        let gStatus = hasGuide ? (b.guideStatus?.toLowerCase() || "pending") : "confirmed";
        let hStatus = hasHomestay ? (b.homestayStatus?.toLowerCase() || "pending") : "confirmed";
        if (gStatus === "rejected" || hStatus === "rejected") return "rejected";
        if (gStatus === "confirmed" && hStatus === "confirmed") return "confirmed";
        return "pending";
      };

      const userBookings = bookingsData.filter((b) => {
        if (!b.userEmail) return false;
        return b.userEmail.toLowerCase().trim() === currentUser.email.toLowerCase().trim();
      }).map(b => ({ ...b, status: computeOverallStatus(b) }));

      setBookings(userBookings);

      // Backend Fetch
      fetch(`http://localhost:8080/api/bookings/user/${currentUser.email}`, { credentials: "include" })
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          if (data && data.length > 0) {
            setBookings(prev => {
              const backendData = data.map(d => {
                const localMatch = prev.find(p => p.city?.toLowerCase() === d.city?.toLowerCase());
                const result = { ...d, status: computeOverallStatus(d) };
                return result;
              });
              return backendData;
            });
          }
        }).catch(() => {});
    };

    checkSession();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  const handleSaveProfile = () => {
    const updatedUser = { ...user, ...profileData };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    setShowEditProfile(false);
    
    // Optional: Sync with backend if API exists
    fetch("http://localhost:8080/api/users/update", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedUser)
    }).catch(() => {});
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
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3">Main Menu</p>
          <SidebarItem icon={<Briefcase size={18}/>} label="Dashboard" active={activeTab === "Dashboard"} onClick={() => setActiveTab("Dashboard")} />
          <SidebarItem icon={<HomeIcon size={18}/>} label="My Stays" active={activeTab === "My Stays"} onClick={() => setActiveTab("My Stays")} />
          <SidebarItem icon={<Star size={18}/>} label="My Guides" active={activeTab === "My Guide Bookings"} onClick={() => setActiveTab("My Guide Bookings")} />
          <SidebarItem icon={<MessageSquare size={18}/>} label="Messages" active={activeTab === "Messages"} onClick={() => setActiveTab("Messages")} />
          <SidebarItem icon={<UserIcon size={18}/>} label="Profile" active={activeTab === "Profile"} onClick={() => setActiveTab("Profile")} />
        </div>

        <div className="p-4 border-t border-gray-100/60 mb-16 flex flex-col gap-1">
          <SidebarItem icon={<ArrowLeft size={18}/>} label="Back to Home" onClick={() => navigate("/")} />
          <SidebarItem icon={<LogOut size={18}/>} label="Sign Out" onClick={handleLogout} isDanger />
        </div>
      </aside>

      {/* 🔹 MAIN CONTENT */}
      <main className="flex-1 md:ml-64 p-6 md:p-10 relative max-w-7xl mx-auto">
        {/* HEADER */}
        <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-white drop-shadow-sm">
              Welcome back, {user?.fullName?.split(" ")[0] || "User"}
            </h1>
            <p className="text-gray-300 mt-1">Here is the overview of your travel plans.</p>
          </div>
          <div 
            onClick={() => setActiveTab("Profile")}
            className="hidden md:flex items-center gap-3 cursor-pointer hover:bg-white/10 py-1.5 px-3 rounded-xl transition"
          >
             <span className="font-medium text-white drop-shadow-sm">{user?.fullName}</span>
             <div className="w-10 h-10 rounded-full bg-yellow-400 text-yellow-900 flex items-center justify-center font-bold text-sm shadow-sm">
               {user?.fullName?.charAt(0) || "U"}
             </div>
          </div>
        </header>

        {activeTab === "Dashboard" && (
          <div>
            {/* 🔥 STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard title="Total Trips" value={bookings.length} onClick={() => openModal("Total Trips", () => true)} />
              <StatCard title="Confirmed" value={bookings.filter(b => b.status?.toLowerCase() === "confirmed").length} onClick={() => openModal("Confirmed Bookings", b => b.status?.toLowerCase() === "confirmed")} />
              <StatCard title="Pending" value={bookings.filter(b => b.status?.toLowerCase() === "pending").length} onClick={() => openModal("Pending Bookings", b => b.status?.toLowerCase() === "pending")} />
              <StatCard title="Cities Visited" value={userCities.length} onClick={() => openModal("Cities Visited", () => true)} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 🔥 UPCOMING */}
              <section className="bg-white/80 backdrop-blur-md p-6 rounded-xl border border-gray-200/60 shadow-sm">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg font-semibold text-gray-900">Upcoming Trips</h3>
                  <button onClick={() => navigate("/explore")} className="text-sm font-medium text-yellow-600 hover:text-yellow-700 hover:underline">Explore</button>
                </div>
                
                <div className="min-h-[200px]">
                  {bookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                      <p>No trips planned yet.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {bookings.slice(0, 3).map((b) => (
                        <TripCard key={b.id || b.createdAt} b={b} onContactHost={(name, city) => openChat(name, city, 'host')} />
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* 🔥 GUIDE */}
              <section className="bg-white/80 backdrop-blur-md p-6 rounded-xl border border-gray-200/60 shadow-sm">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg font-semibold text-gray-900">Your Local Guides</h3>
                </div>
                <div className="min-h-[200px]">
                  {hiredGuides.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                      <p>No guides hired yet.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {hiredGuides.map((g, idx) => (
                        <GuideCard key={idx} g={g} isLarge onContact={(name, city) => openChat(name, city, 'guide')} />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* MY STAYS TAB */}
        {activeTab === "My Stays" && (
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-xl border border-gray-200/60 shadow-sm min-h-[60vh]">
            <h3 className="text-2xl font-semibold text-gray-900 mb-1">My Booked Stays</h3>
            <p className="text-gray-500 mb-8">Review all your reservations across various destinations.</p>
            
            <div className="max-w-4xl border-t border-gray-100 pt-6">
              {bookedStays.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                   <p>No stays booked yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {bookedStays.map((s, i) => (
                    <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                      <div className="flex flex-col">
                         <h4 className="font-semibold text-lg text-gray-900">{s.name}</h4>
                         <p className="text-sm text-gray-500 mt-1 capitalize">City: {s.city}</p>
                         <span className="mt-2 self-start px-3 py-1 bg-green-50 text-green-700 rounded text-xs font-medium border border-green-100">Confirmed</span>
                      </div>
                      <button onClick={() => openChat(s.name, s.city, 'host')} className="mt-4 sm:mt-0 px-4 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition">Contact Host</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MY GUIDE BOOKINGS TAB */}
        {activeTab === "My Guide Bookings" && (
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-xl border border-gray-200/60 shadow-sm min-h-[60vh]">
            <h3 className="text-2xl font-semibold text-gray-900 mb-1">My Hired Guides</h3>
            <p className="text-gray-500 mb-8">Manage and contact the local experts you've hired for your trips.</p>
            
            <div className="max-w-4xl border-t border-gray-100 pt-6">
              {hiredGuides.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                   <p>No guides hired yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {hiredGuides.map((g, i) => (
                    <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                      <div className="flex flex-col">
                         <h4 className="font-semibold text-lg text-gray-900">{g.name}</h4>
                         <p className="text-sm text-gray-500 mt-1 capitalize">Location: {g.city}</p>
                         <span className="mt-2 self-start px-3 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-100">Guide Assigned</span>
                      </div>
                      <button onClick={() => openChat(g.name, g.city, 'guide')} className="mt-4 sm:mt-0 px-4 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition">Contact Guide</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MESSAGES TAB */}
        {activeTab === "Messages" && (
          <div className="bg-white/80 backdrop-blur-md rounded-xl border border-gray-200/60 shadow-sm overflow-hidden h-[75vh] flex flex-col md:flex-row">
            {/* Chat List Sidebar */}
            <div className="w-full md:w-80 border-r border-gray-100 flex flex-col bg-white/40">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Your Conversations</h3>
              </div>
              <div className="flex-1 overflow-y-auto">
                {bookedStays.length === 0 && hiredGuides.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">No contacts available.</div>
                ) : (
                  <div className="flex flex-col">
                    {bookedStays.map((s, i) => (
                      <div 
                        key={`stay-${i}`} 
                        onClick={() => openChat(s.name, s.city, 'host')}
                        className={`p-4 cursor-pointer hover:bg-white/60 transition-colors border-b border-gray-50 flex items-center gap-3 ${activeChat?.name === s.name ? 'bg-white border-l-4 border-yellow-500' : ''}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold uppercase">{s.name.charAt(0)}</div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                          <p className="text-xs text-gray-500 capitalize">Host • {s.city}</p>
                        </div>
                      </div>
                    ))}
                    {hiredGuides.map((g, i) => (
                      <div 
                        key={`guide-${i}`} 
                        onClick={() => openChat(g.name, g.city, 'guide')}
                        className={`p-4 cursor-pointer hover:bg-white/60 transition-colors border-b border-gray-50 flex items-center gap-3 ${activeChat?.name === g.name ? 'bg-white border-l-4 border-yellow-500' : ''}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 font-bold uppercase">{g.name.charAt(0)}</div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{g.name}</p>
                          <p className="text-xs text-gray-500 capitalize">Guide • {g.city}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col bg-white/20">
              {activeChat ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-100 bg-white/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${activeChat.type === 'guide' ? 'bg-blue-500' : 'bg-slate-700'}`}>
                        {activeChat.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">{activeChat.name}</h4>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">{activeChat.type} • {activeChat.city}</p>
                      </div>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <MessageSquare size={32} className="mb-2 opacity-20" />
                        <p className="text-sm">Start a conversation with {activeChat.name}</p>
                      </div>
                    ) : (
                      chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.sender === 'tourist' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm ${msg.sender === 'tourist' ? 'bg-yellow-500 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}>
                            {msg.text}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="p-4 bg-white/40 border-t border-gray-100">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type your message..."
                        className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                      />
                      <button 
                        onClick={handleSendMessage}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <MessageSquare size={40} className="opacity-20" />
                  </div>
                  <h4 className="text-gray-900 font-medium mb-1 text-lg">Select a conversation</h4>
                  <p className="text-sm max-w-xs">Choose a host or guide from the sidebar to start messaging.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === "Profile" && (
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-xl border border-gray-200/60 shadow-sm max-w-2xl mx-auto">
             <div className="flex flex-col items-center mb-8">
                <div className="w-24 h-24 rounded-full bg-yellow-400 flex items-center justify-center text-yellow-900 text-3xl font-bold shadow-lg mb-4">
                  {user?.fullName?.charAt(0) || "U"}
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{user?.fullName}</h3>
                <p className="text-gray-500">{user?.email}</p>
                <span className="mt-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold uppercase tracking-wider">Tourist</span>
             </div>

             <div className="space-y-6 border-t border-gray-100 pt-8">
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase mb-1">Phone Number</p>
                      <p className="font-medium text-gray-900">{user?.phone || "+91 98765 43210"}</p>
                   </div>
                   <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase mb-1">Joined Date</p>
                      <p className="font-medium text-gray-900">April 2026</p>
                   </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                   <p className="text-xs text-gray-500 uppercase mb-1">Bio</p>
                   <p className="text-sm text-gray-700 leading-relaxed">
                     Passionate traveler looking to explore the hidden gems of India. Love to connect with local cultures and experience authentic stays.
                   </p>
                </div>

                <button 
                  onClick={() => setShowEditProfile(true)}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition shadow-md"
                >
                   Edit Profile
                </button>
             </div>
          </div>
        )}

        {/* 🔹 DETAILS MODAL */}
        {filteredBookings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal} />
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
               {/* Modal Header */}
               <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{modalTitle}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{filteredBookings.length} items found</p>
                  </div>
                  <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-900">
                    <X size={24} />
                  </button>
               </div>

               {/* Modal Body */}
               <div className="p-6 overflow-y-auto bg-gray-50/30 flex-1">
                  {filteredBookings.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                       <SearchX size={48} className="mx-auto mb-4 opacity-20" />
                       <p>No matches found in your plans.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                       {filteredBookings.map((b, idx) => (
                         <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center text-yellow-600">
                                  <MapIcon size={24} />
                               </div>
                               <div>
                                  <h4 className="font-bold text-gray-900 capitalize">{b.city}</h4>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                                  </p>
                               </div>
                            </div>
                            <div className="flex items-center gap-3">
                               <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                 b.status?.toLowerCase() === 'confirmed' ? 'bg-green-50 text-green-700 border-green-100' : 
                                 b.status?.toLowerCase() === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' : 
                                 'bg-orange-50 text-orange-700 border-orange-100'
                               }`}>
                                 {b.status || 'Pending'}
                               </span>
                               <button 
                                 onClick={() => navigate("/plan", { state: { city: b.city } })}
                                 className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-yellow-600 transition-colors"
                               >
                                  <Ticket size={18} />
                               </button>
                            </div>
                         </div>
                       ))}
                    </div>
                  )}
               </div>

               {/* Modal Footer */}
               <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
                  <button onClick={closeModal} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition shadow-sm">
                    Close
                  </button>
               </div>
            </div>
          </div>
        )}

        {/* 🔹 EDIT PROFILE MODAL */}
        {showEditProfile && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowEditProfile(false)} />
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Edit Profile</h3>
                <button onClick={() => setShowEditProfile(false)} className="text-gray-400 hover:text-gray-900 transition">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Bio</label>
                  <textarea 
                    rows={4}
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 resize-none"
                  />
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button 
                  onClick={() => setShowEditProfile(false)}
                  className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveProfile}
                  className="flex-1 py-2.5 bg-yellow-500 text-white rounded-xl font-medium hover:bg-yellow-600 transition shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

/* 🔹 Shared Card Components */
function StatCard({ title, value, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="bg-white/80 backdrop-blur-md p-5 rounded-xl border border-gray-200/60 cursor-pointer hover:bg-white hover:border-gray-300 transition-all shadow-sm"
    >
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <h2 className="text-3xl font-semibold text-gray-900">{value}</h2>
      <div className="mt-3 text-xs text-yellow-600 font-medium">View details &rarr;</div>
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

function TripCard({ b, onContactHost }) {
  const hName = b.homestayName && b.homestayName !== "N/A" ? b.homestayName : null;
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate("/plan", { state: { city: b.city } })}
      className="p-4 rounded-lg border border-gray-200 flex flex-col hover:bg-gray-50 transition cursor-pointer gap-3"
    >
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-gray-900 capitalize text-base">{b.city}</h4>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(b.startDate).toLocaleDateString()}
          </p>
        </div>
        <span className={`px-2.5 py-1 rounded text-xs font-medium border ${b.status?.toLowerCase() === "confirmed" ? "bg-green-50 text-green-700 border-green-100" : b.status?.toLowerCase() === "rejected" ? "bg-red-50 text-red-700 border-red-100" : "bg-orange-50 text-orange-700 border-orange-100"}`}>
          {b.status ? b.status.charAt(0).toUpperCase() + b.status.slice(1).toLowerCase() : "Pending"}
        </span>
      </div>
      {hName && onContactHost && (
        <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
           <span className="text-xs text-gray-500 font-medium">Stay: {hName}</span>
           <button onClick={(e) => { e.stopPropagation(); onContactHost(hName, b.city); }} className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1.5 rounded-md hover:bg-yellow-100 font-medium transition">Message Host</button>
        </div>
      )}
    </div>
  );
}

function GuideCard({ g, isLarge, onContact }) {
  const navigate = useNavigate();
  return (
    <div 
      onClick={() => navigate("/guide", { state: { city: g.city } })}
      className={`rounded-lg border border-gray-200 flex items-center ${isLarge ? 'p-5 gap-5' : 'p-3 gap-3'} hover:bg-gray-50 transition cursor-pointer`}
    >
      <div className={`${isLarge ? 'w-12 h-12' : 'w-10 h-10'} bg-gray-100 text-gray-500 flex justify-center items-center rounded-full flex-shrink-0`}>
         <UserIcon size={isLarge ? 20 : 18} />
      </div>
      <div className="flex-1">
        <h4 className={`font-semibold text-gray-900 ${isLarge ? 'text-lg' : 'text-base'}`}>{g.name}</h4>
        <p className="text-sm text-gray-500 capitalize">{g.city}</p>
      </div>
      {isLarge && onContact && (
         <button onClick={(e) => { e.stopPropagation(); onContact(g.name, g.city); }} className="px-4 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition">Contact Guide</button>
      )}
    </div>
  );
}

export default TouristDashboard;