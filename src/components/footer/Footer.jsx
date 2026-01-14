import logoTitle from "@/src/config/logoTitle.js";
import website_name from "@/src/config/website.js";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="flex flex-col w-full mt-[100px] px-4 max-[500px]:px-0 border-t border-white/5">
      <div
        className="w-full text-left py-6 max-[500px]:hidden"
      >
        <Link to="/" className="flex items-center gap-x-3">
          <img 
            src="/logo.png" 
            alt="emnexanimes" 
            className="w-12 h-12"
          />
          <span className="text-3xl font-bold tracking-tight">
            <span className="text-white">emnex</span>
            <span className="text-[#39d353]">animes</span>
          </span>
        </Link>
      </div>
      <div className="flex py-5 flex-col w-full space-y-4 max-md:items-center max-[500px]:bg-[#111111]">
        <div className="flex w-fit items-center space-x-6 max-[500px]:hidden">
          <p className="text-2xl font-bold max-md:text-lg text-white">A-Z LIST</p>
          <p
            style={{ borderLeft: "1px solid rgba(255, 255, 255, 0.15)" }}
            className="text-md font-medium pl-6 text-gray-400"
          >
            Searching anime order by alphabet name A to Z
          </p>
        </div>
        <div className="flex gap-x-[7px] flex-wrap justify-start gap-y-2 max-md:justify-start max-[500px]:hidden">
          {[
            "All",
            "#",
            "0-9",
            ...Array.from({ length: 26 }, (_, i) =>
              String.fromCharCode(65 + i)
            ),
          ].map((item, index) => (
            <Link
              to={`az-list/${item === "All" ? "" : item}`}
              key={index}
              className="text-lg bg-[#1a1a1a] px-2 rounded-md font-bold text-gray-300 hover:text-black hover:bg-[#39d353] hover:cursor-pointer transition-all ease-out border border-white/5"
            >
              {item}
            </Link>
          ))}
        </div>
        <div className="flex flex-col w-full text-left space-y-2 pt-4 max-md:items-center max-[470px]:px-[5px]">
          <p className="text-gray-500 text-[16px] max-md:text-center max-md:text-[12px]">
            {website_name} does not host any files, it merely pulls streams from
            3rd party services. Legal issues should be taken up with the file
            hosts and providers. {website_name} is not responsible for any media
            files shown by the video providers.
          </p>
          <p className="text-gray-500 max-md:text-[14px]">
            © {website_name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
