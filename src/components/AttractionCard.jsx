import { Link, useParams, useNavigate } from "react-router-dom";
import { MapPin, ArrowLeft } from "lucide-react";
import { citiesByState } from "../data/cities";
import { attractionsByCity } from "../data/attractions";
import { cityTaglines } from "../data/taglines";

function City() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // 🔍 Find city
  const getCityData = () => {
    for (const state in citiesByState) {
      const city = citiesByState[state].find((c) => c.slug === slug);
      if (city) return city;
    }
    return null;
  };

  const city = getCityData();

  // 🔥 Get attractions
  const attractionDetails = attractionsByCity[slug] || [];

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

        {/* HEADER */}
        <header className="absolute top-0 left-0 right-0 z-20 p-4">
          <div className="container mx-auto flex items-center justify-between">
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/explore")}
                className="text-white"
              >
                <ArrowLeft />
              </button>

              <Link to="/" className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span className="text-xl font-bold">TourConnect</span>
              </Link>
            </div>

            <nav className="hidden sm:flex gap-4">
              <Link to="/login" className="text-white">Login</Link>
              <Link to="/about-us" className="text-white">About Us</Link>
            </nav>
          </div>
        </header>

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
        
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold">
            Attractions in {city.name}
          </h2>
          <p className="text-gray-500">
            Explore top places
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {attractionDetails.length > 0 ? (
            attractionDetails.map((attraction, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:scale-105 transition"
              >
                <img
                  src={attraction.image}
                  alt={attraction.name}
                  className="h-48 w-full object-cover"
                />

                <div className="p-4 text-center">

                  {/* NAME */}
                  <h3 className="font-bold text-lg">
                    {attraction.name}
                  </h3>

                  {/* DESCRIPTION */}
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
    🧑‍🏫 Guides from ₹{Math.floor(Math.random() * 500 + 500)} / day
  </p>

</div>

                </div>
              </div>
            ))
          ) : (
            <p className="text-center col-span-full text-gray-500">
              No attractions available for this city
            </p>
          )}
        </div>
      </main>

      {/* BUTTONS */}
      <div className="text-center py-10 space-x-4">
        <button className="bg-yellow-500 text-white px-6 py-2 rounded">
          Book Home Stay
        </button>

        <button className="bg-gray-200 px-6 py-2 rounded">
          Hire Local Guide
        </button>
      </div>

      {/* FOOTER */}
      <footer className="border-t text-center py-6 text-gray-500 text-sm">
        © 2026 TourConnect. All Rights Reserved.
      </footer>
    </div>
  );
}

export default City;