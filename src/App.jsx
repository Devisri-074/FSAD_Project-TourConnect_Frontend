import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";

import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import Explore from "./Pages/Explore";
import City from "./Pages/City";
import Attraction from "./Pages/Attraction";
import Plan from "./Pages/Plan";
import Homestay from "./Pages/Homestay";
import Guide from "./Pages/Guide";
import TouristDashboard from "./Pages/TouristDashboard";
import GuideDashboard from "./Pages/GuideDashboard";
import HomestayDashboard from "./Pages/HomestayDashboard";
import AdminDashboard from "./Pages/AdminDashboard";
import Navbar from "./components/Navbar";

import AboutUs from "./Pages/AboutUs";

import ForgotPassword from "./Pages/ForgotPassword";

// ✅ NEW COMPONENT TO CONTROL NAVBAR
function Layout() {
  const location = useLocation();

  // 🔥 hide navbar on these pages
  const hideNavbar =
    location.pathname === "/dashboard" ||
    location.pathname === "/guide-dashboard" ||
    location.pathname === "/host-dashboard" ||
    location.pathname === "/admin-dashboard" ||
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/forgot-password";

  return (
    <>
      {!hideNavbar && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/city/:slug" element={<City />} />
        <Route path="/attraction/:city/:attraction" element={<Attraction />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/homestay" element={<Homestay />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/dashboard" element={<TouristDashboard />} />
        <Route path="/guide-dashboard" element={<GuideDashboard />} />
        <Route path="/host-dashboard" element={<HomestayDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Routes>
    </>
  );
}

function App() {

  // ✅ AUTO CREATE GUIDE + HOST USERS
  useEffect(() => {
    const users = JSON.parse(localStorage.getItem("users")) || [];

    const hasGuide = users.some((u) => u.role === "guide");
    const hasHost = users.some((u) => u.role === "host");

    if (!hasGuide || !hasHost) {
      const defaultUsers = [
        {
          fullName: "Demo Guide",
          email: "guide@test.com",
          phone: "9999999999",
          countryCode: "+91",
          password: "1234",
          role: "guide",
        },
        {
          fullName: "Demo Host",
          email: "host@test.com",
          phone: "8888888888",
          countryCode: "+91",
          password: "1234",
          role: "host",
        },
        {
          fullName: "Admin Portal",
          email: "admin@test.com",
          phone: "0000000000",
          countryCode: "+91",
          password: "admin",
          role: "admin",
        },
      ];

      localStorage.setItem(
        "users",
        JSON.stringify([...users, ...defaultUsers])
      );
    }
  }, []);

  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;