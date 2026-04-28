import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
   MapPin, Shield, Users, BarChart3, Settings, LogOut, ArrowLeft, Globe, Home as HomeIcon, CheckCircle, Trash2, Mail, Server, Pencil, X
} from "lucide-react";
import { citiesByState } from "../data/cities"; // ✅ IMPORT MASTER LIST
import { attractionsByCity } from "../data/attractions"; // ✅ IMPORT ATTRACTIONS LIST

function AdminDashboard() {
   const navigate = useNavigate();

   const [user, setUser] = useState(null);
   const [allUsers, setAllUsers] = useState([]);
   const [allPlans, setAllPlans] = useState([]);
   const [propertyRequests, setPropertyRequests] = useState([]);
   const [availableCities, setAvailableCities] = useState([]); // ✅ CITY MANAGEMENT
   const [cityForm, setCityForm] = useState({ name: "", state: "", image: "", knownFor: "" });
   const [editingCity, setEditingCity] = useState(null); // ✅ EDIT CITY STATE
   const [editingAttraction, setEditingAttraction] = useState(null); // ✅ EDIT ATTRACTION STATE
   const [customAttractions, setCustomAttractions] = useState({});
   const [attractionForm, setAttractionForm] = useState({ city: "", name: "", desc: "", duration: "1-2 hrs", entry: "Free", image: "" });
   const [selectedBooking, setSelectedBooking] = useState(null);
   const [activeTab, setActiveTab] = useState("Overview");
   const [backendStatus, setBackendStatus] = useState("checking");
   const [citySearch, setCitySearch] = useState("");
   const [attractionSearch, setAttractionSearch] = useState("");

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

      // Seed default users only if they don't already exist
      const defaultUsers = [
         { id: 3, fullName: "Admin User", email: "admin@test.com", password: "admin123", role: "admin", approvalStatus: "approved" },
         { id: 4, fullName: "Host User", email: "host@test.com", password: "host123", role: "host", approvalStatus: "approved" },
         { id: 5, fullName: "Guide User", email: "guide@test.com", password: "guide123", role: "guide", approvalStatus: "approved" }
      ];
      const existingUsers = JSON.parse(localStorage.getItem("users")) || [];
      defaultUsers.forEach(def => {
         if (!existingUsers.find(u => u.email?.toLowerCase() === def.email)) {
            existingUsers.push(def);
         }
      });
      localStorage.setItem("users", JSON.stringify(existingUsers));
      setAllUsers(existingUsers);

      // ✅ Sync with Local Storage (Deep Scan)
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
                     if (item.id && (item.name || item.title)) {
                        allHostStays.push({ ...item, _sourceKey: key });
                     }
                  });
               }
            } catch (e) { }
         }
      }
      const combined = [...pending, ...live, ...allHostStays];
      // Filter out duplicates by ID or by Name+City+Host combo
      const getPropRef = (p) => `${p.name || p.title}-${p.city}-${p.hostEmail || p.email}`.toLowerCase().trim();
      const uniqueStays = combined.filter((v, i, a) =>
         a.findIndex(t => String(t.id) === String(v.id) || getPropRef(t) === getPropRef(v)) === i
      );
      setPropertyRequests(uniqueStays);

      // ✅ INIT CITIES
      let storedCities = JSON.parse(localStorage.getItem("availableCities"));
      if (!storedCities || storedCities.length === 0 || typeof storedCities[0] === 'string') {
         // Migrate or Init with objects
         storedCities = [
            { name: "Hyderabad", state: "Telangana", knownFor: "Charminar, Biryani", image: "https://images.unsplash.com/photo-1551161242-b5af797b7233" },
            { name: "Warangal", state: "Telangana", knownFor: "Warangal Fort", image: "https://media.istockphoto.com/id/502637462/photo/warangal-fort.jpg" },
            { name: "Mumbai", state: "Maharashtra", knownFor: "Gateway of India", image: "https://images.unsplash.com/photo-1595658658481-d53d3f999875" },
            { name: "Pune", state: "Maharashtra", knownFor: "IT Hub", image: "https://mittalbuilders.com/news-media/wp-content/uploads/2020/12/Reasons-to-settle-down-in-Pune.png" },
            { name: "Delhi", state: "Delhi", knownFor: "India Gate", image: "https://images.unsplash.com/photo-1587474260584-136574528ed5" },
            { name: "Bangalore", state: "Karnataka", knownFor: "Silicon Valley", image: "https://media.istockphoto.com/id/1433555983/photo/vidhana-soudha-in-bangalore-india.jpg" },
            { name: "Mysore", state: "Karnataka", knownFor: "Mysore Palace", image: "https://images.unsplash.com/photo-1659126574791-13313aa424bd" },
            { name: "Chennai", state: "Tamil Nadu", knownFor: "Marina Beach", image: "https://plus.unsplash.com/premium_photo-1697729444936-8c6a6f643312" },
            { name: "Madurai", state: "Tamil Nadu", knownFor: "Meenakshi Temple", image: "https://upload.wikimedia.org/wikipedia/commons/f/f4/Meenakshi_Amman_West_Tower.jpg" },
            { name: "Jaipur", state: "Rajasthan", knownFor: "Hawa Mahal", image: "https://upload.wikimedia.org/wikipedia/commons/4/41/East_facade_Hawa_Mahal_Jaipur.jpg" },
            { name: "Udaipur", state: "Rajasthan", knownFor: "City of Lakes", image: "https://www.tourism.rajasthan.gov.in/content/dam/rajasthan-tourism/english/city/explore/221.jpg" },
            { name: "Goa", state: "Goa", knownFor: "Beaches", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e" },
            { name: "Kochi", state: "Kerala", knownFor: "Backwaters", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Cityscape_view_from_Kakkanad.jpg/250px-Cityscape_view_from_Kakkanad.jpg" },
            { name: "Munnar", state: "Kerala", knownFor: "Tea Gardens", image: "https://www.onthegotours.com/repository/downtown-munnar-757.jpg" },
            { name: "Kolkata", state: "West Bengal", knownFor: "Howrah Bridge", image: "https://s3.india.com/wp-content/uploads/2025/07/kolkata-DIY.jpg" },
            { name: "Dehradun", state: "Uttarakhand", knownFor: "Hill Station", image: "https://ukyatra.com/wp-content/uploads/2023/06/dehradun.jpg" },
            { name: "Nainital", state: "Uttarakhand", knownFor: "Lake", image: "https://static.toiimg.com/thumb/52005417/Nainital1000x667.jpg" },
            { name: "Manali", state: "Himachal Pradesh", knownFor: "Snow Mountains", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQQZV2iSY6QOCC3u629ibl_aoPcEV5ApowZMw&s" },
            { name: "Shimla", state: "Himachal Pradesh", knownFor: "Hill Station", image: "https://static.toiimg.com/thumb/msid-102383896,width-748,height-499,resizemode=4,imgsize-238460/.jpg" }
         ];
         localStorage.setItem("availableCities", JSON.stringify(storedCities));
      }
      setAvailableCities(storedCities);

      // ✅ INIT ATTRACTIONS (Deep Sync: Migrate missing ones from master list)
      let storedAttractions = JSON.parse(localStorage.getItem("customAttractions")) || {};
      let migrationHappened = false;

      // Use the master list from attractions.js
      Object.entries(attractionsByCity).forEach(([cityKey, attractions]) => {
         const key = cityKey.toLowerCase().trim();
         // If this city has NO attractions in storage yet, OR it's missing the static ones
         if (!storedAttractions[key] || storedAttractions[key].length === 0) {
            storedAttractions[key] = attractions.map((a, i) => ({
               id: `static-${key}-${i}`,
               ...a,
               cityKey: key // Ensure cityKey is present for editing
            }));
            migrationHappened = true;
         }
      });

      if (migrationHappened) {
         localStorage.setItem("customAttractions", JSON.stringify(storedAttractions));
      }

      // 🔥 DATA SANITIZATION: Ensure no homestays are hiding in attractions
      let sanitized = false;
      const allHomestays = JSON.parse(localStorage.getItem("homestays") || "[]");
      Object.keys(storedAttractions).forEach(cityKey => {
         const initialCount = storedAttractions[cityKey].length;
         // Filter out anything that has a 'price' or 'hostId' (signs of a homestay)
         storedAttractions[cityKey] = storedAttractions[cityKey].filter(attr => !attr.price && !attr.hostId);
         if (storedAttractions[cityKey].length !== initialCount) sanitized = true;
      });

      if (sanitized) {
         localStorage.setItem("customAttractions", JSON.stringify(storedAttractions));
      }

      setCustomAttractions(storedAttractions);

      // CHECK BACKEND HEALTH
      fetch("/api/auth/send-otp?email=health-check", { credentials: "include" })
         .then(() => setBackendStatus("online"))
         .catch(() => setBackendStatus("offline"));

      // FETCH FROM BACKEND — merge with local users
      fetch("https://fsad-tourconnect-backend.onrender.com/api/users")
         .then(res => res.json())
         .then(data => {
            if (data && Array.isArray(data) && data.length > 0) {
               const normalized = data.map(d => ({
                  ...d,
                  fullName: d.fullName || d.name || d.email,
                  role: (d.role || "tourist").toLowerCase(),
                  approvalStatus: d.approvalStatus || "approved"
               }));
               // Merge backend users with local defaults (avoid duplicates by email)
               const localUsers = JSON.parse(localStorage.getItem("users")) || [];
               const merged = [...normalized];
               localUsers.forEach(lu => {
                  if (!merged.find(u => u.email?.toLowerCase() === lu.email?.toLowerCase())) {
                     merged.push(lu);
                  }
               });
               setAllUsers(merged);
               localStorage.setItem("users", JSON.stringify(merged));
            }
         }).catch(() => {});

      fetch("https://fsad-tourconnect-backend.onrender.com/api/bookings")
         .then(res => res.json())
         .then(data => {
            if (data && Array.isArray(data)) {
               setAllPlans(data);
            }
         }).catch(() => {});

      fetch("https://fsad-tourconnect-backend.onrender.com/api/homestays")
         .then(res => res.json())
         .then(data => {
            if (data && Array.isArray(data)) {
               setPropertyRequests(prev => {
                  const combined = [...prev, ...data.map(d => ({
                     ...d,
                     // normalize field names for the UI
                     name: d.name || d.title,
                     status: (d.status || "PENDING").toLowerCase(),
                     approvalStatus: (d.approvalStatus || d.status || "pending").toLowerCase(),
                     _sourceKey: "db"
                  }))];
                  const getPropRef = (p) => `${p.name || p.title}-${p.city}-${p.hostEmail || p.email}`.toLowerCase().trim();
                  const unique = combined.filter((v, i, a) =>
                     a.findIndex(t => String(t.id) === String(v.id) || getPropRef(t) === getPropRef(v)) === i
                  );
                  return unique;
               });
            }
         }).catch(err => console.error("Admin property sync failed:", err));

   }, [navigate]);

   useEffect(() => {
      if (activeTab === "Property Requests" || activeTab === "Active Properties") {
         const customStays = JSON.parse(localStorage.getItem("customHomestays")) || [];
         setPropertyRequests(prev => {
            const combined = [...prev, ...customStays];
            const getPropRef = (p) => `${p.name || p.title}-${p.city}-${p.hostEmail || p.email}`.toLowerCase().trim();
            const unique = combined.filter((v, i, a) =>
               a.findIndex(t => String(t.id) === String(v.id) || getPropRef(t) === getPropRef(v)) === i
            );
            return unique;
         });
      } else if (activeTab === "All Bookings") {
         const storedBookings = JSON.parse(localStorage.getItem("savedPlans")) || [];
         setAllPlans(prev => {
            const combined = [...prev, ...storedBookings];
            const getRef = (b) => `${b.userEmail}-${b.city}-${b.startDate}-${b.endDate}`.toLowerCase().trim();
            return combined.filter((v, i, a) => a.findIndex(t => getRef(t) === getRef(v)) === i);
         });
      }
   }, [activeTab]);

   const handleUpdatePropertyStatusV2 = async (id, newStatus) => {
      if (!window.confirm(`Are you sure you want to ${newStatus} this property?`)) return;

      const property = propertyRequests.find(p => String(p.id) === String(id));
      if (!property) { alert("Error: Property not found. Please refresh."); return; }

      const citySlug = property.citySlug ||
         (property.city ? property.city.toLowerCase().replace(/\s+/g, '-').trim() : "unknown");

      if (newStatus === 'APPROVED') {

         // Step 1: Save/update in DB — always POST fresh to guarantee it's stored
         let dbId = null;
         try {
            const postRes = await fetch("https://fsad-tourconnect-backend.onrender.com/api/homestays", {
               method: "POST",
               credentials: "include",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({
                  title: property.name || property.title,
                  name: property.name || property.title,
                  city: (property.city || "").toLowerCase().trim(),
                  citySlug,
                  price: Number(property.price) || 0,
                  description: property.description || "",
                  image: property.image || "",
                  hostId: property.hostId ? Number(property.hostId) : null,
                  hostName: property.hostName || "",
                  hostEmail: property.hostEmail || "",
                  status: "APPROVED",
                  approvalStatus: "APPROVED"
               })
            });
            if (postRes.ok) {
               const saved = await postRes.json();
               dbId = saved.id;
            }
         } catch (e) {
            console.warn("DB save failed (offline)", e);
         }

         const finalId = dbId || id;
         const approvedProp = {
            ...property,
            id: finalId,
            citySlug,
            status: "approved",
            approvalStatus: "approved",
            isLive: true
         };

         // Step 2: Remove from pending localStorage
         const sourceKey = property._sourceKey || "pending_properties";
         if (sourceKey !== "db") {
            const sourceList = JSON.parse(localStorage.getItem(sourceKey) || "[]");
            localStorage.setItem(sourceKey, JSON.stringify(
               sourceList.filter(item => String(item.id) !== String(id))
            ));
         }

         // Step 3: Add to approved localStorage keys
         const live = JSON.parse(localStorage.getItem("homestays") || "[]");
         localStorage.setItem("homestays", JSON.stringify(
            [...live.filter(i => String(i.id) !== String(id) && String(i.id) !== String(finalId)), approvedProp]
         ));
         const customLive = JSON.parse(localStorage.getItem("customHomestays") || "[]");
         localStorage.setItem("customHomestays", JSON.stringify(
            [...customLive.filter(i => String(i.id) !== String(id) && String(i.id) !== String(finalId)), approvedProp]
         ));

         // Step 4: Update React state immediately
         setPropertyRequests(prev => prev.map(p =>
            String(p.id) === String(id) ? approvedProp : p
         ));

         window.dispatchEvent(new Event("storage"));
         alert(`"${property.name || property.title}" approved and saved to database!`);
         setActiveTab("Active Properties");

      } else {
         // REJECTED
         const rejectedProp = { ...property, status: "rejected", approvalStatus: "rejected" };

         const sourceKey = property._sourceKey || "pending_properties";
         if (sourceKey !== "db") {
            const sourceList = JSON.parse(localStorage.getItem(sourceKey) || "[]");
            localStorage.setItem(sourceKey, JSON.stringify(
               sourceList.filter(item => String(item.id) !== String(id))
            ));
         }
         const rejected = JSON.parse(localStorage.getItem("rejected_properties") || "[]");
         localStorage.setItem("rejected_properties", JSON.stringify(
            [...rejected.filter(i => String(i.id) !== String(id)), rejectedProp]
         ));

         setPropertyRequests(prev => prev.map(p =>
            String(p.id) === String(id) ? rejectedProp : p
         ));

         // If it was already in DB, update its status
         const numericId = Number(id);
         if (!isNaN(numericId) && numericId > 0 && String(numericId) === String(id)) {
            fetch(`https://fsad-tourconnect-backend.onrender.com/api/homestays/${numericId}/status`, {
               method: "PUT", credentials: "include",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({ status: "REJECTED" })
            }).catch(() => { });
         }

         window.dispatchEvent(new Event("storage"));
         alert(`Property "${property.name || property.title}" rejected.`);
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
         fetch(`https://fsad-tourconnect-backend.onrender.com/api/users/${targetUser.id || searchEmail}/status`, {
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

   const handleDeleteUser = (email) => {
      if (!window.confirm(`Delete user ${email}?`)) return;
      const updated = allUsers.filter(u => u.email?.toLowerCase() !== email?.toLowerCase());
      setAllUsers(updated);
      localStorage.setItem("users", JSON.stringify(updated));
   };

   const handleDeleteProperty = (id) => {
      if (!window.confirm("Are you sure you want to PERMANENTLY delete this listing?")) return;

      for (let i = 0; i < localStorage.length; i++) {
         const key = localStorage.key(i);
         try {
            const data = JSON.parse(localStorage.getItem(key));
            if (Array.isArray(data)) {
               const filtered = data.filter(item => String(item.id) !== String(id));
               if (filtered.length !== data.length) localStorage.setItem(key, JSON.stringify(filtered));
            }
         } catch (e) { }
      }

      // Update state immediately — no reload
      setPropertyRequests(prev => prev.filter(p => String(p.id) !== String(id)));

      // Sync delete to DB
      const numericId = Number(id);
      if (!isNaN(numericId) && numericId > 0) {
         fetch(`https://fsad-tourconnect-backend.onrender.com/api/homestays/${numericId}`, {
            method: "DELETE", credentials: "include"
         }).catch(() => { });
      }
   };

   const handleLogout = () => {
      localStorage.removeItem("user");
      navigate("/", { replace: true });
   };

   const handleAddCity = () => {
      if (!cityForm.name.trim() || !cityForm.state.trim()) return;
      const newCity = {
         ...cityForm,
         name: cityForm.name.trim(),
         state: cityForm.state.trim(),
         slug: cityForm.name.toLowerCase().replace(/\s+/g, '-'),
         image: cityForm.image || "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2070",
         attractions: 0,
         homestays: 0
      };

      const updated = [...availableCities, newCity];
      setAvailableCities(updated);
      localStorage.setItem("availableCities", JSON.stringify(updated));
      window.dispatchEvent(new Event("storage")); // 🔥 Alert the whole system!
      setCityForm({ name: "", state: "", image: "", knownFor: "" });
      alert("City added successfully! It is now available for all Hosts and Guides.");
   };

   const handleEditCity = (city) => {
      setEditingCity(city);
      setCityForm({ ...city });
   };

   const handleUpdateCity = () => {
      if (!editingCity) return;
      const updated = availableCities.map(c =>
         c.name === editingCity.name ? { ...cityForm, slug: cityForm.name.toLowerCase().replace(/\s+/g, '-') } : c
      );
      setAvailableCities(updated);
      localStorage.setItem("availableCities", JSON.stringify(updated));
      setEditingCity(null);
      setCityForm({ name: "", state: "", image: "", knownFor: "" });
      window.dispatchEvent(new Event("storage"));
      alert("City updated successfully!");
   };

   const handleDeleteCity = (cityName) => {
      if (!window.confirm(`Delete ${cityName} and all its data?`)) return;
      const updated = availableCities.filter(c => c.name !== cityName);
      setAvailableCities(updated);
      localStorage.setItem("availableCities", JSON.stringify(updated));
      window.dispatchEvent(new Event("storage"));
   };

   const handleAddAttraction = () => {
      if (!attractionForm.city || !attractionForm.name) return;
      const cityKey = attractionForm.city.toLowerCase().replace(/\s+/g, '-');

      const cityList = customAttractions[cityKey] ? [...customAttractions[cityKey]] : [];
      // Ensure unique ID for editing
      cityList.push({
         id: Date.now(),
         name: attractionForm.name,
         description: attractionForm.desc,
         duration: attractionForm.duration,
         entry: attractionForm.entry,
         image: attractionForm.image || "https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&q=80&w=2070"
      });

      const updated = { ...customAttractions, [cityKey]: cityList };
      setCustomAttractions(updated);
      localStorage.setItem("customAttractions", JSON.stringify(updated));

      // ✅ Sync with City.jsx's expected key
      // Sync complete

      setAttractionForm({ ...attractionForm, name: "", desc: "", image: "" });
      window.dispatchEvent(new Event("storage"));
      alert("Attraction added!");
   };

   const handleEditAttraction = (attr) => {
      setEditingAttraction(attr);
      const cityName = availableCities.find(c => c.name.toLowerCase().replace(/\s+/g, '-') === attr.cityKey)?.name || attr.cityKey;
      setAttractionForm({
         city: cityName,
         name: attr.name,
         desc: attr.description,
         duration: attr.duration,
         entry: attr.entry,
         image: attr.image
      });
   };

   const handleUpdateAttraction = () => {
      if (!editingAttraction) return;
      const { cityKey, id } = editingAttraction;
      const cityList = [...(customAttractions[cityKey] || [])];

      const targetIndex = cityList.findIndex(a => a.id === id);
      if (targetIndex === -1) return;

      cityList[targetIndex] = {
         ...cityList[targetIndex],
         name: attractionForm.name,
         description: attractionForm.desc,
         duration: attractionForm.duration,
         entry: attractionForm.entry,
         image: attractionForm.image
      };

      const updated = { ...customAttractions, [cityKey]: cityList };
      setCustomAttractions(updated);
      localStorage.setItem("customAttractions", JSON.stringify(updated));

      // ✅ Sync with City.jsx's expected key
      // Sync complete

      setEditingAttraction(null);
      setAttractionForm({ city: "", name: "", desc: "", duration: "1-2 hrs", entry: "Free", image: "" });
      window.dispatchEvent(new Event("storage"));
      alert("Attraction updated!");
   };

   const handleDeleteAttraction = (cityKey, attrId) => {
      if (!window.confirm("Delete this attraction?")) return;
      const cityList = (customAttractions[cityKey] || []).filter(a => a.id !== attrId);

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
      <div className="flex min-h-screen font-sans text-gray-800 relative z-0">
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

         {/* 🟦 SIDEBAR */}
         <aside className="w-64 bg-white/75 backdrop-blur-xl border-r border-gray-200/60 fixed h-full z-10 hidden md:flex flex-col">
            <div
               onClick={() => navigate("/")}
               className="p-6 flex items-center gap-3 border-b border-gray-100/60 cursor-pointer hover:bg-white/40 transition-colors"
            >
               <div className="bg-yellow-500 p-1.5 rounded-lg shadow-sm">
                  <MapPin className="text-white" size={20} />
               </div>
               <span className="text-xl font-bold tracking-tight text-gray-900">TourConnect</span>
            </div>

            <div className="flex-1 px-4 py-8 space-y-1">
               <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3">Admin Panel</p>
               <SidebarItem icon={<BarChart3 size={18} />} label="Overview" active={activeTab === "Overview"} onClick={() => setActiveTab("Overview")} />
               <SidebarItem icon={<Users size={18} />} label="Manage Users" active={activeTab === "Manage Users"} onClick={() => setActiveTab("Manage Users")} />
               <SidebarItem icon={<Globe size={18} />} label="All Bookings" active={activeTab === "All Bookings"} onClick={() => setActiveTab("All Bookings")} />
               <SidebarItem icon={<HomeIcon size={18} />} label="Property Requests" active={activeTab === "Property Requests"} onClick={() => setActiveTab("Property Requests")} />
               <SidebarItem icon={<CheckCircle size={18} />} label="Active Properties" active={activeTab === "Active Properties"} onClick={() => setActiveTab("Active Properties")} />
               <SidebarItem icon={<MapPin size={18} />} label="Destinations" active={activeTab === "Destinations"} onClick={() => setActiveTab("Destinations")} />
            </div>

            <div className="p-4 border-t border-gray-100/60 mb-16 flex flex-col gap-1">
               <SidebarItem icon={<ArrowLeft size={18} />} label="Back to Home" onClick={() => navigate("/")} />
               <SidebarItem icon={<LogOut size={18} />} label="Sign Out" onClick={handleLogout} isDanger />
            </div>
         </aside>

         {/* 🟦 MAIN CONTENT */}
         <main className="flex-1 md:ml-64 p-6 md:p-10 relative max-w-7xl mx-auto z-0">
            <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
               <div>
                  <h1 className="text-3xl font-bold text-white flex items-center gap-3 drop-shadow-sm">
                     <Shield className="text-yellow-400" size={28} />
                     TourConnect Administration <span className="text-[10px] bg-yellow-500 text-black px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Ver 3.0</span>
                  </h1>
                  <p className="text-gray-300 mt-1">Hello {user?.fullName?.split(" ")[0]}, monitor platform health.</p>
               </div>
               <div
                  onClick={() => setActiveTab("Overview")}
                  className="hidden md:flex items-center gap-3 cursor-pointer hover:bg-white/10 py-1.5 px-3 rounded-xl transition"
               >
                  <span className="font-semibold text-white drop-shadow-sm">{user?.fullName}</span>
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-900 border border-blue-200 flex items-center justify-center font-bold text-sm shadow-sm">
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
                                             <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' :
                                                u.role === 'guide' ? 'bg-yellow-100 text-yellow-700' :
                                                   u.role === 'host' ? 'bg-green-100 text-green-700' :
                                                      'bg-slate-100 text-slate-700'
                                                }`}>
                                                {u.role ? u.role : 'TOURIST'}
                                             </span>
                                             {u.role !== 'tourist' && u.role !== 'admin' && (
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${u.approvalStatus === 'approved' ? 'text-green-600' :
                                                   u.approvalStatus === 'rejected' ? 'text-red-500' : 'text-orange-500'
                                                   }`}>
                                                   {u.approvalStatus || 'APPROVED'}
                                                </span>
                                             )}
                                          </div>
                                       </td>
                                       <td className="p-4 text-gray-600 font-medium">{u.city || "N/A"}</td>
                                       <td className="p-4">
                                          <div className="flex flex-col gap-2">
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
                                             {u.role !== 'admin' && (
                                                <button onClick={() => handleDeleteUser(u.email)} className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 transition w-fit">
                                                   Delete
                                                </button>
                                             )}
                                          </div>
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
               const pendingRequests = propertyRequests.filter(p => {
                  const s = (p.status || p.approvalStatus || "pending").toLowerCase();
                  return s === "pending";
               });
               return (
                  <div className="space-y-6">
                     <div>
                        <h3 className="text-3xl font-bold text-white drop-shadow-md">Property Requests</h3>
                        <p className="text-gray-300 mt-1 drop-shadow-sm">Review and moderate user-submitted homestays before they go live.</p>
                     </div>
                     <div className="bg-white/80 backdrop-blur-md p-8 rounded-xl border border-gray-200/60 shadow-sm min-h-[60vh]">
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
                                          <span className="text-yellow-600">Initial Rating: ★ {p.rating}</span>
                                       </div>
                                    </div>
                                    <div className="flex gap-3 md:flex-col lg:flex-row min-w-[220px]">
                                       <button onClick={() => handleUpdatePropertyStatusV2(p.id, 'APPROVED')} className="flex-1 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition">Approve Listing</button>
                                       <button onClick={() => handleUpdatePropertyStatusV2(p.id, 'REJECTED')} className="flex-1 px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 text-sm font-medium rounded-lg hover:bg-red-100 transition">Reject Listing</button>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
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
                  <div className="space-y-6">
                     <div>
                        <h3 className="text-3xl font-bold text-white drop-shadow-md">Live Managed Properties</h3>
                        <p className="text-gray-300 mt-1 drop-shadow-sm">View and terminate active custom homestays.</p>
                     </div>
                     <div className="bg-white/80 backdrop-blur-md p-8 rounded-xl border border-gray-200/60 shadow-sm min-h-[60vh]">
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
                                       <button onClick={() => handleDeleteProperty(p.id)} className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition shadow-sm">Terminate Listing</button>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  </div>
               );
            })()}

            {/* DESTINATIONS TAB */}
            {activeTab === "Destinations" && (
               <div className="space-y-10">
                  <div>
                     <h3 className="text-3xl font-bold text-white drop-shadow-md">Manage Destinations</h3>
                     <p className="text-gray-300 mt-1 drop-shadow-sm">Add new cities and local attractions to expand the platform footprint.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     {/* ADD NEW CITY */}
                     <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-gray-200/60">
                        <div className="flex items-center gap-3 mb-6">
                           <div className="text-blue-600"><MapPin size={24} /></div>
                           <h4 className="text-xl font-bold text-[#1e2128]">Add New City</h4>
                        </div>
                        <div className="space-y-5">
                           <div>
                              <label className="text-sm font-semibold text-gray-600 block mb-2">City Name</label>
                              <input
                                 type="text"
                                 placeholder="e.g. Surat"
                                 value={cityForm.name}
                                 onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
                                 className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                              />
                           </div>
                           <div>
                              <label className="text-sm font-semibold text-gray-600 block mb-2">State Name</label>
                              <input
                                 type="text"
                                 placeholder="e.g. Gujarat"
                                 value={cityForm.state}
                                 onChange={(e) => setCityForm({ ...cityForm, state: e.target.value })}
                                 className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                              />
                           </div>
                           <div>
                              <label className="text-sm font-semibold text-gray-600 block mb-2">Image URL</label>
                              <input
                                 type="text"
                                 placeholder="https://..."
                                 value={cityForm.image}
                                 onChange={(e) => setCityForm({ ...cityForm, image: e.target.value })}
                                 className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                              />
                              <button type="button" onClick={() => setCityForm({ ...cityForm, image: `https://source.unsplash.com/600x400/?${encodeURIComponent(cityForm.name || 'city')},india` })} className="mt-2 text-xs text-blue-600 underline cursor-pointer">Auto-generate image from city name</button>
                              {cityForm.image ? (
                                 <img src={cityForm.image} alt="preview" className="mt-2 w-full h-32 object-cover rounded-lg border" onError={(e) => e.target.style.display='none'} />
                              ) : null}
                           </div>
                           <div>
                              <label className="text-sm font-semibold text-gray-600 block mb-2">Known For</label>
                              <input
                                 type="text"
                                 placeholder="e.g. Diamond City"
                                 value={cityForm.knownFor}
                                 onChange={(e) => setCityForm({ ...cityForm, knownFor: e.target.value })}
                                 className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                              />
                           </div>
                           <button
                              onClick={handleAddCity}
                              className="w-full py-4 bg-[#2563eb] text-white rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 mt-4"
                           >
                              <span className="text-xl">+</span> Save City
                           </button>
                        </div>
                     </div>

                     {/* ADD NEW ATTRACTION */}
                     <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-gray-200/60">
                        <div className="flex items-center gap-3 mb-6">
                           <div className="text-emerald-600"><Globe size={24} /></div>
                           <h4 className="text-xl font-bold text-[#1e2128]">Add New Attraction</h4>
                        </div>
                        <div className="space-y-5">
                           <div>
                              <label className="text-sm font-semibold text-gray-600 block mb-2">Select City</label>
                              <select
                                 value={attractionForm.city}
                                 onChange={(e) => setAttractionForm({ ...attractionForm, city: e.target.value })}
                                 className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition appearance-none cursor-pointer"
                              >
                                 <option value="">-- Choose a city --</option>
                                 {availableCities.map(c => <option key={c.name} value={c.name}>{c.name} ({c.state})</option>)}
                              </select>
                           </div>
                           <div>
                              <label className="text-sm font-semibold text-gray-600 block mb-2">Attraction Name</label>
                              <input
                                 type="text"
                                 placeholder="e.g. Dumas Beach"
                                 value={attractionForm.name}
                                 onChange={(e) => setAttractionForm({ ...attractionForm, name: e.target.value })}
                                 className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
                              />
                           </div>
                           <div>
                              <label className="text-sm font-semibold text-gray-600 block mb-2">Description</label>
                              <input
                                 type="text"
                                 placeholder="Short description..."
                                 value={attractionForm.desc}
                                 onChange={(e) => setAttractionForm({ ...attractionForm, desc: e.target.value })}
                                 className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
                              />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <label className="text-sm font-semibold text-gray-600 block mb-2">Entry</label>
                                 <select
                                    value={attractionForm.entry}
                                    onChange={(e) => setAttractionForm({ ...attractionForm, entry: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition cursor-pointer"
                                 >
                                    <option value="Free">Free</option>
                                    <option value="Paid">Paid</option>
                                 </select>
                              </div>
                              <div>
                                 <label className="text-sm font-semibold text-gray-600 block mb-2">Duration</label>
                                 <input
                                    type="text"
                                    placeholder="e.g. 1-2 hrs"
                                    value={attractionForm.duration}
                                    onChange={(e) => setAttractionForm({ ...attractionForm, duration: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
                                 />
                              </div>
                           </div>
                           <div>
                              <label className="text-sm font-semibold text-gray-600 block mb-2">Image URL (Optional)</label>
                              <input
                                 type="text"
                                 placeholder="https://..."
                                 value={attractionForm.image}
                                 onChange={(e) => setAttractionForm({ ...attractionForm, image: e.target.value })}
                                 className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
                              />
                              <button type="button" onClick={() => setAttractionForm({ ...attractionForm, image: `https://source.unsplash.com/600x400/?${encodeURIComponent(attractionForm.name || 'attraction')},india` })} className="mt-2 text-xs text-emerald-600 underline cursor-pointer">Auto-generate image from attraction name</button>
                              {attractionForm.image ? (
                                 <img src={attractionForm.image} alt="preview" className="mt-2 w-full h-32 object-cover rounded-lg border" onError={(e) => e.target.style.display='none'} />
                              ) : null}
                           </div>
                           <button
                              onClick={handleAddAttraction}
                              className="w-full py-4 bg-[#059669] text-white rounded-xl font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2 mt-4"
                           >
                              <span className="text-xl">+</span> Save Attraction
                           </button>
                        </div>
                     </div>
                  </div>

                  {/* PRESENT CITIES */}
                  <div className="mt-12">
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <h3 className="text-2xl font-bold text-white drop-shadow-md">Present Cities</h3>
                        <div className="relative w-full md:w-72">
                           <input
                              type="text"
                              placeholder="Search cities or states..."
                              value={citySearch}
                              onChange={(e) => setCitySearch(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition shadow-sm"
                           />
                           <Globe className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {availableCities.filter(c =>
                           c.name.toLowerCase().includes(citySearch.toLowerCase()) ||
                           c.state.toLowerCase().includes(citySearch.toLowerCase())
                        ).map((city, idx) => {
                           const cityKey = city.name.toLowerCase().replace(/\s+/g, '-');
                           const attractionsCount = (customAttractions[cityKey]?.length || 0);
                           // Add some base count for default cities if they aren't in customAttractions yet
                           const totalAttractions = attractionsCount + (city.attractions || (["Hyderabad", "Warangal", "Mumbai", "Pune", "Delhi", "Bangalore", "Mysore", "Chennai", "Madurai", "Jaipur", "Udaipur", "Goa", "Kochi", "Munnar", "Kolkata", "Dehradun", "Nainital", "Manali", "Shimla"].includes(city.name) ? Math.floor(Math.random() * 5) + 3 : 0));

                           return (
                              <div key={idx} className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-gray-200/60 flex items-center justify-between group hover:shadow-md transition">
                                 <div>
                                    <h5 className="font-bold text-[#1e2128] text-lg">{city.name}</h5>
                                    <p className="text-xs font-semibold text-gray-500">{totalAttractions} Attractions</p>
                                 </div>
                                 <div className="flex gap-2">
                                    <button onClick={() => handleEditCity(city)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition border border-blue-100">
                                       <Pencil size={16} />
                                    </button>
                                    <button onClick={() => handleDeleteCity(city.name)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition border border-red-100">
                                       <Trash2 size={16} />
                                    </button>
                                 </div>
                              </div>
                           )
                        })}
                     </div>
                  </div>

                  {/* MANAGE ALL ATTRACTIONS */}
                  <div className="mt-12 pb-10">
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                           <Settings className="text-yellow-400 drop-shadow-md" size={24} />
                           <h3 className="text-2xl font-bold text-white drop-shadow-md">Manage All Attractions</h3>
                        </div>
                        <div className="relative w-full md:w-72">
                           <input
                              type="text"
                              placeholder="Search attractions or cities..."
                              value={attractionSearch}
                              onChange={(e) => setAttractionSearch(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition shadow-sm"
                           />
                           <MapPin className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        </div>
                     </div>
                     <div className="space-y-4">
                        {Object.entries(customAttractions).flatMap(([cityKey, attractions]) =>
                           attractions.map((attr, idx) => ({ ...attr, cityKey, originalIndex: idx }))
                        ).filter(a =>
                           a.name.toLowerCase().includes(attractionSearch.toLowerCase()) ||
                           a.cityKey.toLowerCase().includes(attractionSearch.toLowerCase())
                        ).length === 0 ? (
                           <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center">
                              <p className="text-gray-400 font-medium">No custom attractions added yet. Add one above to manage it here.</p>
                           </div>
                        ) : (
                           (() => {
                              const filtered = Object.entries(customAttractions).flatMap(([cityKey, attractions]) =>
                                 attractions.map((attr, idx) => ({ ...attr, cityKey, originalIndex: idx }))
                              ).filter(a =>
                                 a.name.toLowerCase().includes(attractionSearch.toLowerCase()) ||
                                 a.cityKey.toLowerCase().includes(attractionSearch.toLowerCase())
                              );

                              return filtered.map((attr, idx) => (
                                 <div key={`${attr.cityKey}-${attr.originalIndex}`} className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-gray-200/60 flex items-center justify-between shadow-sm hover:shadow-md transition">
                                    <div>
                                       <h4 className="text-xl font-bold text-[#1e2128]">{attr.name}</h4>
                                       <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">CITY: {attr.cityKey.replace(/-/g, ' ').toUpperCase()}</p>
                                    </div>
                                    <div className="flex gap-3">
                                       <button onClick={() => handleEditAttraction(attr)} className="px-5 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition text-sm">Edit</button>
                                       <button onClick={() => handleDeleteAttraction(attr.cityKey, attr.id)} className="px-5 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition text-sm">Delete</button>
                                    </div>
                                 </div>
                              ));
                           })()
                        )}
                     </div>
                  </div>
               </div>
            )}

            {/* 🏙️ EDIT CITY MODAL */}
            {editingCity && (
               <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                  <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
                     <div className="px-8 py-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="text-2xl font-bold text-gray-900">Edit City: {editingCity.name}</h3>
                        <button onClick={() => setEditingCity(null)} className="text-gray-400 hover:text-gray-900 transition">✕</button>
                     </div>
                     <div className="p-8 space-y-5">
                        <div>
                           <label className="text-sm font-bold text-gray-600 block mb-2">City Name</label>
                           <input type="text" value={cityForm.name} onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                           <label className="text-sm font-bold text-gray-600 block mb-2">State</label>
                           <input type="text" value={cityForm.state} onChange={(e) => setCityForm({ ...cityForm, state: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                           <label className="text-sm font-bold text-gray-600 block mb-2">Image URL</label>
                           <input type="text" value={cityForm.image} onChange={(e) => setCityForm({ ...cityForm, image: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                           <button type="button" onClick={() => setCityForm({ ...cityForm, image: `https://source.unsplash.com/600x400/?${encodeURIComponent(cityForm.name || 'city')},india` })} className="mt-2 text-xs text-blue-600 underline cursor-pointer">Auto-generate image</button>
                           {cityForm.image ? <img src={cityForm.image} alt="preview" className="mt-2 w-full h-28 object-cover rounded-lg border" onError={(e) => e.target.style.display='none'} /> : null}
                        </div>
                        <div>
                           <label className="text-sm font-bold text-gray-600 block mb-2">Known For</label>
                           <input type="text" value={cityForm.knownFor} onChange={(e) => setCityForm({ ...cityForm, knownFor: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div className="flex gap-4 pt-4">
                           <button onClick={() => setEditingCity(null)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition">Cancel</button>
                           <button onClick={handleUpdateCity} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition">Save Changes</button>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {/* 🎡 EDIT ATTRACTION MODAL */}
            {editingAttraction && (
               <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                  <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
                     <div className="px-8 py-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="text-2xl font-bold text-gray-900">Edit Attraction: {editingAttraction.name}</h3>
                        <button onClick={() => setEditingAttraction(null)} className="text-gray-400 hover:text-gray-900 transition">✕</button>
                     </div>
                     <div className="p-8 space-y-4">
                        <div>
                           <label className="text-sm font-bold text-gray-600 block mb-2">Attraction Name</label>
                           <input type="text" value={attractionForm.name} onChange={(e) => setAttractionForm({ ...attractionForm, name: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>
                        <div>
                           <label className="text-sm font-bold text-gray-600 block mb-2">Description</label>
                           <textarea value={attractionForm.desc} onChange={(e) => setAttractionForm({ ...attractionForm, desc: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" rows="3"></textarea>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="text-sm font-bold text-gray-600 block mb-2">Entry</label>
                              <select value={attractionForm.entry} onChange={(e) => setAttractionForm({ ...attractionForm, entry: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none">
                                 <option value="Free">Free</option>
                                 <option value="Paid">Paid</option>
                              </select>
                           </div>
                           <div>
                              <label className="text-sm font-bold text-gray-600 block mb-2">Duration</label>
                              <input type="text" value={attractionForm.duration} onChange={(e) => setAttractionForm({ ...attractionForm, duration: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                           </div>
                        </div>
                        <div>
                           <label className="text-sm font-bold text-gray-600 block mb-2">Image URL</label>
                           <input type="text" value={attractionForm.image} onChange={(e) => setAttractionForm({ ...attractionForm, image: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                           <button type="button" onClick={() => setAttractionForm({ ...attractionForm, image: `https://source.unsplash.com/600x400/?${encodeURIComponent(attractionForm.name || 'attraction')},india` })} className="mt-2 text-xs text-emerald-600 underline cursor-pointer">Auto-generate image</button>
                           {attractionForm.image ? <img src={attractionForm.image} alt="preview" className="mt-2 w-full h-28 object-cover rounded-lg border" onError={(e) => e.target.style.display='none'} /> : null}
                        </div>
                        <div className="flex gap-4 pt-4">
                           <button onClick={() => setEditingAttraction(null)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition">Cancel</button>
                           <button onClick={handleUpdateAttraction} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition">Save Changes</button>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            <footer className="mt-20 text-center text-gray-400 font-semibold text-sm pt-8 border-t border-gray-600/50">
               ┬⌐ {new Date().getFullYear()} TourConnect Administration.
            </footer>
         </main>
      </div>
   );
}

function StatCard({ title, value, onClick, isHighlighted }) {
   return (
      <div
         onClick={onClick}
         className={`bg-white/80 backdrop-blur-md p-5 rounded-xl border shadow-sm transition-all ${isHighlighted ? 'border-orange-400 bg-orange-50/50 ring-2 ring-orange-200 ring-opacity-50 animate-pulse' : 'border-gray-200/60'
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
        px-4 py-3 mx-2 rounded-xl cursor-pointer transition-all flex items-center gap-3 text-sm font-semibold
        ${active
               ? "bg-gray-100 text-gray-900 shadow-sm"
               : isDanger
                  ? "text-red-500 hover:bg-red-50 mt-6"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            }
      `}
      >
         <span className={`${active ? "text-blue-600" : "text-gray-400"}`}>{icon}</span>
         {label}
      </div>
   );
}

export default AdminDashboard;
