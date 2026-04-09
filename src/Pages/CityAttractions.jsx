import { useParams } from "react-router-dom";
import { useState } from "react";
import { attractionsByCity } from "../data/attractions";
import AttractionCard from "../components/AttractionCard";

function CityAttractions() {
  const { city } = useParams();

  const attractions = attractionsByCity[city] || [];

  // ✅ selection state
  const [selectedPlaces, setSelectedPlaces] = useState([]);

  // ✅ toggle select
  const toggleSelect = (place) => {
    const exists = selectedPlaces.find(p => p.name === place.name);

    if (exists) {
      setSelectedPlaces(selectedPlaces.filter(p => p.name !== place.name));
    } else {
      setSelectedPlaces([...selectedPlaces, place]);
    }
  };

  return (
    <div className="p-6">

      <h1 className="text-3xl font-bold mb-6">
        Attractions in {city}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {attractions.map((attraction, index) => (
          <AttractionCard
            key={index}
            attraction={attraction}
            city={city}
            toggleSelect={toggleSelect}
            isSelected={selectedPlaces.some(
              (p) => p.name === attraction.name
            )}
          />
        ))}
      </div>

    </div>
  );
}

export default CityAttractions;