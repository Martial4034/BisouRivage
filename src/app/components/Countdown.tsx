import { useEffect, useState } from 'react';

interface CountdownProps {
  onExpire: () => void;
}

const Countdown = ({ onExpire }: CountdownProps) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const targetDate = new Date('2024-12-30T12:00:00');

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance < 0) {
        setIsExpired(true);
        onExpire();
        return null;
      }

      return {
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      };
    };

    // Vérifier immédiatement si la date est déjà passée
    const initialTimeLeft = calculateTimeLeft();
    if (initialTimeLeft === null) {
      setIsExpired(true);
      onExpire();
      return;
    }
    setTimeLeft(initialTimeLeft);

    const timer = setInterval(() => {
      const remainingTime = calculateTimeLeft();
      if (remainingTime === null) {
        clearInterval(timer);
      } else {
        setTimeLeft(remainingTime);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [onExpire]);

  if (isExpired) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-4xl md:text-6xl font-light text-center px-4">
        <h2 className="mt-6 text-xl md:text-2xl mb-8 md:mb-12 font-semibold">La saison 1 arrive bientôt.</h2>
        <div className="flex gap-2 md:gap-6">
          <div>
            <span className="font-medium">{String(timeLeft.days).padStart(2, '0')}</span>
            <span className="text-gray-500">j</span>
          </div>
          <div className="text-gray-500">:</div>
          <div>
            <span className="font-medium">{String(timeLeft.hours).padStart(2, '0')}</span>
            <span className="text-gray-500">h</span>
          </div>
          <div className="text-gray-500">:</div>
          <div>
            <span className="font-medium">{String(timeLeft.minutes).padStart(2, '0')}</span>
            <span className="text-gray-500">m</span>
          </div>
          <div className="text-gray-500">:</div>
          <div>
            <span className="font-medium">{String(timeLeft.seconds).padStart(2, '0')}</span>
            <span className="text-gray-500">s</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Countdown; 