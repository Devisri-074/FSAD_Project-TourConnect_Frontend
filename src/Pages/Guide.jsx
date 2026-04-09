import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { guidesByCity } from "../data/guides";

function Guide() {
  const navigate = useNavigate();

  const location = useLocation();
  const { city } = location.state || {};

  // Merging hardcoded guides and dynamically registered live Guides
  const hardcodedGuides = guidesByCity[city?.toLowerCase()] || [];
  
  const allUsers = JSON.parse(localStorage.getItem("users")) || [];
  const liveGuides = allUsers
    .filter(u => u.role === "guide" && u.approvalStatus === "approved")
    .map(u => ({
       name: u.fullName,
       image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=2080&auto=format&fit=crop", // generic verified guide headshot
       speciality: "Cultural & Heritage Expert",
       rating: 4.8,
       language: "English, Local Native",
       price: 1500, // Standard platform rate
       isLiveSystemGuide: true
    }));

  // We append live guides to ANY city during the demo so they can be booked anywhere!
  const guidesData = [...hardcodedGuides, ...liveGuides];

  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  // ✅ POPUP STATES
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [redirectToStay, setRedirectToStay] = useState(false);

  const filteredGuides = guidesData.filter((g) => {
    const matchSearch =
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.speciality.toLowerCase().includes(search.toLowerCase());

    const matchRating =
      ratingFilter === "all" || g.rating >= Number(ratingFilter);

    return matchSearch && matchRating;
  });

  return (
    <div className="min-h-screen bg-[#f5efe4] px-6 py-8 pt-24">

      <h1 className="text-3xl font-bold text-center mb-6">
        Guides in {city} 👨‍🏫
      </h1>

      <div className="flex flex-wrap gap-3 justify-center mb-8">

        <input
          type="text"
          placeholder="Search guide or speciality..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-4 py-2 rounded-lg w-64"
        />

        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="border px-4 py-2 rounded-lg"
        >
          <option value="all">All Ratings</option>
          <option value="4">4+ ⭐</option>
          <option value="4.5">4.5+ ⭐</option>
        </select>

      </div>

      <div className="grid md:grid-cols-3 gap-6">

        {filteredGuides.length === 0 ? (
          <p className="text-center col-span-3 text-gray-500">
            No guides available for this city 😔
          </p>
        ) : (
          filteredGuides.map((guide, index) => {

            // ✅ CHECK IF ALREADY BOOKED
            const cityKey = city.toLowerCase().trim();
            const bookedGuide = localStorage.getItem(`guideName_${cityKey}`);
            const isBooked = bookedGuide === guide.name;

            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md p-5 text-center hover:shadow-xl transition"
              >
                <img
                  src={guide.image}
                  className="w-24 h-24 rounded-full mx-auto object-cover mb-3"
                />

                {/* ✅ BADGE */}
                {isBooked && (
                  <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full inline-block mb-2">
                    ✔ Already Booked
                  </div>
                )}

                <h2 className="text-xl font-semibold">{guide.name}</h2>

                <p className="text-yellow-500">⭐ {guide.rating}</p>

                <p className="text-gray-500 text-sm mt-1">
                  {guide.speciality}
                </p>

                <p className="text-gray-500 text-sm">
                  {guide.language}
                </p>

                <p className="text-green-600 font-bold mt-2">
                  ₹{guide.price}/day
                </p>

                <div className="flex gap-2 mt-4 justify-center">

                  <button
                    onClick={() => {
                      setSelectedGuide(guide);
                      setChatOpen(true);
                      setMessages([]);
                    }}
                    className="bg-gray-200 px-3 py-1 rounded"
                  >
                    Chat 💬
                  </button>

                  <button
                    onClick={() =>
                      alert(`Contact ${guide.name} at 9876543210`)
                    }
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                  >
                    Contact 📞
                  </button>

                </div>

                {/* ✅ UPDATED BOOK BUTTON */}
                <button
                  disabled={isBooked}
                  onClick={() => {
                    if (isBooked) return;

                    const cityKey = city.toLowerCase().trim();

                    localStorage.setItem(`guideName_${cityKey}`, guide.name);
                    localStorage.setItem(`guidePrice_${cityKey}`, guide.price);

                    const existingStay = localStorage.getItem(`homestayName_${cityKey}`);

                    if (existingStay) {
                      setPopupMessage("Guide booked successfully! 🎉\n\nHomestay already booked 🏡");
                      setRedirectToStay(false);
                    } else {
                      setPopupMessage("Guide booked successfully! 🎉\n\nDo you want to book a homestay too? 🏡");
                      setRedirectToStay(true);
                    }

                    setShowPopup(true);
                  }}
                  className={`mt-4 w-full py-2 rounded-lg text-white ${
                    isBooked
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-yellow-500 hover:bg-yellow-600"
                  }`}
                >
                  {isBooked ? "Already Booked" : "Book Guide"}
                </button>

              </div>
            );
          })
        )}

      </div>

      {/* ✅ POPUP */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          
          <div className="bg-white rounded-2xl shadow-xl w-[400px] p-6 text-center">
            
            <div className="text-3xl mb-2">✔️</div>

            <p className="text-gray-800 mb-6 whitespace-pre-line font-medium">
              {popupMessage}
            </p>

            {/* ✅ FIXED BUTTON LOGIC */}
            {redirectToStay ? (
              <div className="flex justify-center gap-4">
                
                <button
                  onClick={() => {
                    setShowPopup(false);
                    navigate("/homestay", { state: { city } });
                  }}
                  className="bg-yellow-500 text-white px-5 py-2 rounded-lg hover:bg-yellow-600"
                >
                  Yes
                </button>

                <button
                  onClick={() => {
                    setShowPopup(false);
                    navigate("/plan", { state: { city } });
                  }}
                  className="bg-gray-200 px-5 py-2 rounded-lg hover:bg-gray-300"
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

export default Guide;