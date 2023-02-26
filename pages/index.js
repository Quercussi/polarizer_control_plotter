import styles from "@/styles/Home.module.css";
import React, { useState } from "react";
import mqtt from "mqtt";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";

const broker = "wss://test.mosquitto.org:8081";

const client = mqtt.connect(broker);

const topicTargetLux = "PoleCont/targetIlluminance";
const topicLight = "PoleCont/isLightOn";
const topicData = "PoleCont/data";

export default function Home() {
  Chart.register(...registerables);
  const [targetLux, setTargetLux] = useState(0);
  const [isLightOn, setIsLightOn] = useState(true);

  const receivedTargetLux = [];
  const result = [];
  var lowerBound = [];
  var upperBound = [];
  const servoAngle = [];

  const labels = Array(100).fill("");

  client.on("connect", () => client.subscribe(topicData));

  client.on("message", (topic, message) => {
    var data = JSON.parse(message.toString());
    console.log(data);

    receivedTargetLux.push(data["targetLux"]);
    result.push(data["result"]);
    servoAngle.push(data["servoArgument"]);

    while (receivedTargetLux.length > 100) {
      receivedTargetLux.shift();
      result.shift();
      servoAngle.shift();
    }
    lowerBound = Array(100).fill(data["lowerBound"]);
    upperBound = Array(100).fill(data["upperBound"]);
    console.log(receivedTargetLux);
  });

  return (
    <div>
      <div>
        <p>Target Illuminance: {targetLux}</p>
        <input
          type="range"
          min={0}
          max={20000}
          onChange={(e) => {
            client.publish(topicTargetLux, e.target.value);
            setTargetLux(e.target.value);
          }}
        />
      </div>
      <div>
        <button
          type="button"
          onClick={(e) => {
            setIsLightOn(!isLightOn);
            client.publish(topicLight, isLightOn.toString());
          }}
        >
          Toggle Light
        </button>
      </div>
      <br />
      <Line
        data={{
          labels,
          datasets: [
            {
              label: "Target Illuminance",
              data: receivedTargetLux,
              backgroundColor: "#36A2EB",
              borderColor: "#36A2EB",
            },
            // {
            //   label: "Result Illuminance",
            //   data: result,
            //   backgroundColor: "#4BC0C0",
            //   borderColor: "#4BC0C0",
            // },
            // {
            //   label: "Lower Bound",
            //   data: lowerBound,
            //   backgroundColor: "#FF6384",
            //   borderColor: "#FF6384",
            // },
            // {
            //   label: "Upper Bound",
            //   data: upperBound,
            //   backgroundColor: "#FA7893",
            //   borderColor: "#FA7893",
            // },
          ],
        }}
        options={{
          responsive: true,
          scales: {
            maintainAspectRatio: false,
            x: { suggestedMin: 0, suggestedMax: 100 },
            y: { suggestedMin: 0, suggestedMax: 20000 },
          },
        }}
      />
    </div>
  );
}
