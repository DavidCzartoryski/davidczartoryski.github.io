import { AudioProvider } from "@/components/AudioProvider";
import { IntroProvider } from "@/components/IntroContext";
import IntroGate from "@/components/IntroGate";
import Nav from "@/components/Nav";
import NightFlight from "@/components/three/NightFlight";

/**
 * The full experience: the song, the boarding intro, and the WebGL layer.
 * The recruiter view sits outside this group, so none of it loads there.
 */
export default function ExperienceLayout({ children }: { children: React.ReactNode }) {
  return (
    <AudioProvider>
      <IntroProvider>
        <div aria-hidden className="grain" />
        <IntroGate />
        <NightFlight />
        <Nav />
        {children}
      </IntroProvider>
    </AudioProvider>
  );
}
