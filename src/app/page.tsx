"use client";

import { useState, useCallback } from "react";
import Breadcrumbs from "@/app/components/home/Breadcrumbs";
import ImageGrid from "@/app/components/home/ImageGrid";
import Countdown from "@/app/components/Countdown";

export default function Home() {
  const [formatFilter, setFormatFilter] = useState("all");
  const [isCountdownExpired, setIsCountdownExpired] = useState(false);

  const handleCountdownExpire = useCallback(() => {
    setIsCountdownExpired(true);
  }, []);

  return (
    <div className="h-full bg-white px-4 sm:px-8">
      {!isCountdownExpired ? (
        <Countdown onExpire={handleCountdownExpire} />
      ) : (
        <>
          <Breadcrumbs formatFilter={formatFilter} setFormatFilter={setFormatFilter} />
          <div className="max-w-screen-xl mx-auto">
            <ImageGrid formatFilter={formatFilter} />
          </div>
        </>
      )}
    </div>
  );
}
