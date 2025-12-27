import { useState, useEffect, useCallback } from 'react';
import Onboarding1 from '../assets/Onboarding1.png';
import Onboarding2 from '../assets/Onboarding2.png';
import Onboarding3 from '../assets/Onboarding3.png';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

const slides = [
  {
    title: "When you can't speak, simple calls become barriers",
    description:
      "Everyday conversations assume everyone can speak.\nThis app removes that barrier.",
    image: Onboarding1,
  },
  {
    title: "Conversations, made accessible",
    description:
      "Incoming speech is understood by AI, converted into simple tap options, and spoken aloud for you.",
    image: Onboarding2,
  },
  {
    title: "Designed for delivery calls",
    description:
      "A real-world delivery scenario showing how spoken conversations can work without voice.",
    image: Onboarding3,
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
            <div className="flex-1 px-6 pt-20 md:pl-10 md:pt-40 md:pr-[440px]">
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

            {/* Illustration moved out of scroll area and anchored to modal base */}
            <div className="hidden md:block w-0" />
          </div>
        </div>

        {/* Absolute illustration (anchored to modal base, visible on md+) */}
        <div className="hidden md:block absolute right-6 bottom-0 pointer-events-none z-20">
          <img
            src={slide.image}
            alt={slide.title}
            className="w-auto md:w-[420px] h-auto md:h-[86%] object-contain object-bottom drop-shadow-md"
          />
        </div>

        {/* FOOTER */}
        <div className="bg-[#E6E6E6] px-6 py-4 flex-none relative z-10">
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
