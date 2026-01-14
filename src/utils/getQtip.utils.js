import axios from "axios";

const getQtip = async (id) => {
  const api_url = import.meta.env.VITE_API_URL;
  try {
    // Extract the numeric ID from the full anime ID (e.g., "one-piece-100" -> "100")
    const numericId = id.split("-").pop();
    const response = await axios.get(`${api_url}/qtip/${numericId}`);
    return response.data.results;
  } catch (err) {
    console.error("Error fetching qtip info:", err);
    return null; 
  }
};

export default getQtip;
