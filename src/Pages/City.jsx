import { Link, useParams, useNavigate } from "react-router-dom";
import { MapPin, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { citiesByState } from "../data/cities";
import { attractionsByCity } from "../data/attractions";
import { cityTaglines } from "../data/taglines";

function City() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [syncKey, setSyncKey] = useState(0); // Used to force re-render on storage change

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // 🔥 Listen for approvals from Admin Dashboard
    const handleSync = () => setSyncKey(prev => prev + 1);
    window.addEventListener("storage", handleSync);
    return () => window.removeEventListener("storage", handleSync);
  }, []);

  // ✅ LOGIN CHECK
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const getCityData = () => {
    const blacklisted = JSON.parse(localStorage.getItem("blacklisted_cities") || "[]");
    if (blacklisted.includes(slug)) return null;

    const localAdminData = JSON.parse(localStorage.getItem("availableCities") || "[]");
    
    // 1. Check Local Override first
    const city = localAdminData.find(c => c.slug === slug);
    if (city) {
      return {
        ...city,
        stateName: city.state || "Newly Added District",
        image: city.image || "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2070"
      };
    }

    // 2. Check Hardcoded
    for (const state in citiesByState) {
      const city = citiesByState[state].find((c) => c.slug === slug);
      if (city) return city;
    }
    
    return null;
  };

  const city = getCityData();
  
  // ✅ MERGE ATTRACTIONS
  const hardcodedAttractions = attractionsByCity[slug] || [];
  
  const adminAttractions = (() => {
    try {
      const a1 = JSON.parse(localStorage.getItem("admin_attractions")) || {};
      const a2 = JSON.parse(localStorage.getItem("customAttractions")) || {};
      
      // Combine from both sources
      const combined = (a1[slug] || []).concat(a2[slug] || []);
      
      // Unique by name
      return combined.filter((v, i, a) => a.findIndex(t => t.name === v.name) === i);
    } catch {
      return [];
    }
  })();

  const blacklistedAttrs = JSON.parse(localStorage.getItem("blacklisted_attractions") || "[]");

  // Merge: admin local overwrites hardcoded with same name
  const mergedAttrs = hardcodedAttractions.map(h => {
    const localVersion = adminAttractions.find(l => l.name === h.name);
    return localVersion || h;
  });

  // Add truly new ones
  const trulyNewAttrs = adminAttractions.filter(l => !hardcodedAttractions.find(hc => hc.name === l.name));

  // Filter blacklisted
  const attractionDetails = [...mergedAttrs, ...trulyNewAttrs].filter(attr => {
    const key = `${slug}|${attr.name}`;
    return !blacklistedAttrs.includes(key);
  });



  const selectAll = () => {
    setSelectedPlaces(attractionDetails);
  };

  const clearAll = () => {
    setSelectedPlaces([]);
  };

  const toggleSelect = (place) => {
    const exists = selectedPlaces.find((p) => p.name === place.name);

    if (exists) {
      setSelectedPlaces(
        selectedPlaces.filter((p) => p.name !== place.name)
      );
    } else {
      setSelectedPlaces([...selectedPlaces, place]);
    }
  };

  if (!city) {
    return (
      <h1 className="text-center mt-20 text-2xl">
        City not found
      </h1>
    );
  }

  return (
    <div className="bg-white text-gray-800">
      
      {/* HERO */}
      <div className="relative h-[70vh] min-h-[500px] text-white">
        <img
          src={city.image}
          alt={city.name}
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />

        

        {/* CENTER TEXT */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-4">
          <h1 className="text-6xl sm:text-7xl font-bold">
            {city.name}
          </h1>

          <p className="text-lg text-white/90 mt-2">
            {city.stateName}
          </p>

          <p className="max-w-2xl text-white/80 mt-2">
            {cityTaglines[city.name] || city.knownFor}
          </p>
        </div>
      </div>

      {/* ATTRACTIONS */}
      <main className="container mx-auto py-12 px-4">
        
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          <div>
            <h2 className="text-3xl font-bold">
              Attractions in {city.name}
            </h2>
            <p className="text-gray-500">
              Explore top places
            </p>
          </div>

          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-700">
              {selectedPlaces.length} selected
            </p>

            <button
              onClick={selectAll}
              className="bg-yellow-500 text-white px-2 py-0 text-sm rounded"
            >
              Select All
            </button>

            <button
              onClick={clearAll}
              className="bg-gray-300 px-2 py-0 text-sm rounded"
            >
              Clear
            </button>
          </div>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {attractionDetails.length > 0 ? (
            attractionDetails.map((attraction, index) => {

              const isSelected = selectedPlaces.some(
                (p) => p.name === attraction.name
              );

              return (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:scale-105 transition"
                >
                  <img
                    src={(() => {
                      if (attraction.image && attraction.image.startsWith('http')) {
                        return attraction.image;
                      }
                      // Neutral professional fallback only if NO image is provided
                      return "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2070";
                    })()}
                    alt={attraction.name}
                    className="h-48 w-full object-cover"
                    onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2070"; }}
                  />

                  <div className="p-4 text-center">

                    <h3 className="font-bold text-lg">
                      {attraction.name}
                    </h3>

                    <p className="text-gray-500 text-sm mt-1">
                      {attraction.description}
                    </p>

                    <div className="mt-3 text-sm text-center">
                      <p className="text-gray-600">
                        ⏱ Duration: {attraction.duration}
                      </p>

                      <p className="text-gray-600">
                        🎟 Entry: {attraction.entry}
                      </p>

                      <p className="text-blue-600 font-semibold">
                        🧑‍🏫 Guides from ₹{500 + index * 50} / day
                      </p>
                    </div>

                    <button
                      onClick={() => toggleSelect(attraction)}
                      className={`mt-3 px-4 py-1 rounded ${
                        isSelected
                          ? "bg-green-600 text-white"
                          : "bg-yellow-500 text-white"
                      }`}
                    >
                      {isSelected ? "Selected" : "Select"}
                    </button>

                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center col-span-full text-gray-500">
              No attractions available for this city
            </p>
          )}
        </div>


      </main>

      {/* PROCEED */}
      <div className="text-center py-10">
        <button
          onClick={() =>
            navigate("/plan", { 
              state: { 
                selectedPlaces,
                city: slug
              } 
            })
          }
          className="bg-yellow-500 text-white px-6 py-2 rounded"
        >
          Proceed to Plan →
        </button>
      </div>

      <footer className="border-t text-center py-6 text-gray-500 text-sm">
        © 2026 TourConnect. All Rights Reserved.
      </footer>
    </div>
  );
}

export default City;