import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Search } from "lucide-react";
import { citiesByState } from "../data/cities";

function Explore() {
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();


  const allCities = Object.entries(citiesByState).flatMap(
    ([stateSlug, cities]) =>
      cities.map((city) => ({
        ...city,
        stateSlug,
      }))
  );

  const filteredCities = allCities.filter(
    (city) =>
      city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      city.stateName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div 
      className="min-h-screen bg-white text-black"
      style={{ fontFamily: "'Playfair Display', serif" }}
    >
      


      {/* HERO */}
      <div className="relative h-[50vh] min-h-[300px] flex items-center justify-center text-white">
        <img
          src="https://images.unsplash.com/photo-1501785888041-af3ef285b470"
          alt="Explore"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 text-center space-y-4">
          <h1 className="text-5xl font-bold">
            Explore Destinations
          </h1>
          <p className="text-xl text-white/90">
            Find your next adventure in India.
          </p>
        </div>
      </div>

      {/* SEARCH */}
      <main className="container mx-auto py-8 -mt-20 relative z-20 px-4">
        <div className="relative max-w-2xl mx-auto mb-12">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />

          <input
            type="search"
            placeholder="Search for cities, states..."
            className="w-full rounded-full pl-12 p-4 text-lg shadow-lg border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* GRID */}
        {filteredCities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            
            {filteredCities.map((city) => (
              <div
                key={`${city.stateSlug}-${city.slug}`}
                className="overflow-hidden rounded-xl shadow-md hover:scale-105 hover:shadow-xl transition-all duration-300 bg-white flex flex-col"
              >
                {/* IMAGE */}
                <img
                  src={city.image}
                  alt={city.name}
                  className="h-48 w-full object-cover"
                />

                {/* CONTENT */}
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="text-lg font-bold">{city.name}</h3>
                  <p className="text-gray-500 text-sm">
                    {city.stateName}
                  </p>

                  <div className="text-sm text-gray-500 mt-2">
                    {city.attractions} Attractions · {city.homestays} Homestays
                  </div>

                  <p className="text-sm text-gray-600 mt-2 flex-grow">
                    {city.knownFor}
                  </p>

                  <Link to={`/city/${city.slug}`}>
                    <button className="mt-4 w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-md">
                      View City
                    </button>
                  </Link>
                </div>
              </div>
            ))}

          </div>
        ) : (
          <div className="text-center py-16 bg-gray-100 rounded-lg shadow">
            <h2 className="text-2xl font-semibold">
              No Cities Found
            </h2>
            <p className="text-gray-500 mt-2">
              Try a different search.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default Explore;