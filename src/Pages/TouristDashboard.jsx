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
  const storedUser = localStorage.getItem("user");

  if (!storedUser || storedUser === "null") {
    navigate("/login");
    return;
  }

  const currentUser = JSON.parse(storedUser);

  if (!currentUser || !currentUser.id) {
    navigate("/login");
    return;
  }

  setUser(currentUser);

  // Load offline fallback bookings first
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
    if (!b.userEmail || !currentUser.email) return false;
    return b.userEmail.toLowerCase().trim() === currentUser.email.toLowerCase().trim();
  }).map(b => ({ ...b, status: computeOverallStatus(b) }));

  setBookings(userBookings);

  // Load backend API bookings if backend is live
  fetch(`http://localhost:8080/api/bookings/user/${currentUser.email}`)
    .then(res => {
        if(!res.ok) throw new Error("API Route Not Working");
        return res.json();
    })
    .then(data => {
      if(data && data.length > 0) {
        setBookings(prev => {
           const backendData = data.map(d => {
             const localMatch = prev.find(p => p.city?.toLowerCase() === d.city?.toLowerCase() && p.startDate?.split('T')[0] === d.startDate?.split('T')[0]);
             const result = {
                ...d,
                guideName: d.guideName && d.guideName !== "N/A" ? d.guideName : (localMatch?.guideName || "N/A"),
                homestayName: d.homestayName && d.homestayName !== "N/A" ? d.homestayName : (localMatch?.homestayName || "N/A"),
                guideStatus: d.guideStatus || localMatch?.guideStatus,
                homestayStatus: d.homestayStatus || localMatch?.homestayStatus
             };
             result.status = computeOverallStatus(result);
             return result;
          });
          const purelyOffline = prev.filter(p => !backendData.find(d => {
             const sameCity = d.city?.toLowerCase() === p.city?.toLowerCase();
             const dStart = d.startDate?.split('T')[0];
             const pStart = p.startDate?.split('T')[0];
             return sameCity && dStart === pStart;
          }));
          return [...backendData, ...purelyOffline];
        });
      }
    })
    .catch(err => {
        // Alternative fetch path if ID is required
        fetch(`http://localhost:8080/api/bookings`)
          .then(res => res.json())
          .then(data => {
              if(data && Array.isArray(data)) {
                 const matching = data.filter(d => d.userEmail?.toLowerCase() === currentUser.email.toLowerCase());
                 if(matching.length > 0) {
                    setBookings(prev => {
                      const backendData = matching.map(d => {
                         const localMatch = prev.find(p => p.city?.toLowerCase() === d.city?.toLowerCase() && p.startDate?.split('T')[0] === d.startDate?.split('T')[0]);
                         const result = {
                            ...d,
                            guideName: d.guideName && d.guideName !== "N/A" ? d.guideName : (localMatch?.guideName || "N/A"),
                            homestayName: d.homestayName && d.homestayName !== "N/A" ? d.homestayName : (localMatch?.homestayName || "N/A"),
                            guideStatus: d.guideStatus || localMatch?.guideStatus,
                            homestayStatus: d.homestayStatus || localMatch?.homestayStatus
                         };
                         result.status = computeOverallStatus(result);
                         return result;
                      });
                      const purelyOffline = prev.filter(p => !backendData.find(d => {
                         const sameCity = d.city?.toLowerCase() === p.city?.toLowerCase();
                         const dStart = d.startDate?.split('T')[0];
                         const pStart = p.startDate?.split('T')[0];
                         return sameCity && dStart === pStart;
                      }));
                      return [...backendData, ...purelyOffline];
                    });
                 }
              }
          })
          .catch(err2 => console.error("Guide check failed: ", err2));
    });

}, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/", { replace: true });
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
                      {bookings.length > 3 && (
                        <p className="text-center text-sm text-gray-400 mt-2 hover:text-gray-600 cursor-pointer">View all {bookings.length} trips</p>
                      )}
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

        {/* MY GUIDES TAB */}
        {activeTab === "My Guide Bookings" && (
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-xl border border-gray-200/60 shadow-sm min-h-[60vh]">
            <h3 className="text-2xl font-semibold text-gray-900 mb-1">My Local Guides</h3>
            <p className="text-gray-500 mb-8">Access the guides you've connected with.</p>
            
            <div className="max-w-4xl border-t border-gray-100 pt-6">
              {hiredGuides.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                   <p>No guides hired yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {hiredGuides.map((g, i) => (
                    <GuideCard key={i} g={g} isLarge onContact={(name, city) => openChat(name, city, 'guide')} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MESSAGES TAB */}
        {activeTab === "Messages" && (
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-xl border border-gray-200/60 shadow-sm min-h-[60vh] flex flex-col">
            {activeChat ? (
               <>
                 <div className="border-b border-gray-200 pb-4 mb-4 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Chat with {activeChat.name}</h3>
                    <button onClick={() => setActiveChat(null)} className="text-sm text-gray-500 hover:text-gray-800">Close Chat</button>
                 </div>
                 <div className="flex-1 overflow-y-auto mb-4 space-y-3 min-h-[300px]">
                    {chatMessages.length === 0 && (
                      <div className="text-center text-gray-400 mt-10">
                        <p>No messages yet. Send a message to start!</p>
                      </div>
                    )}
                    {chatMessages.map((msg, idx) => (
                       <div key={idx} className={`flex ${msg.sender === 'tourist' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`px-4 py-2 rounded-lg max-w-sm ${msg.sender === 'tourist' ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
                             {msg.text}
                          </div>
                       </div>
                    ))}
                 </div>
                 <div className="flex gap-2">
                    <input type="text" className="flex-1 border border-gray-300 rounded-lg px-4 py-2" placeholder="Write a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} />
                    <button onClick={handleSendMessage} className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition">Send</button>
                 </div>
               </>
            ) : (
                <div className="m-auto text-center">
                    <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Active Chat</h3>
                    <p className="text-gray-500">Go to My Guides and click "Contact Guide" to start messaging.</p>
                </div>
            )}
          </div>
        )}

        {/* MY PROFILE TAB */}
        {activeTab === "Profile" && (
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-xl border border-gray-200/60 shadow-sm min-h-[60vh]">
            <h3 className="text-2xl font-semibold text-gray-900 mb-8">User Profile</h3>
            
            <div className="flex items-center gap-5 mb-10 border-b border-gray-100 pb-8">
               <div className="w-20 h-20 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center font-semibold text-3xl border border-yellow-200">
                 {user?.fullName?.charAt(0) || "U"}
               </div>
               <div>
                 <h3 className="text-2xl font-semibold text-gray-900 mb-1">{user?.fullName}</h3>
                 <p className="text-gray-500 capitalize">{user?.role || "Tourist"} Account</p>
               </div>
            </div>
            
            <div className="max-w-3xl">
              <h4 className="text-lg font-medium text-gray-900 mb-5">Personal Information</h4>
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
                    <label className="text-sm text-gray-500 block mb-1">Password</label>
                    <div className="flex items-center gap-4">
                      <p className="text-base text-gray-900 tracking-widest mt-0.5">••••••••</p>
                      <button onClick={(e) => { e.stopPropagation(); alert('Password reset flow initiated.'); }} className="text-sm text-yellow-600 hover:underline">Change</button>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 🔹 MODAL INTERFACE */}
      {filteredBookings && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-xl">
              <h2 className="text-xl font-semibold text-gray-900">{modalTitle}</h2>
              <button 
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50 rounded-b-xl">
              {filteredBookings.length === 0 ? (
                <div className="text-center text-gray-400 py-10">
                   <p>No records found.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {modalTitle === "Cities Visited" ? (
                    [...new Set(filteredBookings.map(b => b.city))].map((city, idx) => (
                      <div key={idx} className="bg-white p-4 border border-gray-200 rounded-lg flex items-center gap-3">
                        <MapPin size={18} className="text-gray-400"/>
                        <h3 className="text-lg font-medium text-gray-900 capitalize">{city}</h3>
                      </div>
                    ))
                  ) : (
                    filteredBookings.map((b) => (
                      <div key={b.id || b.createdAt} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-white">
                           <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                             <span className="capitalize">{b.city}</span>
                           </h3>
                           <span className={`px-2.5 py-1 rounded text-xs font-medium border ${b.status?.toLowerCase() === "confirmed" ? "bg-green-50 text-green-700 border-green-100" : "bg-orange-50 text-orange-700 border-orange-100"}`}>
                             {b.status ? b.status.charAt(0).toUpperCase() + b.status.slice(1).toLowerCase() : "Pending"}
                           </span>
                        </div>
                        <div className="p-5">
                          <p className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                            <Clock size={14}/>
                            {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                          </p>
                          
                          {b.homestayName && b.homestayName !== "N/A" && (
                            <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                              <span className="font-medium text-gray-800">🏡 Homestay:</span> {b.homestayName}
                            </p>
                          )}
                          
                          {b.guideName && b.guideName !== "N/A" && (
                            <p className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                              <span className="font-medium text-gray-800">👨‍🏫 Guide:</span> {b.guideName}
                            </p>
                          )}
                          
                          {b.selectedPlaces && b.selectedPlaces.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-gray-100">
                              <p className="text-sm font-medium text-gray-800 mb-2">Selected Attractions</p>
                              <div className="flex flex-wrap gap-2">
                                {b.selectedPlaces.map((place, i) => (
                                  <span key={i} className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded border border-gray-200">{place.name}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* 🔹 Sidebar Item */
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

function TripCard({ b, onContactHost }) {
  const hName = b.homestayName && b.homestayName !== "N/A" ? b.homestayName : null;

  return (
    <div className="p-4 rounded-lg border border-gray-200 flex flex-col hover:bg-gray-50 transition cursor-pointer gap-3">
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
  return (
    <div className={`rounded-lg border border-gray-200 flex items-center ${isLarge ? 'p-5 gap-5' : 'p-3 gap-3'} hover:bg-gray-50 transition cursor-pointer`}>
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