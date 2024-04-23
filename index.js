import express from "express";
import axios from "axios";
import PocketBase from "pocketbase";

const pb = new PocketBase("https://linkify.pockethost.io/");

const app = express();
const PORT = 8080;

const getWeather = async (city) => {
  let response = await axios.get(
    `http://api.weatherapi.com/v1/current.json?key=6c5c3579842f4dab8af195057241704&q=${city}&aqi=no`
  );
  if (response.data && response.data.location) {
    let data = response.data;
    const newData = {
      name: data.location.name,
      temp: data.current.temp_c,
      cloud: data.current.cloud,
      humidity: data.current.humidity,
      wind: data.current.wind_kph,
      condition: data.current.condition.text,
      code: data.current.condition.code,
      date: data.location.localtime,
      is_day: data.current.is_day,
    };
    try {
      const record = await pb
        .collection("weather")
        .getFirstListItem(`name = "${newData.name}"`);
      await pb.collection("weather").update(record.id, newData);
      console.log("UPDATED");
    } catch {
      await pb.collection("weather").create(newData);
      console.log("CREATED");
    }
    return newData;
  } else {
    console.log("Retrying");
    return await getWeather(city);
  }
};

app.get("/:city", async (req, res) => {
  const { city } = req.params;
  try {
    const data = await getWeather(city);
    res.send(data);
  } catch (error) {
    console.log("error");
    res.send({ error: "Error fetching weather data" });
  }
});

app.get("/mongo/:city", async (req, res) => {
  const { city } = req.params;
  try {
    const record = await pb
      .collection("weather")
      .getFirstListItem(`name = "${city}"`);
    res.send(record);
  } catch {
    res.send({ error: "No data found" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on port http://localhost:${PORT}`);
});
