import React, { useState } from "react";
import { Link } from "react-router-dom";

function Genre({ data }) {
  const [showAll, setShowAll] = useState(false);
  const toggleGenres = () => {
    setShowAll((prev) => !prev);
  };

  return (
    <div className="flex flex-col w-full">
      <h1 className="font-bold text-2xl text-[#39d353]">Genres</h1>
      <div className="bg-[#111111] border border-white/5 rounded-lg py-6 px-4 mt-6 max-[478px]:bg-transparent max-[478px]:px-0 max-[478px]:border-0">
        <div className="grid grid-cols-3 grid-rows-2 gap-x-4 gap-y-3 w-full max-[478px]:flex max-[478px]:flex-wrap max-[478px]:gap-2">
          {data &&
            (showAll ? data : data.slice(0, 24)).map((item, index) => {
              return (
                <Link
                  to={`/genre/${item}`}
                  key={index}
                  className="rounded-[4px] py-2 px-3 text-gray-300 hover:bg-[#39d353]/10 hover:text-[#39d353] hover:cursor-pointer transition-colors max-[478px]:bg-[#1a1a1a] max-[478px]:py-[6px] max-[478px]:border max-[478px]:border-white/5"
                >
                  <div className="overflow-hidden text-left text-ellipsis text-nowrap font-medium">
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </div>
                </Link>
              );
            })}
        </div>
        <button
          className="w-full bg-[#1a1a1a] border border-white/5 py-3 mt-4 hover:bg-[#39d353] hover:text-black hover:border-[#39d353] rounded-md font-bold transform transition-all ease-out"
          onClick={toggleGenres}
        >
          {showAll ? "Show less" : "Show more"}
        </button>
      </div>
    </div>
  );
}

export default React.memo(Genre);
