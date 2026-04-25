import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
  MapPin, Shield, Users, BarChart3, Settings, LogOut, ArrowLeft, Globe, Home as HomeIcon, CheckCircle, Trash2, Mail, Server
} from "lucide-react";

function AdminDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [allPlans, setAllPlans] = useState([]);
  const [propertyRequests, setPropertyRequests] = useState([]);
  const [availableCities, setAvailableCities] = useState([]); // ✅ CITY MANAGEMENT
  const [newCityName, setNewCityName] = useState("");
  const [customAttractions, setCustomAttractions] = useState({}); // ✅ ATTRACTION MANAGEMENT
  const [attractionForm, setAttractionForm] = useState({ city: "", name: "", desc: "", duration: "2 hrs", entry: "Free" });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeTab, setActiveTab] = useState("Overview");
  const [backendStatus, setBackendStatus] = useState("checking");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const currentUser = storedUser ? JSON.parse(storedUser) : null;

    if (!currentUser || currentUser.role?.toLowerCase() !== "admin") {
      if (!currentUser || currentUser.role?.toLowerCase() !== "admin") {
         navigate("/login");
         return;
      }
    }

    setUser(currentUser);

    let storedUsers = JSON.parse(localStorage.getItem("users")) || [];
    if (storedUsers.length === 0) {
        storedUsers = [
           { id: 101, fullName: "Jayadeep", email: "devisrichowdaryk@gmail.com", role: "tourist", countryCode: "+91", phone: "1234567890" },
           { id: 102, fullName: "Demo Guide", email: "guide@test.com", role: "guide", countryCode: "+91", phone: "9876543210", approvalStatus: "approved" },
           { id: 103, fullName: "Demo Host", email: "host@test.com", role: "host", countryCode: "+91", phone: "9988776655", approvalStatus: "approved" },
           { id: 104, fullName: "Admin Portal", email: "admin@test.com", role: "admin", countryCode: "+91", phone: "1122334455" }
        ];
        localStorage.setItem("users", JSON.stringify(storedUsers));
    }

    const storedBookings = JSON.parse(localStorage.getItem("savedPlans")) || [];
    const customStays = JSON.parse(localStorage.getItem("customHomestays")) || [];
    
    setAllUsers(storedUsers);
    setAllPlans(storedBookings);
    setPropertyRequests(customStays);

    // ✅ INIT CITIES
    let storedCities = JSON.parse(localStorage.getItem("availableCities"));
    if (!storedCities || storedCities.length === 0) {
      storedCities = ["Hyderabad", "Warangal", "Mysore", "Chennai", "Madurai", "Jaipur", "Udaipur", "Mumbai", "Pune", "Delhi", "Bangalore", "Goa", "Kochi", "Munnar", "Kolkata", "Manali", "Shimla"];
      localStorage.setItem("availableCities", JSON.stringify(storedCities));
    }
    setAvailableCities(storedCities);

    // ✅ INIT ATTRACTIONS
    const storedAttractions = JSON.parse(localStorage.getItem("customAttractions")) || {};
    setCustomAttractions(storedAttractions);

    // CHECK BACKEND HEALTH
    fetch("/api/auth/send-otp?email=health-check", { credentials: "include" })
      .then(() => setBackendStatus("online"))
      .catch(() => setBackendStatus("offline"));

    // FETCH FROM STS BACKEND
    fetch("http://localhost:8080/api/users", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
         if(data && Array.isArray(data)) {
            setAllUsers(prev => {
                const merged = [...prev];
                data.forEach(d => { if(!merged.find(p => p.email === d.email)) merged.push(d) });
                return merged;
            });
         }
      }).catch(err => console.error("Admin user sync failed:", err));

    fetch("http://localhost:8080/api/bookings", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
         if(data && Array.isArray(data)) {
            setAllPlans(prev => {
                const merged = [...prev];
                data.forEach(d => { if(!merged.find(p => p.id === d.id)) merged.push(d) });
                return merged;
            });
         }
      }).catch(err => console.error("Admin bookings sync failed:", err));

    fetch("http://localhost:8080/api/homestays", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
         if(data && Array.isArray(data)) {
            setPropertyRequests(prev => {
                const merged = [...prev];
                data.forEach(d => { if(!merged.find(p => p.id === d.id)) merged.push(d) });
                return merged;
            });
         }
      }).catch(err => console.error("Admin property sync failed:", err));

  }, [navigate]);

  useEffect(() => {
     if(activeTab === "Property Requests" || activeTab === "Active Properties") {
        const customStays = JSON.parse(localStorage.getItem("customHomestays")) || [];
        setPropertyRequests(prev => {
           const merged = [...prev];
           customStays.forEach(c => {
              const idx = merged.findIndex(m => m.id === c.id);
              if(idx === -1) merged.push(c);
              else merged[idx] = c;
           });
           return merged;
        });
     } else if (activeTab === "All Bookings") {
        const storedBookings = JSON.parse(localStorage.getItem("savedPlans")) || [];
        setAllPlans(prev => {
           const merged = [...prev];
           storedBookings.forEach(c => {
              const idx = merged.findIndex(m => m.id === c.id);
              if(idx === -1) merged.push(c);
              else merged[idx] = c;
           });
           return merged;
        });
     }
  }, [activeTab]);

  const handleUpdatePropertyStatus = (index, newStatus) => {
    const customStays = JSON.parse(localStorage.getItem("customHomestays")) || [];
    if (customStays[index]) {
       customStays[index].approvalStatus = newStatus;
       localStorage.setItem("customHomestays", JSON.stringify(customStays));
       window.dispatchEvent(new Event("storage"));
       setPropertyRequests(customStays);
       
       fetch(`http://localhost:8080/api/homestays/${customStays[index].id || index}/status`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ status: newStatus })
       }).catch(err => console.error("Admin dashboard generic property save failure offline:", err));
    }
  };

  const handleUpdateUserStatus = (email, newStatus) => {
    if (!email) return;
    const searchEmail = email.trim().toLowerCase();
    const storedUsers = JSON.parse(localStorage.getItem("users")) || [];
    
    let found = false;
    const updatedUsers = storedUsers.map(u => {
       if (u.email && u.email.trim().toLowerCase() === searchEmail) {
          found = true;
          return { ...u, approvalStatus: newStatus };
       }
       return u;
    });

    if (found) {
       localStorage.setItem("users", JSON.stringify(updatedUsers));
       setAllUsers(updatedUsers);
       window.dispatchEvent(new Event("storage"));
       
       const targetUser = updatedUsers.find(u => u.email.trim().toLowerCase() === searchEmail);
       fetch(`http://localhost:8080/api/users/${targetUser.id || searchEmail}/status`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ status: newStatus })
       }).catch(err => console.error("Admin dashboard status sync failed:", err));
       
       alert(`User ${newStatus === 'approved' ? 'Accepted' : 'Rejected'} successfully!`);
    } else {
       setAllUsers(prev => prev.map(u => 
          (u.email && u.email.trim().toLowerCase() === searchEmail) ? { ...u, approvalStatus: newStatus } : u
       ));
       alert(`Status updated in view for ${searchEmail}.`);
    }
  };

  const handleDeleteProperty = (index) => {
    const customStays = JSON.parse(localStorage.getItem("customHomestays")) || [];
    if (customStays[index]) {
       customStays.splice(index, 1);
       localStorage.setItem("customHomestays", JSON.stringify(customStays));
       window.dispatchEvent(new Event("storage"));
       setPropertyRequests(customStays);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  const handleAddCity = () => {
    if (!newCityName.trim()) return;
    const updated = [...availableCities, newCityName.trim()];
    const unique = [...new Set(updated)];
    setAvailableCities(unique);
    localStorage.setItem("availableCities", JSON.stringify(unique));
    setNewCityName("");
    alert("City added successfully!");
  };

  const handleDeleteCity = (cityToDelete) => {
    const updated = availableCities.filter(c => c !== cityToDelete);
    setAvailableCities(updated);
    localStorage.setItem("availableCities", JSON.stringify(updated));
  };

  const handleAddAttraction = () => {
    if (!attractionForm.city || !attractionForm.name) return;
    const cityKey = attractionForm.city.toLowerCase().replace(/\s+/g, '-');
    
    // IMMUTABLE UPDATE
    const cityList = customAttractions[cityKey] ? [...customAttractions[cityKey]] : [];
    cityList.push({
       name: attractionForm.name,
       description: attractionForm.desc,
       duration: attractionForm.duration,
       entry: attractionForm.entry,
       image: "https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&q=80&w=2070" 
    });

    const updated = { ...customAttractions, [cityKey]: cityList };

    setCustomAttractions(updated);
    localStorage.setItem("customAttractions", JSON.stringify(updated));
    setAttractionForm({ ...attractionForm, name: "", desc: "" });
    alert("Attraction added!");
  };

  const handleDeleteAttraction = (cityKey, index) => {
    const cityList = [...(customAttractions[cityKey] || [])];
    cityList.splice(index, 1);
    
    const updated = { ...customAttractions, [cityKey]: cityList };
    setCustomAttractions(updated);
    localStorage.setItem("customAttractions", JSON.stringify(updated));
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
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3">Admin Panel</p>
          <SidebarItem icon={<BarChart3 size={18}/>} label="Overview" active={activeTab === "Overview"} onClick={() => setActiveTab("Overview")} />
          <SidebarItem icon={<Users size={18}/>} label="Manage Users" active={activeTab === "Manage Users"} onClick={() => setActiveTab("Manage Users")} />
          <SidebarItem icon={<Globe size={18}/>} label="All Bookings" active={activeTab === "All Bookings"} onClick={() => setActiveTab("All Bookings")} />
          <SidebarItem icon={<HomeIcon size={18}/>} label="Property Requests" active={activeTab === "Property Requests"} onClick={() => setActiveTab("Property Requests")} />
          <SidebarItem icon={<CheckCircle size={18}/>} label="Active Properties" active={activeTab === "Active Properties"} onClick={() => setActiveTab("Active Properties")} />
          <SidebarItem icon={<Settings size={18}/>} label="System Settings" active={activeTab === "Settings"} onClick={() => setActiveTab("Settings")} />
        </div>

        <div className="p-4 border-t border-gray-100/60 mb-16 flex flex-col gap-1">
          <SidebarItem icon={<ArrowLeft size={18}/>} label="Back to Home" onClick={() => navigate("/")} />
          <SidebarItem icon={<LogOut size={18}/>} label="Sign Out" onClick={handleLogout} isDanger />
        </div>
      </aside>

      {/* 🔹 MAIN CONTENT */}
      <main className="flex-1 md:ml-64 p-6 md:p-10 relative max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-white drop-shadow-sm flex items-center gap-3">
              <Shield className="text-yellow-400" size={28} />
              TourConnect Administration
            </h1>
            <p className="text-gray-300 mt-1">Hello {user?.fullName?.split(" ")[0]}, monitor platform health.</p>
          </div>
          <div 
            onClick={() => setActiveTab("Settings")}
            className="hidden md:flex items-center gap-3 cursor-pointer hover:bg-white/10 py-1.5 px-3 rounded-xl transition"
          >
             <span className="font-medium text-white drop-shadow-sm">{user?.fullName}</span>
             <div className="w-10 h-10 rounded-full bg-slate-800 text-white border border-slate-600 flex items-center justify-center font-bold text-sm shadow-sm">
               {user?.fullName?.charAt(0) || "A"}
             </div>
          </div>
        </header>

        {/* OVERVIEW TAB */}
        {activeTab === "Overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard title="Total Users" value={allUsers.length} onClick={() => setActiveTab("Manage Users")} />
              <StatCard 
                 title="Pending Approvals" 
                 value={allUsers.filter(u => u.role !== 'tourist' && u.role !== 'admin' && u.approvalStatus === 'pending').length} 
                 onClick={() => setActiveTab("Manage Users")}
                 isHighlighted={allUsers.some(u => u.role !== 'tourist' && u.role !== 'admin' && u.approvalStatus === 'pending')}
              />
              <StatCard title="Live Guides" value={allUsers.filter(u => u.role === 'guide' && (u.approvalStatus === 'approved' || !u.approvalStatus)).length} onClick={() => setActiveTab("Manage Users")} />
              <StatCard title="Total Revenue" value={`₹ ${(() => {
                 let total = 0;
                 allPlans.forEach(t => {
                    const cityVal = t.city || "";
                    const cityKey = cityVal.toLowerCase().trim();
                    const hPrice = t.homestayPrice ? t.homestayPrice : (Number(localStorage.getItem(`homestayPrice_${cityKey}`)) || 0);
                    const gPrice = t.guidePrice ? t.guidePrice : (Number(localStorage.getItem(`guidePrice_${cityKey}`)) || 0);
                    const bPrice = t.baseTripCost || 0;
                    total += (hPrice + gPrice + bPrice);
                 });
                 return total;
              })()}`} onClick={() => setActiveTab("All Bookings")} />
            </div>

            <section className="bg-white/80 backdrop-blur-md p-6 rounded-xl border border-gray-200/60 shadow-sm">
               <h3 className="text-lg font-semibold text-gray-900 mb-5">System Recent Activity</h3>
               {allPlans.length === 0 ? (
                 <p className="text-gray-500 py-4">No recent activity.</p>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {allPlans.slice(-4).map((t, idx) => (
                       <div key={idx} className="p-4 border border-gray-100 rounded-lg bg-white/60 flex flex-col hover:border-blue-300 transition">
                          <h4 className="font-semibold text-gray-900">New Booking: {t.city}</h4>
                          <p className="text-xs text-gray-500 mt-1">Created At: {new Date(t.createdAt).toLocaleString()}</p>
                          <p className="text-sm font-medium text-blue-600 mt-2">By: {t.userEmail}</p>
                       </div>
                   ))}
                 </div>
               )}
            </section>
          </div>
        )}

        {/* MANAGE USERS TAB */}
        {activeTab === "Manage Users" && (
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-xl border border-gray-200/60 shadow-sm min-h-[60vh]">
            <h3 className="text-2xl font-semibold text-gray-900 mb-1">User Directory</h3>
            <p className="text-gray-500 mb-8">View all registered users on the TourConnect platform.</p>
            {allUsers.length === 0 ? (
                 <p className="text-gray-500 py-4">No users found.</p>
            ) : (
                <div className="w-full overflow-x-auto">
                   <table className="w-full text-left bg-white/60 rounded-lg overflow-hidden border border-gray-200">
                      <thead className="bg-gray-100/80">
                         <tr>
                            <th className="p-4 font-semibold text-gray-700">Name</th>
                            <th className="p-4 font-semibold text-gray-700">Email</th>
                            <th className="p-4 font-semibold text-gray-700">Role & Status</th>
                            <th className="p-4 font-semibold text-gray-700">City</th>
                            <th className="p-4 font-semibold text-gray-700">Actions</th>
                         </tr>
                      </thead>
                      <tbody>
                         {(() => {
                            const sortedUsers = [...allUsers].sort((a, b) => {
                               if (a.approvalStatus === 'pending' && b.approvalStatus !== 'pending') return -1;
                               if (a.approvalStatus !== 'pending' && b.approvalStatus === 'pending') return 1;
                               return 0;
                            });

                            return sortedUsers.map((u, idx) => (
                             <tr key={idx} className={`border-t border-gray-200 ${u.approvalStatus === 'pending' ? 'bg-orange-50/30' : ''}`}>
                                <td className="p-4 font-medium text-gray-900">
                                   {u.fullName}
                                   {u.approvalStatus === 'pending' && <span className="ml-2 text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-bold uppercase">New</span>}
                                </td>
                                <td className="p-4 text-gray-600">{u.email}</td>
                                <td className="p-4 text-gray-600">
                                    <div className="flex flex-col gap-1 items-start">
                                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase ${
                                           u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' :
                                           u.role === 'guide' ? 'bg-yellow-100 text-yellow-700' :
                                           u.role === 'host' ? 'bg-green-100 text-green-700' :
                                           'bg-slate-100 text-slate-700'
                                       }`}>
                                           {u.role ? u.role : 'TOURIST'}
                                       </span>
                                       {u.role !== 'tourist' && u.role !== 'admin' && (
                                         <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                           u.approvalStatus === 'approved' ? 'text-green-600' :
                                           u.approvalStatus === 'rejected' ? 'text-red-500' : 'text-orange-500'
                                         }`}>
                                            {u.approvalStatus || 'APPROVED'}
                                         </span>
                                       )}
                                    </div>
                                </td>
                                <td className="p-4 text-gray-600 font-medium">{u.city || "N/A"}</td>
                                <td className="p-4">
                                   {u.role !== 'tourist' && u.role !== 'admin' && u.approvalStatus === 'pending' && (
                                     <div className="flex gap-2">
                                       <button onClick={() => handleUpdateUserStatus(u.email, 'approved')} className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded hover:bg-green-600 transition shadow-sm">Accept</button>
                                       <button onClick={() => handleUpdateUserStatus(u.email, 'rejected')} className="px-3 py-1 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded hover:bg-red-100 transition">Reject</button>
                                     </div>
                                   )}
                                   {(u.approvalStatus === 'approved' || !u.approvalStatus) && (
                                      <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                         <CheckCircle size={14} /> Active
                                      </span>
                                   )}
                                </td>
                             </tr>
                            ));
                         })()}
                      </tbody>
                   </table>
                 </div>
            )}
          </div>
        )}

        {/* ALL BOOKINGS TAB */}
        {activeTab === "All Bookings" && (
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-xl border border-gray-200/60 shadow-sm min-h-[60vh]">
            <h3 className="text-2xl font-semibold text-gray-900 mb-1">Global Bookings</h3>
            <p className="text-gray-500 mb-8">All active trip plans logged in the system.</p>
            {allPlans.length === 0 ? (
                 <p className="text-gray-500 py-4">No plans have been created.</p>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                   {allPlans.map((t, idx) => (
                     <div key={idx} className="p-5 border border-gray-200 rounded-xl bg-white/60 flex justify-between items-center">
                        <div>
                            <h4 className="font-semibold text-gray-900 text-lg">{t.city} Trip</h4>
                            <p className="text-sm text-gray-500 mt-1">Status: {t.status} | User: {t.userEmail}</p>
                            <p className="text-sm text-slate-500 mt-1">Dates: {t.startDate} - {t.endDate}</p>
                        </div>
                        <button onClick={() => setSelectedBooking(t)} className="px-4 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800 transition">View Details</button>
                     </div>
                   ))}
                 </div>
            )}
            
            {/* BOOKING DETAILS MODAL */}
            {selectedBooking && (() => {
               const cityVal = selectedBooking.city || "";
               const cityKey = cityVal.toLowerCase().trim();
               const hPrice = selectedBooking.homestayPrice ? selectedBooking.homestayPrice : (Number(localStorage.getItem(`homestayPrice_${cityKey}`)) || 0);
               const gPrice = selectedBooking.guidePrice ? selectedBooking.guidePrice : (Number(localStorage.getItem(`guidePrice_${cityKey}`)) || 0);
               const bPrice = selectedBooking.baseTripCost || 0;
               const hName = selectedBooking.homestayName && selectedBooking.homestayName !== "N/A" ? selectedBooking.homestayName : (localStorage.getItem(`homestayName_${cityKey}`) || "N/A");
               const gName = selectedBooking.guideName && selectedBooking.guideName !== "N/A" ? selectedBooking.guideName : (localStorage.getItem(`guideName_${cityKey}`) || "N/A");
               const totalGross = hPrice + gPrice + bPrice;

               return (
               <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 block mt-10 text-gray-800">
                 <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl p-6 mt-16 max-h-[85vh] overflow-y-auto">
                    <h3 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-4 mb-4 text-gray-800">Trip Gross Breakdown</h3>
                    <div className="space-y-4">
                       <div>
                         <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Booking User</p>
                         <p className="text-lg text-blue-700 font-semibold">{selectedBooking.userEmail}</p>
                       </div>
                       <div className="grid grid-cols-1 gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-2">
                          <div className="flex justify-between items-center whitespace-nowrap">
                            <p className="text-xs text-blue-800 uppercase tracking-widest font-bold mb-1">Base Itinerary Attractions Cost</p>
                            <p className="text-sm text-blue-900 font-bold mt-1">₹{bPrice}</p>
                          </div>
                          {bPrice === 0 && <p className="text-xs text-slate-500 italic">Pre-architecture legacy data</p>}
                       </div>
                       <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Homestay Asset</p>
                            <p className="text-sm font-semibold text-gray-800">{hName}</p>
                            <p className="text-xs text-green-700 font-bold mt-1">₹{hPrice}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Guide Assigned</p>
                            <p className="text-sm font-semibold text-gray-800">{gName}</p>
                            <p className="text-xs text-green-700 font-bold mt-1">₹{gPrice}</p>
                          </div>
                       </div>
                       <div className="mt-4 flex justify-between items-center bg-green-50 px-4 py-3 rounded-lg border border-green-200">
                          <span className="font-bold text-green-900 uppercase tracking-widest text-sm">Total Trip Revenue</span>
                          <span className="text-2xl font-bold text-green-700">₹{totalGross}</span>
                       </div>
                    </div>
                    <button onClick={() => setSelectedBooking(null)} className="w-full mt-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-black font-semibold transition">Close Breakdown</button>
                 </div>
               </div>
               )
            })()}
          </div>
        )}

        {/* PROPERTY REQUESTS TAB */}
        {activeTab === "Property Requests" && (() => {
          const pendingRequests = propertyRequests.map((p, idx) => ({ ...p, originalIndex: idx })).filter(p => p && p.approvalStatus === "pending");
          return (
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-xl border border-gray-200/60 shadow-sm min-h-[60vh]">
              <h3 className="text-2xl font-semibold text-gray-900 mb-1">Host Property Submissions</h3>
              <p className="text-gray-500 mb-8">Review and moderate user-submitted homestays before they go live on the platform.</p>
              {pendingRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-10 bg-gray-50/50 rounded-xl border border-gray-100">
                      <HomeIcon className="text-gray-300 mb-3" size={40} />
                      <p className="text-gray-500 font-medium text-lg">No pending property requests.</p>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 gap-5">
                    {pendingRequests.map((p) => (
                      <div key={p.originalIndex} className="p-6 border border-gray-200 rounded-xl bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm hover:shadow-md transition">
                          <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-bold text-gray-900 text-xl">{p.name}</h4>
                                  <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-yellow-200 uppercase tracking-widest">Pending Review</span>
                              </div>
                              <p className="text-sm font-medium text-blue-600 mb-2 capitalize">{p.city} Area</p>
                              <p className="text-sm text-gray-600 mb-3">{p.description}</p>
                              <div className="flex items-center gap-4 text-sm font-semibold">
                                  <span className="text-green-700 bg-green-50 px-2 py-1 rounded">Listed Price: ₹{p.price} / night</span>
                                  <span className="text-yellow-600">Initial Rating: ⭐ {p.rating}</span>
                              </div>
                          </div>
                          <div className="flex gap-3 md:flex-col lg:flex-row min-w-[220px]">
                              <button onClick={() => handleUpdatePropertyStatus(p.originalIndex, 'approved')} className="flex-1 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition">Approve Listing</button>
                              <button onClick={() => handleUpdatePropertyStatus(p.originalIndex, 'rejected')} className="flex-1 px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 text-sm font-medium rounded-lg hover:bg-red-100 transition">Reject Listing</button>
                          </div>
                      </div>
                    ))}
                  </div>
              )}
            </div>
          );
        })()}

        {/* ACTIVE PROPERTIES TAB */}
        {activeTab === "Active Properties" && (() => {
          const liveProperties = propertyRequests.map((p, idx) => ({ ...p, originalIndex: idx })).filter(p => p && p.approvalStatus === "approved");
          return (
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-xl border border-gray-200/60 shadow-sm min-h-[60vh]">
              <h3 className="text-2xl font-semibold text-gray-900 mb-1">Live Managed Properties</h3>
              <p className="text-gray-500 mb-8">View and terminate active custom homestays.</p>
              {liveProperties.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-10 bg-gray-50/50 rounded-xl border border-gray-100">
                      <CheckCircle className="text-gray-300 mb-3" size={40} />
                      <p className="text-gray-500 font-medium text-lg">No active custom listings.</p>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 gap-5">
                    {liveProperties.map((p) => (
                      <div key={p.originalIndex} className="p-6 border border-gray-200 rounded-xl bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm hover:shadow-md transition">
                          <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-bold text-gray-900 text-xl">{p.name}</h4>
                                  <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-0.5 rounded border border-green-200 uppercase tracking-widest">Public & Live</span>
                              </div>
                              <p className="text-sm font-medium text-blue-600 mb-2 capitalize">{p.city} Area | Host: {p.hostEmail}</p>
                              <p className="text-sm text-gray-600 mb-3">{p.description}</p>
                          </div>
                          <div className="flex min-w-[150px]">
                              <button onClick={() => handleDeleteProperty(p.originalIndex)} className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition shadow-sm">Terminate Listing</button>
                          </div>
                      </div>
                    ))}
                  </div>
              )}
            </div>
          );
        })()}

        {/* SETTINGS TAB */}
        {activeTab === "Settings" && (
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-xl border border-gray-200/60 shadow-sm min-h-[60vh]">
            <div className="flex justify-between items-center mb-8">
               <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-1">System Configuration</h3>
                  <p className="text-gray-500">Manage platform-wide metadata and supported locations.</p>
               </div>
               <Settings className="text-gray-400" size={32} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               {/* CITY MANAGEMENT SECTION */}
               <section>
                  <h4 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                     <Globe size={20} className="text-blue-500" />
                     Manage Supported Cities
                  </h4>
                  <div className="flex gap-2 mb-6">
                     <input type="text" placeholder="Enter new city name..." value={newCityName} onChange={(e) => setNewCityName(e.target.value)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                     <button onClick={handleAddCity} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition">Add City</button>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 max-h-[300px] overflow-y-auto">
                     {availableCities.length === 0 ? <p className="text-gray-400 text-center py-4 italic">No cities added yet.</p> : (
                        <div className="flex flex-wrap gap-2">
                           {availableCities.sort().map((c, i) => (
                              <div key={i} className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-sm">
                                 <span className="text-sm font-medium text-gray-700">{c}</span>
                                 <button onClick={() => handleDeleteCity(c)} className="text-gray-400 hover:text-red-500 p-0.5"><Trash2 size={14} /></button>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               </section>

               <section>
                  <h4 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                     <Server size={20} className="text-indigo-600" />
                     Service Status
                  </h4>
                  <div className="space-y-4">
                     <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-3">
                           <div className={`w-3 h-3 rounded-full ${backendStatus === 'online' ? 'bg-green-500' : backendStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                           <span className="font-medium">Backend API Status</span>
                        </div>
                        <span className={`text-xs font-bold uppercase ${backendStatus === 'online' ? 'text-green-600' : 'text-red-500'}`}>{backendStatus}</span>
                     </div>
                     <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                           <Mail size={16} className="text-gray-400" />
                           <p className="text-xs text-gray-500 uppercase font-bold">Email Service (Gmail)</p>
                        </div>
                        <p className="text-sm font-medium flex items-center justify-between">
                           devisrichowdaryk@gmail.com
                           <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded">ONLINE</span>
                        </p>
                     </div>
                  </div>
               </section>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200 text-gray-800">
               <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <MapPin size={22} className="text-orange-500" />
                  Manage City Attractions
               </h4>
               <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-200 flex flex-col md:flex-row gap-8">
                  <div className="flex-1 space-y-4 text-gray-800">
                     <div>
                        <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Select City</label>
                        <select value={attractionForm.city} onChange={(e) => setAttractionForm({...attractionForm, city: e.target.value})} className="w-full px-4 py-2 border rounded-lg">
                           <option value="">-- Choose City --</option>
                           {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Place Name</label>
                        <input type="text" value={attractionForm.name} onChange={(e) => setAttractionForm({...attractionForm, name: e.target.value})} placeholder="e.g. Rock Memorial" className="w-full px-4 py-2 border rounded-lg" />
                     </div>
                     <div>
                        <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Quick Description</label>
                        <textarea value={attractionForm.desc} onChange={(e) => setAttractionForm({...attractionForm, desc: e.target.value})} className="w-full px-4 py-1.5 border rounded-lg" rows="2" />
                     </div>
                     <div className="flex gap-4">
                        <div className="flex-1">
                           <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Duration</label>
                           <input type="text" value={attractionForm.duration} onChange={(e) => setAttractionForm({...attractionForm, duration: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                        </div>
                        <div className="flex-1">
                           <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Entry Fee</label>
                           <input type="text" value={attractionForm.entry} onChange={(e) => setAttractionForm({...attractionForm, entry: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                        </div>
                     </div>
                     <button onClick={handleAddAttraction} className="w-full py-3 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition">Add Attraction</button>
                  </div>
                  <div className="flex-1">
                     <label className="text-xs font-bold uppercase text-gray-500 block mb-3">Custom Attractions for {attractionForm.city || 'Global'}</label>
                     <div className="bg-white p-4 rounded-xl border border-gray-200 min-h-[400px]">
                        {(() => {
                           const cityKey = attractionForm.city.toLowerCase().replace(/\s+/g, '-');
                           const list = customAttractions[cityKey] || [];
                           if (list.length === 0) return <p className="text-center text-gray-400 mt-20 italic">No custom attractions for this city.</p>;
                           return (
                              <div className="space-y-3">
                                 {list.map((a, i) => (
                                    <div key={i} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center border border-gray-100">
                                       <div><p className="font-bold text-gray-800">{a.name}</p><p className="text-xs text-gray-500">{a.description}</p></div>
                                       <button onClick={() => handleDeleteAttraction(cityKey, i)} className="text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
                                    </div>
                                 ))}
                              </div>
                           );
                        })()}
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        <footer className="mt-20 text-center text-gray-400 font-semibold text-sm pt-8 border-t border-gray-600/50">
          © {new Date().getFullYear()} TourConnect Administration.
        </footer>
      </main>
    </div>
  );
}

function StatCard({ title, value, onClick, isHighlighted }) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white/80 backdrop-blur-md p-5 rounded-xl border shadow-sm transition-all ${
        isHighlighted ? 'border-orange-400 bg-orange-50/50 ring-2 ring-orange-200 ring-opacity-50 animate-pulse' : 'border-gray-200/60'
      } ${onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-400' : ''}`}
    >
      <p className={`text-sm mb-1 ${isHighlighted ? 'text-orange-700 font-bold' : 'text-gray-500'}`}>{title}</p>
      <h2 className={`text-3xl font-semibold ${isHighlighted ? 'text-orange-800' : 'text-gray-900'}`}>{value}</h2>
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

export default AdminDashboard;
