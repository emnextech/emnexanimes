import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClosedCaptioning,
  faMicrophone,
} from "@fortawesome/free-solid-svg-icons";
import { FaChevronRight } from "react-icons/fa";
import { useLanguage } from "@/src/context/LanguageContext";
import "./Cart.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import useToolTipPosition from "@/src/hooks/useToolTipPosition";
import Qtip from "../qtip/Qtip";

function Cart({ label, data, path }) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const { tooltipPosition, tooltipHorizontalPosition, cardRefs } =
    useToolTipPosition(hoveredItem, data);

  const handleImageEnter = (item, index) => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setHoveredItem(item.id + index);
  };

  const handleImageLeave = () => {
    setHoverTimeout(
      setTimeout(() => {
        setHoveredItem(null);
      }, 300) 
    );
  };

  return (
    <div className="flex flex-col w-1/4 space-y-7 max-[1200px]:w-full">
      <h1 className="font-bold text-2xl text-[#39d353] max-md:text-xl">
        {label}
      </h1>
      <div className="w-full space-y-4 flex flex-col">
        {data &&
          data.slice(0, 5).map((item, index) => (
            <div
              key={index}
              className="flex pb-4 items-center relative border-b border-white/5"
              ref={(el) => (cardRefs.current[index] = el)}
            >
              <img
                src={`${item.poster}`}
                alt={item.title}
                className="flex-shrink-0 w-[60px] h-[75px] rounded-md object-cover cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate(`/watch/${item.id}`)}
                onMouseEnter={() => handleImageEnter(item, index)}
                onMouseLeave={handleImageLeave}
              />

              {hoveredItem === item.id + index && window.innerWidth > 1024 && (
                <div
                  className={`absolute ${tooltipPosition} ${tooltipHorizontalPosition} 
                    ${
                      tooltipHorizontalPosition === "left-1/2"
                        ? "translate-x-[-100px]"
                        : "translate-x-[-200px]"
                    } 
                    z-[100000] transform transition-all duration-300 ease-in-out 
                    ${
                      hoveredItem === item.id + index
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-2"
                    }`}
                  onMouseEnter={() => {
                    if (hoverTimeout) clearTimeout(hoverTimeout); 
                  }}
                  onMouseLeave={handleImageLeave}
                >
                  <Qtip id={item.id} />
                </div>
              )}

              <div className="flex flex-col ml-4 space-y-2 w-full">
                <Link
                  to={`/${item.id}`}
                  className="w-full line-clamp-2 text-[1em] font-[500] text-white hover:cursor-pointer hover:text-[#39d353] transform transition-all ease-out max-[1200px]:text-[14px]"
                >
                  {language === "EN" ? item.title : item.japanese_title}
                </Link>
                <div className="flex items-center flex-wrap w-fit space-x-1">
                  {item.tvInfo?.sub && (
                    <div className="flex space-x-1 justify-center items-center bg-[#39d353]/20 border border-[#39d353]/30 rounded-[4px] px-[4px] text-[#39d353] py-[2px]">
                      <FontAwesomeIcon
                        icon={faClosedCaptioning}
                        className="text-[12px]"
                      />
                      <p className="text-[12px] font-bold">{item.tvInfo.sub}</p>
                    </div>
                  )}

                  {item.tvInfo?.dub && (
                    <div className="flex space-x-1 justify-center items-center bg-blue-500/20 border border-blue-500/30 rounded-[4px] px-[8px] text-blue-400 py-[2px]">
                      <FontAwesomeIcon
                        icon={faMicrophone}
                        className="text-[12px]"
                      />
                      <p className="text-[12px] font-bold">{item.tvInfo.dub}</p>
                    </div>
                  )}
                  <div className="flex items-center w-fit pl-1 gap-x-1">
                    <div className="dot"></div>
                    <p className="text-[14px] text-gray-400">
                      {item.tvInfo.showType}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        <Link
          to={`/${path}`}
          className="flex w-fit items-baseline rounded-lg gap-x-2 group"
        >
          <p className="text-gray-400 text-[17px] h-fit leading-4 group-hover:text-[#39d353] transform transition-all ease-out">
            View more
          </p>
          <FaChevronRight className="text-gray-400 text-[10px] group-hover:text-[#39d353] transform transition-all ease-out" />
        </Link>
      </div>
    </div>
  );
}

export default Cart;
