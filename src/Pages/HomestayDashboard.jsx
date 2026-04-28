import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  MapPin, Home as HomeIcon, LogOut, Wallet, User as UserIcon, ArrowLeft, Calendar, MessageSquare, Plus, X, List
} from "lucide-react";
import { citiesByState } from "../data/cities";

function HomestayDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [reservedStays, setReservedStays] = useState([]);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [myProperties, setMyProperties] = useState([]);
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [newProperty, setNewProperty] = useState({
    name: "",
    citySlug: "",
    description: "",
    price: "",
    features: "",
    image: ""
  });

  const handleListingSubmit = (e) => {
    e.preventDefault();
    if (!newProperty.citySlug || !newProperty.name) return;

    // Smart Image Fallback
    const finalImage = newProperty.image || "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=2000";

    const propertyData = {
      ...newProperty,
      id: `prop_${Date.now()}`,
      hostId: user.id,
      hostName: user.fullName,
      image: finalImage,
      status: "pending", // Requiring Admin Approval
      createdAt: new Date().toISOString()
    };

    const pending = JSON.parse(localStorage.getItem("pending_properties") || "[]");
    pending.push(propertyData);
    localStorage.setItem("pending_properties", JSON.stringify(pending));

    alert("Property submitted! It will be visible once the Admin approves it.");
    setIsListingModalOpen(false);
    setNewProperty({ name: "", citySlug: "", description: "", price: "", features: "", image: "" });
    loadProperties();
  };

  const loadProperties = () => {
    const approved = JSON.parse(localStorage.getItem("homestays") || "[]");
    const pending = JSON.parse(localStorage.getItem("pending_properties") || "[]");
    const currentUser = JSON.parse(localStorage.getItem("user"));

    const userApproved = approved.filter(p => String(p.hostId) === String(currentUser?.id));
    const userPending = pending.filter(p => String(p.hostId) === String(currentUser?.id));

    setMyProperties([...userApproved, ...userPending]);
  };

  useEffect(() => {
    loadProperties();
  }, [user]);

  useEffect(() => {
    const loadData = () => {
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

      if (currentUser.role?.toLowerCase() !== "host") {
        navigate("/login");
        return;
      }

      setUser(currentUser);

      const storedBookings = localStorage.getItem("savedPlans");
      const bookingsData = storedBookings ? JSON.parse(storedBookings) : [];

      const plansWithStays = bookingsData
        .filter(b => {
          const isIdMatch = b.hostId && String(b.hostId) === String(currentUser.id);
          const isNameMatch = b.homestayName && currentUser.fullName &&
            b.homestayName.toLowerCase().includes(currentUser.fullName.toLowerCase());
          const hasHomestayName = b.homestayName && b.homestayName !== "N/A";
          return isIdMatch || isNameMatch || hasHomestayName;
        })
        .map(b => {
          const cityVal = b.city || "";
          const cityKey = cityVal.toLowerCase().trim();
          const price =
            b.homestayPrice ||
            Number(localStorage.getItem(`homestayPrice_${cityKey}`)) ||
            1500;
          return { ...b, homestayPrice: price };
        });

      setReservedStays(plansWithStays);

      // Fetch from backend — show all bookings with a homestay
      fetch(`https://fsad-tourconnect-backend.onrender.com/api/bookings`, { credentials: "include" })
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data)) {
            const myBookings = data.filter(b => b.homestayName && b.homestayName !== "N/A");
            setReservedStays(prev => {
              const getKey = (item) => `${item.city}-${item.startDate}-${item.endDate}-${item.userEmail}`.toLowerCase().trim();
              const merged = [...prev];
              myBookings.forEach(d => {
                if (!merged.some(p => getKey(p) === getKey(d))) merged.push({ ...d, homestayPrice: d.homestayPrice || 1500 });
              });
              return merged;
            });
          }
        })
        .catch(() => { });

      fetch("https://fsad-tourconnect-backend.onrender.com/api/homestays", { credentials: "include" })
        .then(res => res.json())
        .then(data => {
          const backendStays = Array.isArray(data) ? data.filter(h => h.hostId === currentUser.id) : [];

          // 🔥 MERGE WITH LOCAL
          const approved = JSON.parse(localStorage.getItem("homestays") || "[]");
          const pending = JSON.parse(localStorage.getItem("pending_properties") || "[]");
          const rejected = JSON.parse(localStorage.getItem("rejected_properties") || "[]");
          const localUserStays = [...approved, ...pending, ...rejected].filter(p => String(p.hostId) === String(currentUser.id));

          const merged = [...backendStays];
          localUserStays.forEach(ls => {
            if (!merged.find(m => m.id === ls.id)) merged.push(ls);
          });

          setMyProperties(merged);
        })
        .catch(err => {
          console.error("No backend homestays: ", err);
          // Fallback to local only
          const approved = JSON.parse(localStorage.getItem("homestays") || "[]");
          const pending = JSON.parse(localStorage.getItem("pending_properties") || "[]");
          const rejected = JSON.parse(localStorage.getItem("rejected_properties") || "[]");
          setMyProperties([...approved, ...pending, ...rejected].filter(p => String(p.hostId) === String(currentUser.id)));
        });
    };

    loadData();
    window.addEventListener("storage", loadData);
    window.addEventListener("bookingUpdated", loadData);
    return () => {
      window.removeEventListener("storage", loadData);
      window.removeEventListener("bookingUpdated", loadData);
    };
  }, [navigate]);


  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (activeChat) {
      const loadChats = () => {
        const chats = JSON.parse(localStorage.getItem('TourConnectChats')) || {};
        const chatKey = `${activeChat.clientEmail}_host_${activeChat.city}`;
        setChatMessages(chats[chatKey] || []);
      };
      loadChats();

      const handleStorage = () => loadChats();
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    }
  }, [activeChat]);

  const openChat = (clientEmail, city) => {
    const cityVal = city || "";
    const cityKey = cityVal.toLowerCase().trim();
    setActiveChat({ clientEmail, city: cityKey });
    setActiveTab("Messages");
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeChat) return;

    const chats = JSON.parse(localStorage.getItem('TourConnectChats')) || {};
    const chatKey = `${activeChat.clientEmail}_host_${activeChat.city}`;

    const roomMessages = chats[chatKey] || [];
    const newMsg = { sender: 'host', text: newMessage, timestamp: Date.now() };

    const updatedMessages = [...roomMessages, newMsg];
    chats[chatKey] = updatedMessages;

    localStorage.setItem('TourConnectChats', JSON.stringify(chats));
    setChatMessages(updatedMessages);
    setNewMessage("");

    window.dispatchEvent(new Event('storage'));
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  const handleUpdateStatus = (booking, newStatus) => {
    const getUniqueKey = (item) => `${item.city}-${item.startDate}-${item.endDate}-${item.userEmail}`.toLowerCase().trim();
    const targetKey = getUniqueKey(booking);

    const storedBookings = JSON.parse(localStorage.getItem("savedPlans")) || [];
    const updatedBookings = storedBookings.map(b =>
      getUniqueKey(b) === targetKey ? { ...b, homestayStatus: newStatus } : b
    );
    localStorage.setItem("savedPlans", JSON.stringify(updatedBookings));
    window.dispatchEvent(new Event("bookingUpdated"));
    setReservedStays(prev => prev.map(t =>
      getUniqueKey(t) === targetKey ? { ...t, homestayStatus: newStatus } : t
    ));

    // Find real numeric DB id by fetching all bookings and matching
    fetch("https://fsad-tourconnect-backend.onrender.com/api/bookings", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        const match = data.find(b => getUniqueKey(b) === targetKey);
        if (match && match.id) {
          fetch(`https://fsad-tourconnect-backend.onrender.com/api/bookings/${match.id}/status`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus })
          }).catch(() => { });
        }
      }).catch(() => { });
  };

  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [newPropName, setNewPropName] = useState("");
  const [newPropCity, setNewPropCity] = useState("");
  const [newPropPrice, setNewPropPrice] = useState("");
  const [newPropDesc, setNewPropDesc] = useState("");
  const [newPropImage, setNewPropImage] = useState("");

  const handleAddProperty = async (e) => {
    e.preventDefault();
    if (!newPropName || !newPropCity || !newPropPrice) return;

    // Premium Diverse Default Images
    const defaultImages = [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=2070", // Modern Villa
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=2000", // Traditional House
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80&w=2070", // Interior
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=2070", // Cozy Apartment
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=2070", // Bright Living Room
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=2070", // City Penthouse
      "https://images.unsplash.com/photo-1513584684374-8bdb7489feef?auto=format&fit=crop&q=80&w=2070", // Modern Exterior
      "https://images.unsplash.com/photo-1449156001931-963421ce4dc2?auto=format&fit=crop&q=80&w=2070", // Wooden Cabin
      "https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&q=80&w=2070"  // Minimalist Home
    ];
    // Seed with property name for pseudo-random but consistent selection if blank
    const seed = newPropName.length + newPropPrice;
    const finalImage = newPropImage || defaultImages[seed % defaultImages.length];

    const newStay = {
      id: "hs_" + Date.now(),
      title: newPropName,
      name: newPropName,
      city: newPropCity.trim(), // Name for display
      citySlug: newPropCity.toLowerCase().replace(/\s+/g, '-').trim(), // Slug for linking
      price: Number(newPropPrice),
      description: newPropDesc,
      image: finalImage,
      hostId: user.id,
      hostName: user.fullName,
      hostEmail: user.email,
      rating: 5.0,
      status: "pending", // Primary status for admin
      approvalStatus: "pending", // Backup status
      createdAt: new Date().toISOString()
    };

    // 1. Save to backend DB first to get real ID
    let dbId = null;
    try {
      const res = await fetch("https://fsad-tourconnect-backend.onrender.com/api/homestays", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPropName,
          name: newPropName,
          city: newPropCity.toLowerCase().trim(),
          citySlug: newPropCity.toLowerCase().replace(/\s+/g, '-').trim(),
          price: Number(newPropPrice),
          description: newPropDesc,
          image: finalImage,
          hostId: user.id,
          hostName: user.fullName,
          hostEmail: user.email,
          status: "PENDING",
          approvalStatus: "PENDING"
        })
      });
      if (res.ok) {
        const saved = await res.json();
        dbId = saved.id;
      }
    } catch { /* backend offline */ }

    // Use DB id if available, else local id
    if (dbId) newStay.id = dbId;

    // 2. Save to PENDING queue for Admin
    const pending = JSON.parse(localStorage.getItem("pending_properties") || "[]");
    pending.push(newStay);
    localStorage.setItem("pending_properties", JSON.stringify(pending));

    // 3. Also keep in host's local list for tracking
    const myStaysLocal = JSON.parse(localStorage.getItem(`host_stays_${user.id}`) || "[]");
    myStaysLocal.push(newStay);
    localStorage.setItem(`host_stays_${user.id}`, JSON.stringify(myStaysLocal));

    alert("Listing submitted! It will appear once the Admin approves it.");

    setShowAddPropertyModal(false);
    setNewPropName("");
    setNewPropCity("");
    setNewPropPrice("");
    setNewPropDesc("");
    setNewPropImage("");

    // Refresh local list
    setMyProperties(myStaysLocal);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-semibold">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen font-sans mt-16 text-gray-800 relative z-0">
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
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3">Host Portal</p>
          <SidebarItem icon={<HomeIcon size={18} />} label="Dashboard" active={activeTab === "Dashboard"} onClick={() => setActiveTab("Dashboard")} />
          <SidebarItem icon={<List size={18} />} label="My Properties" active={activeTab === "My Properties"} onClick={() => setActiveTab("My Properties")} />
          <SidebarItem icon={<Calendar size={18} />} label="Reservations" active={activeTab === "Reservations"} onClick={() => setActiveTab("Reservations")} />
          <SidebarItem icon={<MessageSquare size={18} />} label="Messages" active={activeTab === "Messages"} onClick={() => setActiveTab("Messages")} />
          <SidebarItem icon={<Wallet size={18} />} label="Earnings" active={activeTab === "Earnings"} onClick={() => setActiveTab("Earnings")} />
          <SidebarItem icon={<UserIcon size={18} />} label="Profile" active={activeTab === "Profile"} onClick={() => setActiveTab("Profile")} />
        </div>

        <div className="p-4 border-t border-gray-100/60 mb-16 flex flex-col gap-1">
          <SidebarItem icon={<LogOut size={18} />} label="Sign Out" onClick={handleLogout} isDanger />
        </div>
      </aside>

      {/* 🔹 MAIN CONTENT */}
      <main className="flex-1 md:ml-64 p-6 md:p-10 relative max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-white drop-shadow-sm">
              Welcome back, {user?.fullName?.split(" ")[0] || "Host"}
            </h1>
            <p className="text-gray-300 mt-1">Manage your properties and reservations.</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAddPropertyModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-xl transition shadow"
            >
              <Plus size={18} />
              List New Property
            </button>
            <div
              onClick={() => setActiveTab("Profile")}
              className="hidden md:flex items-center gap-3 cursor-pointer hover:bg-white/10 py-1.5 px-3 rounded-xl transition"
            >
              <span className="font-medium text-white drop-shadow-sm">{user?.fullName}</span>
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-900 border border-blue-200 flex items-center justify-center font-bold text-sm shadow-sm">
                {user?.fullName?.charAt(0) || "H"}
              </div>
            </div>
          </div>
        </header>

        {/* DASHBOARD TAB */}
        {activeTab === "Dashboard" && (() => {
          const totalEarnings = reservedStays
            .filter(t => t.homestayStatus === "confirmed")
            .reduce((sum, t) => sum + t.homestayPrice, 0);

          return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Active Reservations" value={reservedStays.length} onClick={() => setActiveTab("Reservations")} />
                <StatCard title="Total Earnings" value={`₹ ${totalEarnings}`} onClick={() => setActiveTab("Earnings")} />
                <StatCard title="Overall Rating" value="4.8 / 5.0" onClick={() => setActiveTab("Profile")} />
              </div>

              <section className="bg-white/80 backdrop-blur-md p-6 rounded-xl border border-gray-200/60 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-5">Upcoming Check-ins</h3>
                {reservedStays.length === 0 ? (
                  <p className="text-gray-500 py-4">No upcoming reservations.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reservedStays.map((t, idx) => {
                      const cityVal = t.city || "";
                      const hName = t.homestayName && t.homestayName !== "N/A" ? t.homestayName : localStorage.getItem(`homestayName_${cityVal.toLowerCase().trim()}`);
                      return (
                        <div key={idx} onClick={() => setActiveTab("Reservations")} className="p-4 border border-gray-100 rounded-lg hover:border-blue-400 transition-colors bg-white/60 cursor-pointer shadow-sm hover:shadow-md">
                          <h4 className="font-semibold text-gray-900">{hName}</h4>
                          <p className="text-sm text-gray-500 mt-1">Check-in: {t.startDate}</p>
                          <p className="text-sm text-gray-500 mt-1">Check-out: {t.endDate}</p>
                          <p className="text-xs text-blue-600 font-medium mt-2">Guest: {t.userEmail}</p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            </div>
          );
        })()}

        {/* MY PROPERTIES TAB */}
        {activeTab === "My Properties" && (
          <div className="bg-white/80 p-8 rounded-xl shadow-sm border border-gray-200/60 min-h-[60vh]">
            <h3 className="text-2xl font-semibold mb-6">My Properties</h3>

            {myProperties.length === 0 ? (
              <p className="text-gray-500">No properties listed yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {myProperties.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-5 border border-gray-200 rounded-xl bg-white/60 shadow hover:shadow-lg transition"
                  >
                    <h4 className="text-lg font-bold text-gray-900">{t.title}</h4>

                    <p className="text-sm text-gray-500 mt-1">{t.city}</p>

                    <p className="text-sm text-gray-600 mt-2">
                      {t.description || "No description available"}
                    </p>

                    <div className="mt-4 flex justify-between items-center">
                      <p className="text-green-600 font-bold">₹{t.price}</p>

                      <span
                        className={`text-xs px-2 py-1 rounded font-bold uppercase ${(t.status || "").toLowerCase() === "approved"
                          ? "bg-green-100 text-green-700"
                          : (t.status || "").toLowerCase() === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                          }`}
                      >
                        {t.status || "PENDING"}
                      </span>
                    </div>
                  </div>
                ))}

              </div>
            )}
          </div>
        )}
        {/* RESERVATIONS TAB */}
        {activeTab === "Reservations" && (
          <div className="bg-white/80 p-8 rounded-xl shadow-sm border border-gray-200/60 min-h-[60vh]">
            <h3 className="text-2xl font-semibold mb-6">Reservation Requests</h3>

            {reservedStays.length === 0 ? (
              <p className="text-gray-500 py-10 text-center font-medium">No reservations received yet.</p>
            ) : (
              <div className="space-y-4">
                {reservedStays.map((t, idx) => {
                  const cityVal = t.city || "";
                  const hName = t.homestayName && t.homestayName !== "N/A" ? t.homestayName : localStorage.getItem(`homestayName_${cityVal.toLowerCase().trim()}`);
                  return (
                    <div key={idx} className="bg-white/60 p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition">
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg mb-1">{hName} <span className="text-sm font-normal text-gray-500">({cityVal.toUpperCase()})</span></h4>
                        <p className="text-sm text-gray-600 mb-1">Guest: <span className="font-medium text-gray-900">{t.userEmail}</span></p>
                        <p className="text-sm text-gray-600 mb-2">Check-in: <span className="font-medium">{new Date(t.startDate).toLocaleDateString()}</span> | Check-out: <span className="font-medium">{new Date(t.endDate).toLocaleDateString()}</span></p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm font-bold text-green-700">Earnings: ₹{t.homestayPrice}</span>
                          <span className={`text-xs px-2 py-1 rounded font-bold uppercase tracking-wider ${t.homestayStatus === "confirmed" ? "bg-green-100 text-green-700" : t.homestayStatus === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {t.homestayStatus || "PENDING"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                        <button onClick={() => openChat(t.userEmail, cityVal)} className="px-4 py-2 border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-lg text-sm font-medium transition flex items-center gap-2 w-full md:w-auto justify-center">
                          <MessageSquare size={16} /> Contact Guest
                        </button>

                        {(!t.homestayStatus || t.homestayStatus === "pending") && (
                          <>
                            <button onClick={() => handleUpdateStatus(t, "confirmed")} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition w-full md:w-auto">
                              Accept
                            </button>
                            <button onClick={() => handleUpdateStatus(t, "rejected")} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium transition w-full md:w-auto">
                              Decline
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}


        {/* MESSAGES TAB */}
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
                    <div key={idx} className={`flex ${msg.sender === 'host' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`px-4 py-2 rounded-lg max-w-sm ${msg.sender === 'host' ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
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
                <p className="text-gray-500">Select "Contact Guest" from your reservations to start messaging.</p>
              </div>
            )}
          </div>
        )}

        {/* EARNINGS TAB */}
        {activeTab === "Earnings" && (() => {
          const confirmedTours = reservedStays.filter(t => t.homestayStatus === "confirmed");
          const totalEarnings = confirmedTours.reduce((sum, t) => sum + t.homestayPrice, 0);

          return (
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-xl border border-gray-200/60 shadow-sm min-h-[60vh]">
              <h3 className="text-2xl font-semibold text-gray-900 mb-1">Detailed Earnings Report</h3>
              <p className="text-gray-500 mb-8">View your revenue breakdown across all finalized guest stays.</p>

              <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-xl flex justify-between items-center shadow-sm">
                <span className="text-green-800 font-semibold text-lg">Total Cleared Revenue</span>
                <span className="text-3xl font-bold text-green-700 drop-shadow-sm">₹{totalEarnings}</span>
              </div>

              {confirmedTours.length === 0 ? (
                <p className="text-gray-500 py-10 text-center font-medium">You have no confirmed earnings yet. Accept some reservations!</p>
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left bg-white/60 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                    <thead className="bg-gray-100/80">
                      <tr>
                        <th className="p-4 font-semibold text-gray-700 border-b border-gray-200">Guest / Email</th>
                        <th className="p-4 font-semibold text-gray-700 border-b border-gray-200">Property / Location</th>
                        <th className="p-4 font-semibold text-gray-700 border-b border-gray-200">Dates</th>
                        <th className="p-4 font-semibold text-gray-700 border-b border-gray-200 text-right">Earned Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {confirmedTours.map((t, idx) => {
                        const cityVal = t.city || "";
                        const hName = t.homestayName && t.homestayName !== "N/A" ? t.homestayName : localStorage.getItem(`homestayName_${cityVal.toLowerCase().trim()}`);
                        return (
                          <tr key={idx} className="border-b border-gray-200/60 hover:bg-white/50 transition">
                            <td className="p-4 font-medium text-gray-900">{t.userEmail}</td>
                            <td className="p-4 text-gray-600">{hName} ({t.city})</td>
                            <td className="p-4 text-gray-600">{new Date(t.startDate).toLocaleDateString()} - {new Date(t.endDate).toLocaleDateString()}</td>
                            <td className="p-4 text-green-600 font-bold text-right">₹{t.homestayPrice}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}

        {/* PROFILE TAB */}
        {activeTab === "Profile" && (
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-xl border border-gray-200/60 shadow-sm min-h-[60vh]">
            <h3 className="text-2xl font-semibold text-gray-900 mb-8">Host Profile</h3>

            <div className="flex items-center gap-5 mb-10 border-b border-gray-100 pb-8">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-900 border border-blue-200 text-3xl font-bold">
                {user?.fullName?.charAt(0) || "H"}
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-1">{user?.fullName}</h4>
                <span className="bg-slate-100 text-slate-800 text-xs font-semibold px-2.5 py-0.5 rounded-md border border-slate-200">
                  Property Host
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
                  <label className="text-sm text-gray-500 block mb-1">Listed Properties</label>
                  <p className="text-base text-gray-900 tracking-widest">3 Active Listings</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className="mt-20 text-center text-gray-400 font-semibold text-sm pt-8 border-t border-gray-600/50">
          © {new Date().getFullYear()} TourConnect. Your perfectly planned adventure.
        </footer>
      </main>

      {/* 🔹 ADD PROPERTY MODAL */}
      {showAddPropertyModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">List a New Homestay</h2>
              <button onClick={() => setShowAddPropertyModal(false)} className="text-gray-400 hover:text-gray-700 p-1">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddProperty} className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Name *</label>
                  <input type="text" value={newPropName} onChange={(e) => setNewPropName(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="e.g., Sunrise Mountain Villa" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <select
                      value={newPropCity}
                      onChange={(e) => setNewPropCity(e.target.value)}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      <option value="">Select a City</option>
                      {(() => {
                        // 1. Get default static cities
                        const hardcoded = Object.values(citiesByState).flat();

                        // 2. Get custom cities added by Admin
                        const adminCities = JSON.parse(localStorage.getItem("availableCities") || "[]");

                        // 3. Merge and prevent duplicates by name
                        const allCities = [...hardcoded];
                        adminCities.forEach(ac => {
                          if (!allCities.find(h => h.name.toLowerCase() === ac.name.toLowerCase())) {
                            allCities.push(ac);
                          }
                        });

                        return allCities.sort((a, b) => a.name.localeCompare(b.name)).map(city => (
                          <option key={city.slug || city.name} value={city.name}>{city.name}</option>
                        ));
                      })()}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price per Night (₹) *</label>
                    <input type="number" value={newPropPrice} onChange={(e) => setNewPropPrice(e.target.value)} required min="500" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="1500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={newPropDesc} onChange={(e) => setNewPropDesc(e.target.value)} rows="2" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Ambiance, location..."></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (Optional)</label>
                  <input type="url" value={newPropImage} onChange={(e) => setNewPropImage(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="https://images.unsplash.com/..." />
                  <p className="text-[10px] text-gray-400 mt-1">Leave blank for a random professional photo.</p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddPropertyModal(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition">Publish Property</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function StatCard({ title, value, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white/80 backdrop-blur-md p-5 rounded-xl border border-gray-200/60 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-400 transition-all' : ''}`}
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

export default HomestayDashboard;
