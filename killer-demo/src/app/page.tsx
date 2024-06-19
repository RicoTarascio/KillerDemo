import Image from "next/image";
import Map from "@components/map"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Map width={800} height={800} />
    </main>
  );
}
