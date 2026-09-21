import Footer from "@/components/Footer";
import Arrivals from "@/components/sections/Arrivals";
import Cargo from "@/components/sections/Cargo";
import FlightLog from "@/components/sections/FlightLog";
import Hero from "@/components/sections/Hero";
import Layover from "@/components/sections/Layover";
import Mat from "@/components/sections/Mat";
import Passport from "@/components/sections/Passport";

export default function Home() {
  return (
    <main className="relative">
      <Hero />
      <Passport />
      <FlightLog />
      <Cargo />
      <Mat />
      <Layover />
      <Arrivals />
      <Footer />
    </main>
  );
}
