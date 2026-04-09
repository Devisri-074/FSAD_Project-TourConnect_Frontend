import { useParams } from "react-router-dom";
import { attractionsByCity } from "../data/attractions";

function Attraction() {
  const { city, attraction } = useParams();

  const data = attractionsByCity[city]?.find(
    (item) => item.slug === attraction
  );

  if (!data) return <h1>Not Found</h1>;

  return (
    <div className="p-6">

      <img
        src={data.image}
        className="w-full h-80 object-cover rounded"
      />

      <h1 className="text-3xl font-bold mt-4">
        {data.name}
      </h1>

      <p className="mt-2 text-gray-600">
        {data.description}
      </p>

      <h2 className="mt-4 font-semibold">History</h2>
      <p>{data.history}</p>

      <h2 className="mt-4 font-semibold">Famous For</h2>
      <p>{data.category}</p>

    </div>
  );
}

export default Attraction;