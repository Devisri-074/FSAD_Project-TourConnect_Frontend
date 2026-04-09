import { useLocation, useNavigate, Link } from "react-router-dom";
import { homestaysByCity } from "../data/Homestays";
import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";

function Homestay() {
  const location = useLocation();
  const navigate = useNavigate();
  const { city } = location.state || {};

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const [customHomestays, setCustomHomestays] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("customHomestays")) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleStorage = () => {
      try {
        setCustomHomestays(JSON.parse(localStorage.getItem("customHomestays")) || []);
      } catch {
        setCustomHomestays([]);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const safeCity = city ? city.toLowerCase().trim() : "";
  const cityCustomHomestays = customHomestays.filter(s => {
      if (!s || !s.city) return false;
      return s.approvalStatus === "approved" && (s.city.includes(safeCity) || safeCity.includes(s.city));
  });
  const homestays = [...(homestaysByCity[safeCity] || []), ...cityCustomHomestays];

  const [search, setSearch] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");

  // ✅ UPDATED POPUP STATES
  const [showPopup, setShowPopup] = useState(false);
  const [selectedStay, setSelectedStay] = useState(null);
  const [redirectToGuide, setRedirectToGuide] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const filtered = homestays.filter((stay) => {
    if (!stay) return false;

    const matchesSearch = (stay.name || "")
      .toLowerCase()
      .includes((search || "").toLowerCase());

    const matchesPrice =
      priceFilter === "all" ||
      (priceFilter === "low" && stay.price < 1000) ||
      (priceFilter === "mid" &&
        stay.price >= 1000 &&
        stay.price <= 2000) ||
      (priceFilter === "high" && stay.price > 2000);

    const matchesRating =
      ratingFilter === "all" ||
      (ratingFilter === "4" && stay.rating >= 4) ||
      (ratingFilter === "3" && stay.rating >= 3);

    return matchesSearch && matchesPrice && matchesRating;
  });

  return (
    <div className="min-h-screen bg-[#f5efe4] pt-24">

      {/* TITLE */}
      <div className="px-8 mt-6">
        <h2 className="text-4xl font-bold">
          Homestays in {city}
        </h2>

        <p className="text-gray-600 mt-2">
          Find comfortable and verified stays near top attractions
        </p>
      </div>

      {/* SEARCH + FILTER */}
      <div className="bg-white mx-8 mt-6 p-4 rounded-xl shadow flex flex-wrap gap-3 items-center">

        <input
          type="text"
          placeholder="🔍 Search homestays..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border px-4 py-2 rounded-lg"
        />

        <select
          value={priceFilter}
          onChange={(e) => setPriceFilter(e.target.value)}
          className="border px-4 py-2 rounded-lg"
        >
          <option value="all">All Prices</option>
          <option value="low">Below ₹1000</option>
          <option value="mid">₹1000 - ₹2000</option>
          <option value="high">Above ₹2000</option>
        </select>

        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="border px-4 py-2 rounded-lg"
        >
          <option value="all">All Ratings</option>
          <option value="4">4+ ⭐</option>
          <option value="3">3+ ⭐</option>
        </select>

      </div>

      {/* CARDS */}
      <div className="grid md:grid-cols-3 gap-6 px-8 mt-8 pb-10">

        {filtered.length === 0 ? (
          <p className="text-center col-span-3 text-gray-500">
            No homestays found 😔
          </p>
        ) : (
          filtered.map((stay, index) => {

            // ✅ CHECK BOOKED
            const cityKey = city.toLowerCase().trim();
            const bookedStay = localStorage.getItem(`homestayName_${cityKey}`);
            const isBooked = bookedStay === stay.name;

            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition"
              >
                <img
                  src={stay.image}
                  className="h-52 w-full object-cover"
                />

                <div className="p-4">

                  {/* ✅ BADGE */}
                  {isBooked && (
                    <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full inline-block mb-2">
                      ✔ Already Booked
                    </div>
                  )}

                  <h3 className="text-lg font-semibold">
                    {stay.name}
                  </h3>

                  <p className="text-sm text-gray-500">
                    📍 Near city center
                  </p>

                  <div className="flex justify-between items-center mt-2">
                    <p className="text-yellow-500 text-sm">
                      ⭐ {stay.rating}
                    </p>

                    <p className="text-green-600 font-bold">
                      ₹{stay.price}
                      <span className="text-sm text-gray-500">
                        /night
                      </span>
                    </p>
                  </div>

                  <p className="text-sm text-gray-500 mt-2">
                    Comfortable stay with great amenities and easy access to attractions.
                  </p>

                  {/* ✅ UPDATED BUTTON */}
                  <button
                    disabled={isBooked}
                    onClick={() => {
                      if (isBooked) return;

                      setSelectedStay(stay);

                      const cityKey = city.toLowerCase().trim();
                      localStorage.setItem(`homestayName_${cityKey}`, stay.name);
                      localStorage.setItem(`homestayPrice_${cityKey}`, stay.price);

                      const existingGuide = localStorage.getItem(`guideName_${cityKey}`);

                      if (existingGuide) {
                        setPopupMessage("Homestay booked successfully! 🎉\n\nGuide already booked 👨‍🏫");
                        setRedirectToGuide(false);
                      } else {
                        setPopupMessage("Homestay booked successfully! 🎉\n\nDo you want to hire a guide too? 👨‍🏫");
                        setRedirectToGuide(true);
                      }

                      setShowPopup(true);
                    }}
                    className={`mt-4 w-full py-2 rounded-lg text-white ${
                      isBooked
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-yellow-500 hover:bg-yellow-600"
                    }`}
                  >
                    {isBooked ? "Already Booked" : "Book Now"}
                  </button>

                </div>
              </div>
            );
          })
        )}

      </div>

      {/* ✅ POPUP */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

          <div className="bg-white p-6 rounded-xl text-center w-[90%] max-w-md shadow-lg">

            <h2 className="text-xl font-bold mb-3 text-green-600">
              ✅ {popupMessage}
            </h2>

            {/* ✅ FIXED BUTTONS */}
            {redirectToGuide ? (
              <div className="flex justify-center gap-4">

                <button
                  onClick={() => {
                    setShowPopup(false);
                    navigate("/guide", { state: { city } });
                  }}
                  className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
                >
                  Yes
                </button>

                <button
                  onClick={() => {
                    setShowPopup(false);
                    navigate("/plan", { state: { city } });
                  }}
                  className="bg-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  No
                </button>

              </div>
            ) : (
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setShowPopup(false);
                    navigate("/plan", { state: { city } });
                  }}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg"
                >
                  OK
                </button>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}

export default Homestay;