import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  MapPin, Shield, Users, BarChart3, LogOut, ArrowLeft, Globe, Home as HomeIcon, CheckCircle, Map, Plus, Settings, RefreshCw, Search, Filter, ChevronLeft, ChevronRight, Edit
} from "lucide-react";
import { citiesByState } from "../data/cities";
import { attractionsByCity } from "../data/attractions";
import { guidesByCity } from "../data/guides";

function AdminDashboard() {
  const navigate = useNavigate();

  console.log("🚀 TOURCONNECT ADMIN V3.0 LOADED");

  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const [allPlans, setAllPlans] = useState([]);
  const [propertyRequests, setPropertyRequests] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeTab, setActiveTab] = useState("Overview");

  const [newCity, setNewCity] = useState({ name: "", stateName: "", image: "", knownFor: "" });
  const [newAttraction, setNewAttraction] = useState({ citySlug: "", name: "", description: "", image: "", entry: "Free", duration: "" });
  const [editingCitySlug, setEditingCitySlug] = useState(null);
  const [editingAttractionKey, setEditingAttractionKey] = useState(null); // { citySlug, name }
  const [citySearch, setCitySearch] = useState("");
  const [attrSearch, setAttrSearch] = useState("");

  const handleAddCity = (e) => {
    e.preventDefault();
    if (!newCity.name || !newCity.stateName) return;

    // generate slugs
    const stateSlug = newCity.stateName.toLowerCase().replace(/\s+/g, '');
    const citySlug = newCity.name.toLowerCase().replace(/\s+/g, '-');

    const defaultImage = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2070";
    const cityData = {
      ...newCity,
      image: newCity.image || defaultImage,
      slug: citySlug,
      attractions: 0,
      homestays: 0
    };

    const local = JSON.parse(localStorage.getItem("admin_cities") || "{}");

    // If editing, remove the old version first
    if (editingCitySlug) {
      for (const state in local) {
        local[state] = local[state].filter(c => c.slug !== editingCitySlug);
        if (local[state].length === 0) delete local[state];
      }
    }

    if (!local[stateSlug]) local[stateSlug] = [];
    local[stateSlug].push(cityData);
    localStorage.setItem("admin_cities", JSON.stringify(local));

    // Update availableCities
    const available = JSON.parse(localStorage.getItem("availableCities") || "[]");
    if (editingCitySlug) {
      // Find old name to replace
      // (simplification: just filter out anything with same slug-like name)
      const filtered = available.filter(name => name.toLowerCase().replace(/\s+/g, '-') !== editingCitySlug);
      if (!filtered.includes(newCity.name)) filtered.push(newCity.name);
      localStorage.setItem("availableCities", JSON.stringify(filtered));
    } else {
      if (!available.includes(newCity.name)) {
        available.push(newCity.name);
        localStorage.setItem("availableCities", JSON.stringify(available));
      }
    }

    alert(editingCitySlug ? "City updated!" : `Success! ${newCity.name} added.`);
    setEditingCitySlug(null);
    setNewCity({ name: "", stateName: "", image: "", knownFor: "" });
    window.location.reload();
  };

  const handleDeleteCity = (citySlug) => {
    if (!window.confirm("Are you sure you want to delete this city and all its attractions?")) return;

    // 1. Remove from admin_cities (if it's there)
    const local = JSON.parse(localStorage.getItem("admin_cities") || "{}");
    for (const state in local) {
      const cityIndex = local[state].findIndex(c => c.slug === citySlug);
      if (cityIndex > -1) {
        local[state].splice(cityIndex, 1);
        if (local[state].length === 0) delete local[state];
        break;
      }
    }
    localStorage.setItem("admin_cities", JSON.stringify(local));

    // 2. Add to blacklist (to hide hardcoded ones)
    const blacklist = JSON.parse(localStorage.getItem("blacklisted_cities") || "[]");
    if (!blacklist.includes(citySlug)) {
      blacklist.push(citySlug);
      localStorage.setItem("blacklisted_cities", JSON.stringify(blacklist));
    }

    // 3. Remove attractions
    const localAttractions = JSON.parse(localStorage.getItem("admin_attractions") || "{}");
    delete localAttractions[citySlug];
    localStorage.setItem("admin_attractions", JSON.stringify(localAttractions));

    alert("City deleted!");
    window.location.reload();
  };

  const handleDeleteAttraction = (citySlug, attrName) => {
    if (!window.confirm(`Delete ${attrName}?`)) return;

    // 1. Remove from local storage if present
    const local = JSON.parse(localStorage.getItem("admin_attractions") || "{}");
    if (local[citySlug]) {
      local[citySlug] = local[citySlug].filter(a => a.name !== attrName);
      if (local[citySlug].length === 0) delete local[citySlug];
      localStorage.setItem("admin_attractions", JSON.stringify(local));
    }

    // 2. Add to blacklist (for hardcoded ones)
    const blacklist = JSON.parse(localStorage.getItem("blacklisted_attractions") || "[]");
    const key = `${citySlug}|${attrName}`;
    if (!blacklist.includes(key)) {
      blacklist.push(key);
      localStorage.setItem("blacklisted_attractions", JSON.stringify(blacklist));
    }

    alert("Attraction deleted!");
    window.location.reload();
  };

  const handleAddAttraction = (e) => {
    e.preventDefault();
    if (!newAttraction.citySlug || !newAttraction.name) return;

    const attractionData = {
      name: newAttraction.name,
      description: newAttraction.description,
      image: newAttraction.image || "",
      entry: newAttraction.entry,
      duration: newAttraction.duration
    };

    const local = JSON.parse(localStorage.getItem("admin_attractions") || "{}");

    // If editing OR overwriting hardcoded, clear any blacklist for this specific key
    const blacklist = JSON.parse(localStorage.getItem("blacklisted_attractions") || "[]");
    const key = `${newAttraction.citySlug}|${newAttraction.name}`;
    localStorage.setItem("blacklisted_attractions", JSON.stringify(blacklist.filter(k => k !== key)));

    // If editing, remove old entry from local storage
    if (editingAttractionKey) {
      const { citySlug, name } = editingAttractionKey;
      if (local[citySlug]) {
        local[citySlug] = local[citySlug].filter(a => a.name !== name);
      }
    }

    if (!local[newAttraction.citySlug]) local[newAttraction.citySlug] = [];
    local[newAttraction.citySlug].push(attractionData);
    localStorage.setItem("admin_attractions", JSON.stringify(local));

    alert(editingAttractionKey ? "Attraction updated!" : "Attraction saved successfully!");
    setEditingAttractionKey(null);
    setNewAttraction({ citySlug: "", name: "", description: "", image: "", entry: "Free", duration: "" });
    window.location.reload();
  };

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem("token");

      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (!storedUser || storedUser.role?.toLowerCase() !== "admin") {
        alert("Access Denied: This dashboard is for admins only.");
        navigate("/login");
        return;
      }

      setUser(storedUser);

      // ✅ Sync with Local Storage for offline/demo data
      const pending = (JSON.parse(localStorage.getItem("pending_properties") || "[]")).map(p => ({ ...p, _sourceKey: "pending_properties" }));
      const live = (JSON.parse(localStorage.getItem("homestays") || "[]")).map(p => ({ ...p, _sourceKey: "homestays" }));

      const allHostStays = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('host_stays_')) {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            if (Array.isArray(data)) {
              data.forEach(item => {
                // If it's a homestay submission
                if (item.id && (item.name || item.title)) {
                  allHostStays.push({ ...item, _sourceKey: key });
                }
              });
            }
          } catch (e) { }
        }
      }
      setPropertyRequests([...pending, ...live, ...allHostStays]);

      const normalizeUser = (u) => {
        const role = (u.role || "tourist").toLowerCase();
        const email = (u.email || "").toLowerCase();

        // Auto-approve Tourists, Admins, AND your default test accounts
        const isDefaultAccount = email === "host@test.com" || email === "guide@test.com" || email === "admin@test.com";
        const isApproved = u.approved === true || u.approvalStatus === "approved" ||
          role === "tourist" || role === "admin" || isDefaultAccount;

        return {
          ...u,
          name: u.name || u.fullName || "Unknown User",
          role: role,
          approved: isApproved,
          approvalStatus: isApproved ? "approved" : (u.approvalStatus || "pending")
        };
      };

      try {
        const usersRes = await axios.get("http://localhost:8080/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const usersData = usersRes.data?.data ?? usersRes.data;
        const backendUsers = Array.isArray(usersData) ? usersData : [];
        const localUsers = JSON.parse(localStorage.getItem("users")) || [];

        const merged = backendUsers.map(normalizeUser);
        localUsers.forEach(lu => {
          if (!merged.find(u => u.email === lu.email)) {
            merged.push(normalizeUser(lu));
          }
        });
        setAllUsers(merged);
      } catch {
        const localUsers = JSON.parse(localStorage.getItem("users")) || [];
        setAllUsers(localUsers.map(normalizeUser));
      }

      const computeOverallStatus = (b) => {
        if (!b) return "pending";
        const gStat = (b.guideStatus || "").toLowerCase().trim();
        const hStat = (b.homestayStatus || "").toLowerCase().trim();
        if (gStat === "rejected" || hStat === "rejected") return "rejected";
        const hasG = b.guideName && b.guideName !== "N/A";
        const hasH = b.homestayName && b.homestayName !== "N/A";
        const gOk = !hasG || gStat === "confirmed";
        const hOk = !hasH || hStat === "confirmed";
        if (gOk && hOk) return "confirmed";
        return "pending";
      };

      try {
        const plansRes = await axios.get("http://localhost:8080/api/admin/bookings", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const plansData = plansRes.data?.data ?? plansRes.data;
        const backendPlans = Array.isArray(plansData) ? plansData : [];
        const localPlans = JSON.parse(localStorage.getItem("savedPlans")) || [];

        const getUniqueKey = (item) => {
          const sDate = item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : "";
          const eDate = item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : "";
          const city = (item.city || item.cities || "").toLowerCase().trim();
          const email = (item.userEmail || "").toLowerCase().trim();
          return `${city}-${sDate}-${eDate}-${email}`;
        };

        const mergedMap = new Map();
        backendPlans.forEach(p => { mergedMap.set(getUniqueKey(p), { ...p }); });
        localPlans.forEach(lp => {
          const key = getUniqueKey(lp);
          if (mergedMap.has(key)) {
            const existing = mergedMap.get(key);
            mergedMap.set(key, {
              ...existing,
              guideStatus: lp.guideStatus || existing.guideStatus,
              homestayStatus: lp.homestayStatus || existing.homestayStatus,
              touristName: lp.touristName || existing.touristName,
              userEmail: lp.userEmail || existing.userEmail
            });
          } else {
            mergedMap.set(key, { ...lp });
          }
        });

        const finalizedPlans = Array.from(mergedMap.values()).map(p => ({
          ...p,
          status: computeOverallStatus(p)
        }));
        setAllPlans(finalizedPlans);
      } catch {
        const localPlans = JSON.parse(localStorage.getItem("savedPlans")) || [];
        setAllPlans(localPlans.map(lp => ({ ...lp, status: computeOverallStatus(lp) })));
      }

      try {
        const propertyRes = await axios.get("http://localhost:8080/api/admin/properties", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const propData = propertyRes.data?.data ?? propertyRes.data;
        const backendProps = Array.isArray(propData) ? propData : [];

        // 🔥 SYNC WITH OUR NEW STORAGE KEYS
        const pendingProps = JSON.parse(localStorage.getItem("pending_properties") || "[]");
        const liveProps = JSON.parse(localStorage.getItem("homestays") || "[]");
        const localAll = [...pendingProps, ...liveProps];

        const mergedProps = [...backendProps];
        localAll.forEach(lp => {
          if (!mergedProps.find(p => p.id === lp.id)) {
            mergedProps.push(lp);
          }
        });
        setPropertyRequests(mergedProps);
      } catch {
        const pendingProps = JSON.parse(localStorage.getItem("pending_properties") || "[]");
        const liveProps = JSON.parse(localStorage.getItem("homestays") || "[]");
        setPropertyRequests([...pendingProps, ...liveProps]);
      }

    } catch (err) {
      console.error("Admin data sync error:", err);
      // Full fallback
      const localUsers = JSON.parse(localStorage.getItem("users")) || [];
      setAllUsers(localUsers.map(u => ({ ...u, name: u.name || u.fullName })));

      const localPlans = JSON.parse(localStorage.getItem("savedPlans")) || [];
      setAllPlans(localPlans.map(lp => ({ ...lp, status: computeOverallStatus(lp) })));

      // ✅ DEEP SCAN: Find properties even from old/different keys
      const allPending = [];
      const allLive = JSON.parse(localStorage.getItem("homestays") || "[]");

      // Check the standard pending list
      const standardPending = JSON.parse(localStorage.getItem("pending_properties") || "[]");
      allPending.push(...standardPending);

      // Aggressive scan for host-specific lists (migration/repair)
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("host_stays_") || key === "customHomestays") {
          const list = JSON.parse(localStorage.getItem(key) || "[]");
          list.forEach(p => {
            if (p.approvalStatus === "pending" || p.status === "pending") {
              if (!allPending.find(ap => ap.id === p.id)) allPending.push(p);
            } else if (p.approvalStatus === "approved" || p.status === "approved") {
              if (!allLive.find(al => al.id === p.id)) allLive.push(p);
            }
          });
        }
      }

      setPropertyRequests([...allPending, ...allLive]);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 30000);

    // 🔥 REAL-TIME WATCHER
    const handleSync = () => fetchAdminData();
    window.addEventListener("storage", handleSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleSync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateUserStatus = async (id, status) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:8080/api/admin/user/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAllUsers(prev => prev.map(u => u.id === id ? { ...u, approved: status === "approved", approvalStatus: status } : u));
    } catch {
      alert("Failed to update user");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:8080/api/admin/user/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch { /* ignore backend error, still remove locally */ }
    // remove from localStorage
    const localUsers = JSON.parse(localStorage.getItem("users")) || [];
    localStorage.setItem("users", JSON.stringify(localUsers.filter(u => String(u.id) !== String(id))));
    setAllUsers(prev => prev.filter(u => String(u.id) !== String(id)));
  };

  const handleDeleteAllTourists = async () => {
    if (!window.confirm("Delete ALL tourist accounts from localStorage and database? This cannot be undone.")) return;
    // 1. clean localStorage
    const localUsers = JSON.parse(localStorage.getItem("users")) || [];
    const kept = localUsers.filter(u => u.role?.toLowerCase() !== "tourist");
    localStorage.setItem("users", JSON.stringify(kept));
    // 2. call backend
    try {
      const token = localStorage.getItem("token");
      await axios.delete("http://localhost:8080/api/admin/users/tourists", {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch { /* backend may be offline */ }
    // 3. update state
    setAllUsers(prev => prev.filter(u => u.role?.toLowerCase() !== "tourist"));
    alert("All tourist accounts deleted.");
  };

  const handleUpdatePropertyStatusV2 = (id, newStatus) => {
    if (!window.confirm(`Are you sure you want to ${newStatus} this property?`)) return;

    // 1. Find the property in our state
    const property = propertyRequests.find(p => String(p.id) === String(id));
    if (!property || !property._sourceKey) {
      alert("Error: Source folder not identified. Try refreshing the page.");
      return;
    }

    const sourceKey = property._sourceKey;
    const sourceList = JSON.parse(localStorage.getItem(sourceKey) || "[]");
    const foundInSource = sourceList.find(item => String(item.id) === String(id));

    if (!foundInSource) {
      alert("Property already processed or folder changed.");
      window.location.reload();
      return;
    }

    // 2. Remove from source
    localStorage.setItem(sourceKey, JSON.stringify(sourceList.filter(item => String(item.id) !== String(id))));

    // 3. Move to target
    if (newStatus === 'APPROVED') {
      const live = JSON.parse(localStorage.getItem("homestays") || "[]");
      live.push({ ...foundInSource, status: "approved", approvalStatus: "approved", isLive: true });
      localStorage.setItem("homestays", JSON.stringify(live));
      alert("Success! Approved and Live on City page.");
    } else {
      const rejected = JSON.parse(localStorage.getItem("rejected_properties") || "[]");
      rejected.push({ ...foundInSource, status: "rejected", approvalStatus: "rejected" });
      localStorage.setItem("rejected_properties", JSON.stringify(rejected));
      alert("Property Rejected.");
    }

    window.location.reload();
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/", { replace: true });
  };

  if (!user) return null;

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

      {/* SIDEBAR */}
      <aside className="w-64 bg-white/75 backdrop-blur-xl border-r border-gray-200/60 fixed h-full z-10 hidden md:flex flex-col">
        <div onClick={() => navigate("/")} className="p-6 flex items-center gap-3 border-b border-gray-100/60 cursor-pointer hover:bg-white/40 transition-colors">
          <MapPin fill="#eab308" className="text-white" size={24} />
          <span className="text-xl font-bold tracking-tight text-gray-900">TourMate</span>
        </div>

        <div className="flex-1 px-4 py-8 space-y-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3">Admin Panel</p>
          <SidebarItem icon={<BarChart3 size={18} />} label="Overview" active={activeTab === "Overview"} onClick={() => setActiveTab("Overview")} />
          <SidebarItem icon={<Users size={18} />} label="Manage Users" active={activeTab === "Manage Users"} onClick={() => setActiveTab("Manage Users")} />
          <SidebarItem icon={<Globe size={18} />} label="All Bookings" active={activeTab === "All Bookings"} onClick={() => setActiveTab("All Bookings")} />
          <SidebarItem icon={<HomeIcon size={18} />} label="Property Requests" active={activeTab === "Property Requests"} onClick={() => setActiveTab("Property Requests")} />
          <SidebarItem icon={<CheckCircle size={18} />} label="Active Properties" active={activeTab === "Active Properties"} onClick={() => setActiveTab("Active Properties")} />
          <SidebarItem icon={<Map size={18} />} label="Destinations" active={activeTab === "Destinations"} onClick={() => setActiveTab("Destinations")} />
        </div>

        <div className="p-4 border-t border-gray-100/60 mb-16 flex flex-col gap-1">
          <SidebarItem icon={<ArrowLeft size={18} />} label="Back to Home" onClick={() => navigate("/")} />
          <SidebarItem icon={<LogOut size={18} />} label="Sign Out" onClick={handleLogout} isDanger />
        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 md:ml-64 p-6 md:p-10 relative max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-white drop-shadow-sm flex items-center gap-3">
              <Shield className="text-yellow-400" size={28} />
              TourMate Administration <span className="text-[10px] bg-yellow-500 text-black px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Ver 3.0</span>
            </h1>
            <p className="text-gray-300 mt-1">Hello {user?.fullName?.split(" ")[0]}, monitor platform health and usage.</p>
          </div>
          <div onClick={() => setActiveTab("Settings")} className="hidden md:flex items-center gap-3 cursor-pointer hover:bg-white/10 py-1.5 px-3 rounded-xl transition">
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
              <StatCard title="Active Plans" value={allPlans.length} onClick={() => setActiveTab("All Bookings")} />
              <StatCard title="Live Guides" value={allUsers.filter(u => u.role === 'guide').length} onClick={() => setActiveTab("Manage Users")} />
              <StatCard title="Properties" value={propertyRequests.length} onClick={() => setActiveTab("Property Requests")} />
            </div>

            <section className="bg-white/80 backdrop-blur-md p-6 rounded-xl border border-gray-200/60 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-5">Recent Bookings</h3>
              {allPlans.length === 0 ? (
                <p className="text-gray-500 py-4">No recent activity.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allPlans.slice(-4).map((t, idx) => (
                    <div key={t.id || idx} className="p-4 border border-gray-100 rounded-lg bg-white/60 flex flex-col hover:border-blue-300 transition">
                      <h4 className="font-semibold text-gray-900">{t.cities || t.city} Trip</h4>
                      <p className="text-sm text-gray-500 mt-1">Tourist: {t.touristName || t.userEmail}</p>
                      {t.homestayName && <p className="text-sm text-gray-500">🏡 {t.homestayName} (Status: {t.homestayStatus || "N/A"})</p>}
                      {t.guideName && <p className="text-sm text-gray-500">👨‍🏫 {t.guideName} (Status: {t.guideStatus || "N/A"})</p>}
                      <span className={`mt-2 self-start px-2 py-0.5 rounded text-xs font-bold uppercase ${t.status?.toLowerCase() === 'confirmed' ? 'bg-green-100 text-green-700' :
                        t.status?.toLowerCase() === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>{t.status || 'pending'}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* MANAGE USERS TAB */}
        {activeTab === "Manage Users" && (() => {
          const filteredUsers = allUsers.filter(u => {
            const matchesSearch = (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || (u.email || "").toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = roleFilter === "all" || (u.role || "tourist").toLowerCase() === roleFilter;
            return matchesSearch && matchesRole;
          });
          const totalPages = Math.ceil(filteredUsers.length / usersPerPage) || 1;
          const paginatedUsers = filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

          return (
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-xl border border-gray-200/60 shadow-sm min-h-[60vh]">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-1">User Directory</h3>
                  <p className="text-gray-500">View and manage the {allUsers.length} registered users on the TourMate platform.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
                  <button onClick={handleDeleteAllTourists} className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition whitespace-nowrap">Delete All Tourists</button>
                  <div className="relative flex-1 md:w-64">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Search users..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition" />
                  </div>
                  <div className="relative">
                    <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }} className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition cursor-pointer">
                      <option value="all">All Roles</option>
                      <option value="tourist">Tourists</option>
                      <option value="guide">Guides</option>
                      <option value="host">Hosts</option>
                    </select>
                  </div>
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-gray-50/50 rounded-xl border border-gray-100">
                  <Users className="text-gray-300 mb-3" size={40} />
                  <p className="text-gray-500 font-medium text-lg">No users match your filters.</p>
                  <button onClick={() => { setSearchQuery(""); setRoleFilter("all"); }} className="mt-3 text-sm text-blue-600 font-medium hover:underline">Clear Filters</button>
                </div>
              ) : (
                <div className="w-full flex flex-col">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                      <thead className="bg-gray-50/80 border-b border-gray-100">
                        <tr>
                          <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                          <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                          <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {paginatedUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold shadow-sm">
                                  {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                                </div>
                                <span className="font-semibold text-gray-900 truncate max-w-[150px]">{u.name}</span>
                              </div>
                            </td>
                            <td className="p-4 text-sm text-gray-600 font-medium truncate max-w-[200px]">{u.email}</td>
                            <td className="p-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' :
                                u.role === 'guide' ? 'bg-amber-100 text-amber-700' :
                                  u.role === 'host' ? 'bg-emerald-100 text-emerald-700' :
                                    'bg-slate-100 text-slate-700'
                                }`}>
                                {u.role || 'tourist'}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${u.approved ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                <span className={`text-xs font-bold uppercase tracking-wide ${u.approved ? 'text-emerald-700' : 'text-amber-600'}`}>
                                  {u.approved ? 'Approved' : 'Pending'}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              {u.role !== 'admin' && (
                                <div className="flex gap-2 justify-end">
                                  {!u.approved ? (
                                    <button onClick={() => handleUpdateUserStatus(u.id, 'approved')} className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-semibold rounded-lg hover:bg-emerald-600 transition shadow-sm">Approve</button>
                                  ) : (
                                    <button onClick={() => handleUpdateUserStatus(u.id, 'rejected')} className="px-3 py-1.5 bg-amber-50 text-amber-600 border border-amber-200 text-xs font-semibold rounded-lg hover:bg-amber-100 transition shadow-sm">Revoke</button>
                                  )}
                                  <button onClick={() => handleDeleteUser(u.id)} className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 text-xs font-semibold rounded-lg hover:bg-red-100 transition shadow-sm">Remove</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  <div className="mt-6 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Showing <span className="font-medium text-gray-900">{(currentPage - 1) * usersPerPage + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * usersPerPage, filteredUsers.length)}</span> of <span className="font-medium text-gray-900">{filteredUsers.length}</span> users
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <span className="text-sm font-medium text-gray-700 px-2">Page {currentPage} of {totalPages}</span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

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
                      <h4 className="font-semibold text-gray-900 text-lg">{t.cities} Trip</h4>
                      <p className="text-sm text-gray-500 mt-1">Tourist: {t.touristName}</p>
                      <p className="text-sm text-slate-500 mt-1">Dates: {t.startDate} → {t.endDate}</p>
                      {t.homestayName && <p className="text-sm text-gray-500">🏡 Homestay: {t.homestayName}</p>}
                      {t.guideName && <p className="text-sm text-gray-500">👨🏫 Guide: {t.guideName}</p>}
                      <span className={`mt-2 inline-block px-2.5 py-0.5 rounded text-xs font-bold uppercase ${t.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        t.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>{t.status}</span>
                    </div>
                    <button onClick={() => setSelectedBooking(t)} className="px-4 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800 transition">View Details</button>
                  </div>
                ))}
              </div>
            )}

            {/* BOOKING DETAILS MODAL */}
            {selectedBooking && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl p-6 mt-16 max-h-[85vh] overflow-y-auto">
                  <h3 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-4 mb-4">Booking Details</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Booking User</p>
                      <p className="text-lg text-blue-700 font-semibold">{selectedBooking.touristName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Tourist Name</p>
                      <p className="text-base text-gray-800">{selectedBooking.touristName}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Homestay</p>
                        <p className="text-sm font-semibold text-gray-800">{selectedBooking.homestayName || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Guide</p>
                        <p className="text-sm font-semibold text-gray-800">{selectedBooking.guideName || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-green-50 px-4 py-3 rounded-lg border border-green-200">
                      <span className="font-bold text-green-900 uppercase tracking-widest text-sm">Status</span>
                      <span className="text-lg font-bold text-green-700">{selectedBooking.status}</span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedBooking(null)} className="w-full mt-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-black font-semibold transition">Close</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PROPERTY REQUESTS TAB */}
        {activeTab === "Property Requests" && (() => {
          const pendingRequests = propertyRequests.filter(p => {
            const s = (p.status || p.approvalStatus || "pending").toLowerCase();
            return s === "pending";
          });
          return (
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-xl border border-gray-200/60 shadow-sm min-h-[60vh]">
              <h3 className="text-2xl font-semibold text-gray-900 mb-1">Host Property Submissions</h3>
              <p className="text-gray-500 mb-8">Review and moderate user-submitted homestays before they go live.</p>
              {pendingRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-10 bg-gray-50/50 rounded-xl border border-gray-100">
                  <HomeIcon className="text-gray-300 mb-3" size={40} />
                  <p className="text-gray-500 font-medium text-lg">No pending property requests.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5">
                  {pendingRequests.map((p, idx) => (
                    <div key={p.id} className="p-4 border border-gray-200 rounded-xl bg-white flex flex-col md:flex-row items-center gap-6 shadow-sm">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-bold text-gray-900 text-xl">{p.name || p.title}</h4>
                          <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded border border-yellow-200 uppercase">Pending Review</span>
                        </div>
                        <p className="text-sm font-semibold text-blue-600 mb-1">City: {p.city}</p>
                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{p.description}</p>
                        <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
                          <span>Host: {p.hostName}</span>
                          <span>Price: ₹{p.price}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <button onClick={() => handleUpdatePropertyStatusV2(p.id, 'APPROVED')} className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition">Approve</button>
                        <button onClick={() => handleUpdatePropertyStatusV2(p.id, 'REJECTED')} className="flex-1 px-4 py-2 bg-red-50 text-red-700 border border-red-200 text-sm font-semibold rounded-lg hover:bg-red-100 transition">Reject</button>
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
          const liveProperties = propertyRequests.filter(p => {
            const s = (p.status || p.approvalStatus || "").toLowerCase();
            return s === "approved";
          });
          return (
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-xl border border-gray-200/60 shadow-sm min-h-[60vh]">
              <h3 className="text-2xl font-semibold text-gray-900 mb-1">Live Managed Properties</h3>
              <p className="text-gray-500 mb-8">View active approved homestays on the platform.</p>
              {liveProperties.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-10 bg-gray-50/50 rounded-xl border border-gray-100">
                  <CheckCircle className="text-gray-300 mb-3" size={40} />
                  <p className="text-gray-500 font-medium text-lg">No active custom listings.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5">
                  {liveProperties.map((p) => (
                    <div key={p.id} className="p-4 border border-gray-200 rounded-xl bg-white flex flex-col md:flex-row items-center gap-6 shadow-sm">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-lg">{p.name || p.title}</h4>
                        <p className="text-sm text-blue-600">{p.city}</p>
                        <p className="text-xs text-gray-400 mt-1">Host: {p.hostName}</p>
                      </div>
                      <button onClick={() => {
                        const all = JSON.parse(localStorage.getItem("homestays") || "[]");
                        const filtered = all.filter(item => item.id !== p.id);
                        localStorage.setItem("homestays", JSON.stringify(filtered));
                        window.location.reload();
                      }} className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-lg hover:bg-red-100 transition">Remove Listing</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* DESTINATIONS TAB */}
        {activeTab === "Destinations" && (
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-xl border border-gray-200/60 shadow-sm min-h-[60vh]">
            <h3 className="text-2xl font-semibold text-gray-900 mb-1">Manage Destinations</h3>
            <p className="text-gray-500 mb-8">Add new cities and local attractions to expand the platform footprint.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <MapPin size={20} className="text-blue-500" />
                  {editingCitySlug ? "Update City" : "Add New City"}
                </h4>
                <form onSubmit={handleAddCity} className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600">City Name</label>
                    <input type="text" className="w-full mt-1 p-2 border border-gray-200 rounded-lg" required value={newCity.name} onChange={e => setNewCity({ ...newCity, name: e.target.value })} placeholder="e.g. Surat" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">State Name</label>
                    <input type="text" className="w-full mt-1 p-2 border border-gray-200 rounded-lg" required value={newCity.stateName} onChange={e => setNewCity({ ...newCity, stateName: e.target.value })} placeholder="e.g. Gujarat" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Image URL</label>
                    <input type="url" className="w-full mt-1 p-2 border border-gray-200 rounded-lg" value={newCity.image} onChange={e => setNewCity({ ...newCity, image: e.target.value })} placeholder="https://..." />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Known For</label>
                    <input type="text" className="w-full mt-1 p-2 border border-gray-200 rounded-lg" value={newCity.knownFor} onChange={e => setNewCity({ ...newCity, knownFor: e.target.value })} placeholder="e.g. Diamond City" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-grow py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2">
                      <Plus size={18} /> {editingCitySlug ? "Update City" : "Save City"}
                    </button>
                    {editingCitySlug && (
                      <button
                        type="button"
                        onClick={() => { setEditingCitySlug(null); setNewCity({ name: "", stateName: "", image: "", knownFor: "" }); }}
                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-semibold hover:bg-gray-200 transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Map size={20} className="text-emerald-500" />
                  {editingAttractionKey ? "Update Attraction" : "Add New Attraction"}
                </h4>
                <form onSubmit={handleAddAttraction} className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Select City</label>
                    <select className="w-full mt-1 p-2 border border-gray-200 rounded-lg" required value={newAttraction.citySlug} onChange={e => setNewAttraction({ ...newAttraction, citySlug: e.target.value })}>
                      <option value="">-- Choose a city --</option>
                      {(() => {
                        const hardcoded = Object.values(citiesByState).flat();
                        const localAdmin = JSON.parse(localStorage.getItem("admin_cities") || "{}");
                        const localList = Object.values(localAdmin).flat();
                        const allCities = [...hardcoded, ...localList.filter(lc => !hardcoded.find(h => h.slug === lc.slug))];
                        return allCities.map(city => (
                          <option key={city.slug} value={city.slug}>{city.name} ({city.stateName})</option>
                        ));
                      })()}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Attraction Name</label>
                    <input type="text" className="w-full mt-1 p-2 border border-gray-200 rounded-lg" required value={newAttraction.name} onChange={e => setNewAttraction({ ...newAttraction, name: e.target.value })} placeholder="e.g. Dumas Beach" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Description</label>
                    <input type="text" className="w-full mt-1 p-2 border border-gray-200 rounded-lg" required value={newAttraction.description} onChange={e => setNewAttraction({ ...newAttraction, description: e.target.value })} placeholder="Short description..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Entry</label>
                      <select className="w-full mt-1 p-2 border border-gray-200 rounded-lg" value={newAttraction.entry} onChange={e => setNewAttraction({ ...newAttraction, entry: e.target.value })}>
                        <option value="Free">Free</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Duration</label>
                      <input type="text" className="w-full mt-1 p-2 border border-gray-200 rounded-lg" value={newAttraction.duration} onChange={e => setNewAttraction({ ...newAttraction, duration: e.target.value })} placeholder="e.g. 1-2 hrs" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Image URL (Optional)</label>
                    <input type="url" className="w-full mt-1 p-2 border border-gray-200 rounded-lg" value={newAttraction.image} onChange={e => setNewAttraction({ ...newAttraction, image: e.target.value })} placeholder="https://..." />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-grow py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition flex items-center justify-center gap-2">
                      <Plus size={18} /> {editingAttractionKey ? "Update Attraction" : "Save Attraction"}
                    </button>
                    {editingAttractionKey && (
                      <button
                        type="button"
                        onClick={() => { setEditingAttractionKey(null); setNewAttraction({ citySlug: "", name: "", description: "", image: "", entry: "Free", duration: "" }); }}
                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-semibold hover:bg-gray-200 transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            <div className="mt-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <h4 className="text-lg font-bold text-gray-800">Present Cities</h4>
                <div className="relative w-full md:w-64">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search cities..."
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(() => {
                  const hardcoded = Object.values(citiesByState).flat();
                  const localAdmin = JSON.parse(localStorage.getItem("admin_cities") || "{}");
                  const localList = Object.values(localAdmin).flat();
                  const blacklisted = JSON.parse(localStorage.getItem("blacklisted_cities") || "[]");

                  const merged = hardcoded.map(h => {
                    const localVersion = localList.find(l => l.slug === h.slug);
                    return localVersion || h;
                  });

                  const trulyNewLocal = localList.filter(l => !hardcoded.find(hc => hc.slug === l.slug));

                  const allDisplay = [...merged, ...trulyNewLocal]
                    .filter(c => !blacklisted.includes(c.slug))
                    .filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase()));

                  if (allDisplay.length === 0) return <p className="text-sm text-gray-400 italic col-span-full py-4 text-center">No cities found matching your search.</p>;

                  return allDisplay.map((city, idx) => {
                    const hardcodedAttrs = attractionsByCity[city.slug] || [];
                    const adminAttrs = (JSON.parse(localStorage.getItem("admin_attractions") || "{}"))[city.slug] || [];
                    const totalAttractions = [...hardcodedAttrs, ...adminAttrs].length;

                    return (
                      <div key={`${city.slug}-${idx}`} className="p-3 border border-gray-100 rounded-lg bg-gray-50 flex items-center justify-between shadow-sm">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{city.name}</p>
                          <p className="text-xs text-gray-500 font-medium">
                            {totalAttractions} Attractions
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingCitySlug(city.slug);
                              setNewCity({
                                name: city.name,
                                stateName: city.stateName,
                                image: city.image.includes("unsplash") && city.image.includes("464822759023") ? "" : city.image,
                                knownFor: city.knownFor
                              });
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                            title="Edit City"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteCity(city.slug)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Delete City"
                          >
                            <LogOut size={16} className="rotate-90" />
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Settings size={20} className="text-gray-500" /> Manage All Attractions</h4>
                <div className="relative w-full md:w-64">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search attractions..."
                    value={attrSearch}
                    onChange={(e) => setAttrSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
              <div className="space-y-3">
                {(() => {
                  const localAttractions = JSON.parse(localStorage.getItem("admin_attractions") || "{}");
                  const blacklisted = JSON.parse(localStorage.getItem("blacklisted_attractions") || "[]");
                  const allRows = [];

                  const hardcodedCities = Object.values(citiesByState).flat();
                  const localCities = Object.values(JSON.parse(localStorage.getItem("admin_cities") || "{}")).flat();
                  const allCitySlugs = [...new Set([...hardcodedCities.map(c => c.slug), ...localCities.map(c => c.slug)])];

                  allCitySlugs.forEach(citySlug => {
                    const hardcoded = attractionsByCity[citySlug] || [];
                    const local = localAttractions[citySlug] || [];

                    const merged = hardcoded.map(h => {
                      const localVersion = local.find(l => l.name === h.name);
                      return localVersion || h;
                    });
                    const trulyNewLocal = local.filter(l => !hardcoded.find(hc => hc.name === l.name));

                    [...merged, ...trulyNewLocal].forEach(attr => {
                      const key = `${citySlug}|${attr.name}`;
                      if (!blacklisted.includes(key)) {
                        allRows.push({ citySlug, ...attr });
                      }
                    });
                  });

                  const filteredRows = allRows.filter(row =>
                    row.name.toLowerCase().includes(attrSearch.toLowerCase()) ||
                    row.citySlug.toLowerCase().includes(attrSearch.toLowerCase())
                  );

                  if (filteredRows.length === 0) return <p className="text-sm text-gray-400 italic py-4 text-center">No attractions found matching your search.</p>;

                  return filteredRows.map((attr, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                      <div>
                        <p className="font-bold text-gray-900">{attr.name}</p>
                        <p className="text-xs text-gray-500 uppercase font-semibold">City: {attr.citySlug}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingAttractionKey({ citySlug: attr.citySlug, name: attr.name });
                            setNewAttraction({
                              citySlug: attr.citySlug,
                              name: attr.name,
                              description: attr.description,
                              image: attr.image,
                              entry: attr.entry,
                              duration: attr.duration
                            });
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAttraction(attr.citySlug, attr.name)}
                          className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}{/* SETTINGS TAB */}
        {activeTab === "Settings" && (
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-xl border border-gray-200/60 shadow-sm min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
              <Settings className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">System Configuration</h3>
              <p className="text-gray-500">Platform-wide settings and API keys can be managed here.</p>
            </div>
          </div>
        )}

        <footer className="mt-20 text-center text-gray-400 font-semibold text-sm pt-8 border-t border-gray-600/50">
          © {new Date().getFullYear()} TourMate Administration.
        </footer>
      </main>
    </div>
  );
}

function StatCard({ title, value, onClick }) {
  return (
    <div onClick={onClick} className={`bg-white/80 backdrop-blur-md p-5 rounded-xl border border-gray-200/60 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-400 transition-all' : ''}`}>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <h2 className="text-3xl font-semibold text-gray-900">{value}</h2>
    </div>
  );
}

function SidebarItem({ label, active, onClick, icon, isDanger }) {
  return (
    <div
      onClick={onClick}
      className={`px-4 py-2.5 mx-2 rounded-lg cursor-pointer transition-colors flex items-center gap-3 text-sm font-medium
        ${active ? "bg-white/80 text-gray-900 shadow-sm border border-gray-200/50"
          : isDanger ? "text-red-500 hover:bg-red-50 mt-4"
            : "text-gray-500 hover:bg-white/60 hover:text-gray-900"
        }`}
    >
      {icon}
      {label}
    </div>
  );
}

export default AdminDashboard;