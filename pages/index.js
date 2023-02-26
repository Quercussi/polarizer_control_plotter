import styles from "@/styles/Home.module.css";
import React, { useEffect, useRef, useState } from "react";
import mqtt from "mqtt";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";

const broker = "wss://test.mosquitto.org:8081";

const client = mqtt.connect(broker);

const topicTargetLux = "PoleCont/targetIlluminance";
const topicLight = "PoleCont/isLightOn";
const topicData = "PoleCont/data";

var count = 1;
const labels = Array(1000).fill("");
const receivedTargetLux = Array(1000).fill(0);
const result = Array(1000).fill(0);
var lowerBound = Array(1000).fill(0);
var upperBound = Array(1000).fill(0);
const servoAngle = Array(1000).fill(0);
const dataLine = {
  labels: labels,
  datasets: [
    {
      label: "Target Illuminance",
      data: receivedTargetLux,
      backgroundColor: "#36A2EB",
      borderColor: "#36A2EB",
    },
    {
      label: "Result Illuminance",
      data: result,
      backgroundColor: "#4BC0C0",
      borderColor: "#4BC0C0",
    },
    {
      label: "Lower Bound",
      data: lowerBound,
      backgroundColor: "#FF6384",
      borderColor: "#FF6384",
    },
    {
      label: "Upper Bound",
      data: upperBound,
      backgroundColor: "#FA7893",
      borderColor: "#FA7893",
    },
  ],
};
const options = {
  responsive: true,
  elements: {
    point: {
      radius: 0,
    },
  },
  scales: {
    x: { suggestedMin: 0, suggestedMax: 1000 },
    y: { suggestedMin: 0, suggestedMax: 20000 },
  },
};

export default function Home() {
  Chart.register(...registerables);
  const [targetLux, setTargetLux] = useState(0);
  const [isLightOn, setIsLightOn] = useState(true);

  const lineChart = useRef(null);

  client.on("connect", () => client.subscribe(topicData));

  client.on("message", (topic, message) => {
    var dataJSON = JSON.parse(message.toString());

    dataLine["datasets"][0]["data"].push(dataJSON["targetLux"]); // receivedTargetLux
    dataLine["datasets"][1]["data"].push(dataJSON["result"]); // result
    servoAngle.push(dataJSON["servoArgument"]);

    while (dataLine["datasets"][0]["data"].length > 1000) {
      dataLine["datasets"][0]["data"].shift();
      dataLine["datasets"][1]["data"].shift();
      servoAngle.shift();
    }
    if (dataLine["datasets"][2]["data"] == 0) {
      dataLine["datasets"][2]["data"] = Array(1000).fill(
        dataJSON["lowerBound"]
      ); // lowerBound
      dataLine["datasets"][3]["data"] = Array(1000).fill(
        dataJSON["upperBound"]
      ); // upperBound
    }
  });

  useEffect(() => {
    setInterval(() => {
      const chart = lineChart.current;
      if (chart != null) chart.update();
    }, 5000);
  });

  return (
    <div className="bg-dark">
      <div className="illu-container col-6 p-3">
        <p className="illu-text rounded-0 bg-primary">
          Target Illuminance: <br></br>
          {targetLux}🔆
        </p>
        <input
          type="range"
          min={0}
          max={20000}
          onChange={(e) => {
            client.publish(topicTargetLux, e.target.value);
            setTargetLux(e.target.value);
            console.log("setting target: " + e.target.value);
          }}
        />
        <br></br>
        <button
          className="btn btn-primary toggle-btn"
          type="button"
          onClick={(e) => {
            setIsLightOn(!isLightOn);
            client.publish(topicLight, isLightOn.toString());
            console.log("setting light: " + isLightOn.toString());
          }}
        >
          Toggle Light
        </button>
      </div>

      <br />
      <Line data={dataLine} options={options} ref={lineChart} />
    </div>
  );
}
