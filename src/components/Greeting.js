"use client";
import { useEffect, useState } from "react";

export default function Greeting() {
  const [text, setText] = useState("Hello");

  useEffect(() => {
    const h = new Date().getHours();
    setText(h < 5 ? "Working late" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);

  return text;
}
