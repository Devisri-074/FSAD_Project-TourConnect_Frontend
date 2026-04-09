import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react"; 

function Home() {
  const navigate = useNavigate();


  const images = [
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    "https://images.unsplash.com/photo-1494526585095-c41746248156",
    "https://images.unsplash.com/photo-1470770841072-f978cf4d019e"
  ];

  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        position: "relative",
        color: "white",
        overflow: "hidden",
      }}
    >
      {/* Background */}
      {images.map((img, index) => (
        <img
          key={index}
          src={img}
          alt="bg"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: index === bgIndex ? 1 : 0,
            transition: "opacity 1.5s ease-in-out",
            transform: index === bgIndex ? "scale(1.1)" : "scale(1)",
            transitionProperty: "opacity, transform",
            transitionDuration: "1.5s",
            transitionTimingFunction: "ease-in-out"
          }}
        />
      ))}

      {/* Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Main */}
        <div
          style={{
            minHeight: "70vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            fontFamily: "'Playfair Display', serif"
          }}
        >
          <h1 style={{ fontSize: "100px", fontWeight: "bold" }}>
            TourConnect
          </h1>

          <p style={{ fontSize: "20px", marginTop: "0px" }}>
            Where Travel Meets Comfort
          </p>

          <Link
            to="/explore"
            style={{
              marginTop: "20px",
              padding: "12px 30px",
              backgroundColor: "#f4b400",
              borderRadius: "25px",
              color: "white",
              textDecoration: "none",
              fontSize: "20px",
            }}
          >
            Explore with TourConnect
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;