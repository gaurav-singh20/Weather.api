import express from "express";
import axios from "axios";
import PocketBase from "pocketbase";

const pb = new PocketBase("https://linkify.pockethost.io/");

const app = express();
const PORT = 8080;

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/:city", async (req, res) => {
  const { city } = req.params;
  try {
    let response = await axios.get(
      `http://api.weatherapi.com/v1/current.json?key=6c5c3579842f4dab8af195057241704&q=${city}&aqi=no`
    );
    if (response.data && response.data.location) {
      let data = response.data;
      console.log(data);
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
      res.send(newData);
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
    } else {
      res.status(400).send({ error: "Invalid response from weather API" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error fetching weather data" });
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
