import { useState, useEffect, useCallback } from 'react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

const slides = [
  {
    title: "When you can't speak, simple calls become barriers",
    description:
      "Everyday conversations assume everyone can speak.\nThis app removes that barrier.",
    image: "/src/assets/Onboarding1.png",
  },
  {
    title: "Conversations, made accessible",
    description:
      "Incoming speech is understood by AI, converted into simple tap options, and spoken aloud for you.",
    image: "/src/assets/Onboarding2.png",
  },
  {
    title: "Designed for delivery calls",
    description:
      "A real-world delivery scenario showing how spoken conversations can work without voice.",
    image: "/src/assets/onboarding3.png",
  },
];

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      onComplete();
    }
  }, [currentSlide, onComplete]);

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      }
    },
    [nextSlide]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [isOpen, handleKeyPress]);

  if (!isOpen) return null;

  const slide = slides[currentSlide];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onComplete}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-5xl mx-4 bg-[#E6E6E6] rounded-[13px] shadow-2xl h-[90svh] flex flex-col">
        {/* Skip */}
        <button
          onClick={onComplete}
          className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 text-[#9CA3AF] rounded-lg px-3 py-2"
        >
          Skip
        </button>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="flex flex-col md:flex-row h-full items-center md:items-start">
            {/* TEXT */}
            <div className="flex-1 px-6 pt-20 md:pl-10 md:pt-40">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {slide.title}
              </h2>
              <p className="text-lg text-gray-700 whitespace-pre-line mb-6">
                {slide.description}
              </p>

              {currentSlide === 2 && (
                <p className="text-sm text-gray-500">
                  The call UI is simulated, but voice interaction is live.
                </p>
              )}
            </div>

            {/* IMAGE – TOUCHES BOTTOM */}
            <div className="flex-1 flex items-end justify-center md:justify-end pr-6 md:pr-10 pb-0">
              <img
                src={slide.image}
                alt={slide.title}
                className="h-full w-auto sm:w-72 md:w-96 object-contain"
              />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="sticky bottom-0 bg-[#E6E6E6] px-6 py-4">
          {/* MOBILE */}
          <div className="flex flex-col items-center gap-3 md:hidden">
            <div className="flex gap-2">
              {slides.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 ${
                    i === currentSlide ? 'w-12 bg-[#6750A4]' : 'w-6 bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextSlide}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-[13px]"
            >
              {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'} →
            </button>
          </div>

          {/* DESKTOP – INDICATOR ABOVE BUTTON (LEFT) */}
          <div className="hidden md:flex flex-col items-start gap-3 pl-10">
            {/* Indicator ABOVE */}
            <div className="flex gap-2">
              {slides.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 ${
                    i === currentSlide ? 'w-14 bg-[#6750A4]' : 'w-8 bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* Button BELOW */}
            <button
              onClick={nextSlide}
              className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-[13px]"
            >
              <span>
                {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
              </span>
              <span className="text-xl">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
