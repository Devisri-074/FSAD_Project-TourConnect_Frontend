import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";

function Plan() {
  const location = useLocation();
  const navigate = useNavigate();

  const loginSuccess = location.state?.loginSuccess;

  // ✅ SAFE (prevents null crash)
  const savedPlan = JSON.parse(localStorage.getItem("currentPlan")) || {};
  const [redirectToLogin, setRedirectToLogin] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const [guideName, setGuideName] = useState("");

  const isNewCity = location.state?.city && savedPlan?.city && location.state.city !== savedPlan.city;

  const selectedPlaces =
    isNewCity ? location.state.selectedPlaces : (location.state?.selectedPlaces || savedPlan?.selectedPlaces || []);

  const city =
    location.state?.city || savedPlan?.city;

  const [startDate, setStartDate] = useState(
    isNewCity ? "" : (savedPlan?.startDate || "")
  );

  const [endDate, setEndDate] = useState(
    isNewCity ? "" : (savedPlan?.endDate || "")
  );

  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const [homestayPrice, setHomestayPrice] = useState(() => {
    if (!city) return 0;
    const cityKey = city.toLowerCase().trim();
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return 0;
    return Number(localStorage.getItem(`homestayPrice_${cityKey}`)) || 0;
  });
  const [guidePrice, setGuidePrice] = useState(() => {
    if (!city) return 0;
    const cityKey = city.toLowerCase().trim();
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return 0;
    return Number(localStorage.getItem(`guidePrice_${cityKey}`)) || 0;
  });
  const [homestayName, setHomestayName] = useState(() => {
    if (!city) return "";
    const cityKey = city.toLowerCase().trim();
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return "";
    return localStorage.getItem(`homestayName_${cityKey}`) || "";
  });

  // SAVE PLAN AUTO
  useEffect(() => {
    const planData = {
      city,
      selectedPlaces,
      startDate,
      endDate
    };

    localStorage.setItem("currentPlan", JSON.stringify(planData));
  }, [city, selectedPlaces, startDate, endDate]);
  useEffect(() => {
    if (!city) return;

    const cityKey = city.toLowerCase().trim();

    // 🔥 track active city
    const activeCity = localStorage.getItem("activeCity");

    if (activeCity && activeCity !== cityKey) {
      // ❌ clear ONLY previous city data
      localStorage.removeItem(`homestayName_${activeCity}`);
      localStorage.removeItem(`homestayPrice_${activeCity}`);
      localStorage.removeItem(`guideName_${activeCity}`);
      localStorage.removeItem(`guidePrice_${activeCity}`);
    }

    localStorage.setItem("activeCity", cityKey);
  }, [city]);
  const totalDuration = selectedPlaces.reduce((total, place) => {
    const num = parseInt(place.duration);
    return total + (isNaN(num) ? 1 : num);
  }, 0);

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = (end - start) / (1000 * 60 * 60 * 24);
    return diff > 0 ? diff : 0;
  };

  const totalDays = calculateDays();

  const baseCost = selectedPlaces.length * 700 * (totalDays || 1);
  const totalCost = baseCost + homestayPrice + guidePrice;

  // ✅ FIXED SAVE LOGIC ONLY
  const handleSaveClick = async () => {
    if (!startDate || !endDate) {
      setPopupMessage("Please select travel dates 📅");
      setShowPopup(true);
      return;
    }

    const today = new Date().setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start < today) {
      setPopupMessage("Start date cannot be in the past ⛔");
      setShowPopup(true);
      return;
    }

    if (end <= start) {
      setPopupMessage("End date must be after start date ⚠️");
      setShowPopup(true);
      return;
    }

    // ✅ SAFE USER CHECK
    const storedUser = localStorage.getItem("user");
    const currentUser = storedUser ? JSON.parse(storedUser) : null;

    // 🔥 NOT LOGGED IN → MESSAGE + REDIRECT
    // 🔥 NOT LOGGED IN → SHOW POPUP FIRST
    if (!currentUser) {
      setPopupMessage("Please login to save your plan 🔐");
      setShowPopup(true);
      setRedirectToLogin(true);
      return;
    }
    const savedPlans =
      JSON.parse(localStorage.getItem("savedPlans")) || [];

    const planId = `${currentUser.email}-${city}-${startDate}-${endDate}`;

    const alreadySaved = savedPlans.find(
      (plan) => plan.id === planId
    );

    if (alreadySaved) {
      setPopupMessage("Plan already saved ✅");
      setShowPopup(true);
      return;
    }

    const newPlan = {
  id: planId,

  city,
  selectedPlaces,
  startDate,
  endDate,

  userEmail: currentUser.email,

  // 🔥 ADD THIS (VERY IMPORTANT)
  homestayName:
    localStorage.getItem(`homestayName_${city.toLowerCase().trim()}`) || "N/A",

  guideName:
    localStorage.getItem(`guideName_${city.toLowerCase().trim()}`) || "N/A",

  homestayPrice:
    Number(localStorage.getItem(`homestayPrice_${city.toLowerCase().trim()}`)) || 0,

  guidePrice:
    Number(localStorage.getItem(`guidePrice_${city.toLowerCase().trim()}`)) || 0,

  // 🔥 ADD THIS (IMPORTANT FOR HOST)
  status: "pending",

  createdAt: new Date().toISOString(),
};
    savedPlans.push(newPlan);
    localStorage.setItem("savedPlans", JSON.stringify(savedPlans));

    const guideNameFromStorage =
      localStorage.getItem(`guideName_${city.toLowerCase().trim()}`) || "N/A";

    const homestayNameFromStorage =
      localStorage.getItem(`homestayName_${city.toLowerCase().trim()}`) || "N/A";

    try {
      await fetch("http://localhost:8080/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          city: city,
          homestayName: homestayNameFromStorage,
          guideName: guideNameFromStorage,
          userEmail: currentUser.email,
          startDate: startDate,
          endDate: endDate,
          homestayPrice: homestayPrice,
          guidePrice: guidePrice,
          hostId: 1,
        }),
      });
    } catch (error) {
      console.warn("Backend offline, plan saved locally.");
    }

    setPopupMessage("Plan Saved Successfully!");
    setShowPopup(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 px-6 pt-24 pb-8">

      <div className="flex items-center justify-between mb-10 mt-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow hover:bg-gray-100"
        >
          <ArrowLeft size={18} /> Back
        </button>

        <h1 className="text-3xl font-bold text-gray-800">
          Your Travel Plan
        </h1>

        <div></div>
      </div>

      {loginSuccess && (
        <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg mb-6 text-center font-medium">
          ✅ Logged in successfully! Now you can save your plan.
        </div>
      )}

      {selectedPlaces.length === 0 ? (
        <p className="text-center text-gray-500 mt-20 text-lg">
          No places selected
        </p>
      ) : (
        <>
          <div className="bg-white shadow-xl rounded-2xl p-6 mb-10 flex flex-col md:flex-row justify-between gap-6">

            <div className="space-y-2">
              <p><strong>📍 City:</strong> {city}</p>
              <p><strong>Total Places:</strong> {selectedPlaces.length}</p>
              <p><strong>Total Duration:</strong> {totalDuration} hrs</p>
              <p><strong>Trip Duration:</strong> {totalDays} day(s)</p>

              <p className="text-lg font-semibold text-green-600">
                Estimated cost: ₹{totalCost}
              </p>

              {homestayName && (
                <p className="text-sm text-gray-600">
                  🏡 Stay: {homestayName}
                </p>
              )}
              {guideName && (
                <p className="text-sm text-gray-600">
                  👨‍🏫 Guide: {guideName}
                </p>
              )}

              <p className="text-sm text-gray-500">
                {selectedPlaces.map(p => p.name).join(" → ")}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border px-3 py-2 rounded-lg"
              />

              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border px-3 py-2 rounded-lg"
              />

              <button
                onClick={handleSaveClick}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
              >
                Save Plan 💾
              </button>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {selectedPlaces.map((place, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden">
                <img src={place.image} className="h-44 w-full object-cover" />
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{place.name}</h3>
                  <p className="text-yellow-500 text-sm">⭐ {4 + (index % 2) * 0.5}</p>
                  <p className="text-gray-500 text-sm mt-1">{place.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 flex justify-center gap-6">
            <button
              onClick={() => {
                // ✅ 1. CHECK DATES
                if (!startDate || !endDate) {
                  setPopupMessage("Please select travel dates 📅");
                  setShowPopup(true);
                  return;
                }

                const today = new Date().setHours(0, 0, 0, 0);
                const start = new Date(startDate);
                const end = new Date(endDate);

                // ❌ past date
                if (start < today) {
                  setPopupMessage("Start date cannot be in the past ⛔");
                  setShowPopup(true);
                  return;
                }

                // ❌ invalid range
                if (end <= start) {
                  setPopupMessage("End date must be after start date ⚠️");
                  setShowPopup(true);
                  return;
                }

                // ✅ 2. CHECK LOGIN
                const storedUser = localStorage.getItem("user");
                const currentUser = storedUser ? JSON.parse(storedUser) : null;

                if (!currentUser) {
                  setPopupMessage("Please login to book homestay 🔐");
                  setShowPopup(true);
                  setRedirectToLogin(true);
                  return;
                }

                // ✅ 3. ALL GOOD → NAVIGATE
                navigate("/homestay", { state: { city } });
              }}
              className="bg-green-500 text-white px-6 py-2 rounded-lg shadow hover:bg-green-600"
            >
              Book Home Stay 🏡
            </button>
            <button
              onClick={() => {
                // ✅ 1. CHECK DATES
                if (!startDate || !endDate) {
                  setPopupMessage("Please select travel dates 📅");
                  setShowPopup(true);
                  return;
                }

                const today = new Date().setHours(0, 0, 0, 0);
                const start = new Date(startDate);
                const end = new Date(endDate);

                // ❌ past date
                if (start < today) {
                  setPopupMessage("Start date cannot be in the past ⛔");
                  setShowPopup(true);
                  return;
                }

                // ❌ invalid range
                if (end <= start) {
                  setPopupMessage("End date must be after start date ⚠️");
                  setShowPopup(true);
                  return;
                }

                // ✅ 2. CHECK LOGIN
                const storedUser = localStorage.getItem("user");
                const currentUser = storedUser ? JSON.parse(storedUser) : null;

                if (!currentUser) {
                  setPopupMessage("Please login to hire a guide 🔐");
                  setShowPopup(true);
                  setRedirectToLogin(true);
                  return;
                }

                // ✅ 3. ALL GOOD → NAVIGATE
                navigate("/guide", { state: { city } });
              }}
              className="bg-gray-200 px-6 py-2 rounded-lg hover:bg-gray-300"
            >
              Hire Local Guide 👨‍🏫
            </button>
          </div>
        </>
      )}

      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl text-center">
            <h2 className="text-lg font-bold mb-2">Notice</h2>
            <p className="mb-4">{popupMessage}</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setShowPopup(false);

                  if (redirectToLogin) {
                    navigate("/login", { state: { from: "/plan" } });
                    setRedirectToLogin(false);
                  } else if (popupMessage.includes("Plan Saved") || popupMessage.includes("Plan already saved")) {
                    navigate("/dashboard");
                  }
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                OK
              </button>

              {/* ✅ SHOW CANCEL ONLY WHEN LOGIN IS REQUIRED */}
              {redirectToLogin && (
                <button
                  onClick={() => {
                    setShowPopup(false);
                    setRedirectToLogin(false);
                  }}
                  className="bg-gray-200 px-4 py-2 rounded"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Plan;