import styles from "@/styles/Home.module.css";
import React, { useState } from "react";
import mqtt from "mqtt";

const broker = "wss://test.mosquitto.org:8081";

const subClient = mqtt.connect(broker);
const pubClient = mqtt.connect(broker);

const topicTargetLux = "PoleCont/targetIlluminance";
const topicData = "PoleCont/data";

export default function Home() {
  const [targetLux, setTargetLux] = useState(0);

  pubClient.on("connect", () => subClient.subscribe(topicData));

  subClient.on("message", (topic, message) => console.log(message.toString()));

  return (
    <div>
      <div>
        <p>Target Illuminance: {targetLux}</p>
        <input
          type="range"
          min={0}
          max={20000}
          onChange={(e) => {
            pubClient.publish(topicTargetLux, e.target.value);
            setTargetLux(e.target.value);
          }}
        />
      </div>
    </div>
  );
}
