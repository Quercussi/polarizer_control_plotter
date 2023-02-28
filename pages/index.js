import styles from "@/styles/Home.module.css";
import React, { useEffect, useRef, useState } from "react";
import mqtt from "mqtt";
import { Doughnut, Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";

const broker = "wss://test.mosquitto.org:8081";

const client = mqtt.connect(broker);

const topicTargetLux = "PoleCont/targetIlluminance";
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

const dataAngular = {
  labels: labels,
  datasets: [
    {
      label: "Film Argument",
      data: servoAngle,
      backgroundColor: "#FF6384",
      borderColor: "#FF6384",
    },
  ],
};

const lineOptions = {
  responsive: true,
  elements: {
    point: {
      radius: 0,
    },
  },
  scales: {
    x: { min: 0, max: 1000 },
    y: { min: 0, max: 10000 },
  },
  plugins: {
    title: {
      display: true,
      text: "Data",
    },
  },
};

const servoOptions = {
  Title: "Film Argument",
  responsive: true,
  elements: {
    point: {
      radius: 0,
    },
  },
  scales: {
    x: { min: 0, max: 1000 },
    y: { min: 0, max: 180 },
  },
  plugins: {
    title: {
      display: true,
      text: "Polarization Film Argument",
    },
  },
};

export default function Home() {
  Chart.register(...registerables);
  const [targetLux, setTargetLux] = useState(0);

  const lineChart = useRef(null);
  const servoChart = useRef(null);

  client.on("connect", () => client.subscribe(topicData));

  client.on("message", (topic, message) => {
    var dataJSON = JSON.parse(message.toString());

    dataLine["datasets"][0]["data"].push(dataJSON["targetLux"]); // receivedTargetLux
    dataLine["datasets"][1]["data"].push(dataJSON["result"]); // result
    dataLine["datasets"][2]["data"].push(dataJSON["lowerBound"]); // lowerBound
    dataLine["datasets"][3]["data"].push(dataJSON["upperBound"]); // upperBound
    dataAngular["datasets"][0]["data"].push(dataJSON["servoArgument"]);

    while (dataLine["datasets"][0]["data"].length > 1000) {
      dataLine["datasets"][0]["data"].shift();
      dataLine["datasets"][1]["data"].shift();
      dataLine["datasets"][2]["data"].shift();
      dataLine["datasets"][3]["data"].shift();

      dataAngular["datasets"][0]["data"].shift();
    }
  });

  useEffect(() => {
    setInterval(() => {
      const chart = lineChart.current;
      if (chart != null) chart.update();
      const chart2 = servoChart.current;
      if (chart2 != null) chart2.update();
    }, 5000);
  });

  return (
    <div className="bg-dark">
      <div class="d-flex justify-content-center flex-wrap">
        <div className="illu-container col-6 p-3 ">
          <p className="illu-text rounded-0 bg-primary">
            Target Illuminance: <br></br>
            {targetLux}🔆
          </p>
          <input
            className="illu-bar"
            type="range"
            min={0}
            max={20000}
            onChange={(e) => {
              client.publish(topicTargetLux, e.target.value);
              setTargetLux(e.target.value);
              console.log("setting target: " + e.target.value);
            }}
          />
        </div>
      </div>
      <br />
      <Line data={dataLine} options={lineOptions} ref={lineChart} />
      <br />
      <Line data={dataAngular} options={servoOptions} ref={servoChart} />
    </div>
  );
}
