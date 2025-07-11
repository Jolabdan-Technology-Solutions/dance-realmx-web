import { useEffect, useState } from "react";

const backgroundImages = [
    "/images/angels.png",
    "/images/letsgo.png",
    "/images/together.png",
];

export function HeroSlider() {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % backgroundImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative lg:w-1/2 p-8 flex flex-col justify-center h-screen max-h-screen sticky top-24 overflow-hidden">
      {/* Background Image Slider */}
      <div className="absolute inset-0 z-0">
        {backgroundImages.map((img, index) => (
          <img
            key={index}
            src={img}
            alt={`Slide ${index}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
              index === currentImage ? "opacity-40" : "opacity-0"
            }`}
          />
        ))}
        {/* Optional dark overlay */}
        <div className="absolute inset-0 bg-black/20 z-10" />
      </div>

      {/* Foreground Content */}
      <div className="relative z-20 text-center lg:text-left">
        <h1 className="text-3xl font-bold mb-4 text-white">DanceRealmX</h1>
        <h2 className="text-2xl font-semibold mb-6 text-white">
          Where Every Step Counts
        </h2>
        <p className="mb-6 text-gray-300">
          Join our vibrant community of dance enthusiasts, educators, and professionals. 
          Get access to premium courses, resources, and certification programs.
        </p>
        <ul className="space-y-2 mb-6">
          {[
            "Professional Dance Certification",
            "Exclusive Teaching Resources",
            "Connect with Industry Professionals",
          ].map((item, index) => (
            <li key={index} className="flex items-center space-x-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-[#00d4ff]"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-white">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
