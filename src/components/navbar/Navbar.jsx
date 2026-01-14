import { useState, useEffect } from "react";
import logoTitle from "@/src/config/logoTitle";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faFilm,
  faRandom,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "@/src/context/LanguageContext";
import { Link, useLocation } from "react-router-dom";
import Sidebar from "../sidebar/Sidebar";
import { SearchProvider } from "@/src/context/SearchContext";
import WebSearch from "../searchbar/WebSearch";
import MobileSearch from "../searchbar/MobileSearch";
import { FaTelegramPlane } from "react-icons/fa";

function Navbar() {
  const location = useLocation();
  const { language, toggleLanguage } = useLanguage();
  const [isNotHomePage, setIsNotHomePage] = useState(
    location.pathname !== "/" && location.pathname !== "/home"
  );
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleHamburgerClick = () => {
    setIsSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };
  const handleRandomClick = () => {
    if (location.pathname === "/random") {
      window.location.reload();
    }
  };
  useEffect(() => {
    setIsNotHomePage(
      location.pathname !== "/" && location.pathname !== "/home"
    );
  }, [location.pathname]);

  return (
    <SearchProvider>
      <nav
        className={`fixed top-0 left-0 w-full h-16 z-[1000000] flex p-4 py-8 items-center justify-between transition-all duration-300 ease-in-out ${
          isNotHomePage ? "bg-[#0a0a0a]" : "bg-opacity-0"
        } ${
          isScrolled ? "bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/5" : ""
        } max-[600px]:h-fit max-[600px]:flex-col max-[1200px]:bg-opacity-100 max-[600px]:py-2`}
      >
        <div className="flex gap-x-6 items-center w-fit max-lg:w-full max-lg:justify-between">
          <div className="flex gap-x-4 items-center w-fit">
            <FontAwesomeIcon
              icon={faBars}
              className="text-2xl text-white mt-1 cursor-pointer hover:text-[#39d353] transition-colors"
              onClick={handleHamburgerClick}
            />
            <Link
              to="/"
              className="flex items-center gap-x-2 cursor-pointer"
            >
              <img 
                src="/logo.png" 
                alt="emnexanimes" 
                className="w-10 h-10 max-[575px]:w-8 max-[575px]:h-8"
              />
              <span className="text-3xl font-bold tracking-tight max-[575px]:text-2xl">
                <span className="text-white">emnex</span>
                <span className="text-[#39d353]">animes</span>
              </span>
            </Link>
          </div>
          <WebSearch />
        </div>
        <div className="flex gap-x-7 items-center max-lg:hidden">
          {[
            { icon: faRandom, label: "Random", path: "/random" },
            { icon: faFilm, label: "Movie", path: "/movie" },
            { icon: faStar, label: "Popular", path: "/most-popular" },
          ].map((item) => (
            <Link
              key={item.path}
              to={
                item.path === "/random"
                  ? location.pathname === "/random"
                    ? "#"
                    : "/random"
                  : item.path
              }
              onClick={item.path === "/random" ? handleRandomClick : undefined}
              className="flex flex-col gap-y-1 items-center cursor-pointer group"
            >
              <FontAwesomeIcon
                icon={item.icon}
                className="text-[#39d353] text-xl font-bold group-hover:scale-110 transition-transform"
              />
              <p className="text-[15px] text-gray-300 group-hover:text-white transition-colors">{item.label}</p>
            </Link>
          ))}
          <div className="flex flex-col gap-y-1 items-center w-auto">
            <div className="flex">
              {["EN", "JP"].map((lang, index) => (
                <button
                  key={lang}
                  onClick={() => toggleLanguage(lang)}
                  className={`px-1 py-[1px] text-xs font-bold transition-colors ${
                    index === 0 ? "rounded-l-[3px]" : "rounded-r-[3px]"
                  } ${
                    language === lang
                      ? "bg-[#39d353] text-black"
                      : "bg-[#1a1a1a] text-white border border-white/10"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
            <div className="w-full">
              <p className="whitespace-nowrap text-[15px] text-gray-400">Anime name</p>
            </div>
          </div>
          <Link
            to="https://t.me/zenime_discussion"
            className="flex flex-col gap-y-1 items-center cursor-pointer group"
          >
            <FaTelegramPlane
              className="text-xl font-bold text-[#39d353] group-hover:scale-110 transition-transform"
            />
            <p className="text-[15px] mb-[1px] text-gray-300 group-hover:text-white transition-colors">Join Telegram</p>
          </Link>
        </div>
        <MobileSearch />
      </nav>
      <Sidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />
    </SearchProvider>
  );
}

export default Navbar;
