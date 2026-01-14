import {
  faClosedCaptioning,
  faFile,
  faMicrophone,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import BouncingLoader from "../ui/bouncingloader/Bouncingloader";
import "./Servers.css";
import { useEffect } from "react";

function Servers({
  servers,
  activeEpisodeNum,
  activeServerId,
  setActiveServerId,
  serverLoading,
}) {
  // Filter to only show HD-2 servers (others are blocked by streaming providers)
  // To re-enable all servers, remove the .filter() call below
  const filteredServers = servers?.filter((server) => server.serverName === "HD-2") || [];
  
  const subServers = filteredServers?.filter((server) => server.type === "sub") || [];
  const dubServers = filteredServers?.filter((server) => server.type === "dub") || [];
  const rawServers = filteredServers?.filter((server) => server.type === "raw") || [];
  
  // Original code with all servers (commented out):
  // const subServers = servers?.filter((server) => server.type === "sub") || [];
  // const dubServers = servers?.filter((server) => server.type === "dub") || [];
  // const rawServers = servers?.filter((server) => server.type === "raw") || [];

  useEffect(() => {
    // Default to HD-2 since other servers are blocked
    const preferredServerName = "HD-2";
    const savedServerName = localStorage.getItem("server_name");

    // First try to find HD-2 server
    const hd2Server = filteredServers?.find(
      (server) => server.serverName === preferredServerName
    );
    
    if (hd2Server) {
      setActiveServerId(hd2Server.data_id);
      localStorage.setItem("server_name", preferredServerName);
    } else if (savedServerName) {
      const matchingServer = filteredServers?.find(
        (server) => server.serverName === savedServerName
      );

      if (matchingServer) {
        setActiveServerId(matchingServer.data_id);
      } else if (filteredServers && filteredServers.length > 0) {
        setActiveServerId(filteredServers[0].data_id);
      }
    } else if (filteredServers && filteredServers.length > 0) {
      setActiveServerId(filteredServers[0].data_id);
    }
  }, [servers]);

  const handleServerSelect = (server) => {
    setActiveServerId(server.data_id);
    localStorage.setItem("server_name", server.serverName);
    localStorage.setItem("server_type", server.type);
  };
  return (
    <div className="relative bg-[#0a0a0a] p-4 w-full min-h-[100px] flex justify-center items-center max-[1200px]:bg-[#111111]">
      {serverLoading ? (
        <div className="w-full h-full rounded-lg flex justify-center items-center max-[600px]:rounded-none">
          <BouncingLoader />
        </div>
      ) : servers ? (
        <div className="w-full h-full rounded-lg grid grid-cols-[minmax(0,30%),minmax(0,70%)] overflow-hidden max-[800px]:grid-cols-[minmax(0,40%),minmax(0,60%)] max-[600px]:flex max-[600px]:flex-col max-[600px]:rounded-none border border-white/10">
          <div className="h-full bg-[#39d353] px-6 text-black flex flex-col justify-center items-center gap-y-2 max-[600px]:bg-transparent max-[600px]:h-1/2 max-[600px]:text-white max-[600px]:mb-4">
            <p className="text-center leading-5 font-medium text-[14px]">
              You are watching <br />
              <span className="font-semibold max-[600px]:text-[#39d353]">
                Episode {activeEpisodeNum}
              </span>
            </p>
            <p className="leading-5 text-[14px] font-medium text-center">
              If the current server doesn&apos;t work, please try other servers
              beside.
            </p>
          </div>
          <div className="bg-[#111111] flex flex-col max-[600px]:h-full">
            {rawServers.length > 0 && (
              <div
                className={`servers px-2 flex items-center flex-wrap ml-2 max-[600px]:py-2 ${
                  dubServers.length === 0 || subServers.length === 0
                    ? "h-1/2"
                    : "h-full"
                }`}
              >
                <div className="flex items-center gap-x-2">
                  <FontAwesomeIcon
                    icon={faFile}
                    className="text-[#39d353] text-[13px]"
                  />
                  <p className="font-bold text-[14px]">RAW:</p>
                </div>
                <div className="flex gap-x-[7px] ml-8 flex-wrap">
                  {rawServers.map((item, index) => (
                    <div
                      key={index}
                      className={`px-6 py-[5px] rounded-lg cursor-pointer transition-colors ${
                        activeServerId === item?.data_id
                          ? "bg-[#39d353] text-black"
                          : "bg-[#1a1a1a] text-white hover:bg-[#222222]"
                      } max-[700px]:px-3`}
                      onClick={() => handleServerSelect(item)}
                    >
                      <p className="text-[13px] font-semibold">
                        {item.serverName}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {subServers.length > 0 && (
              <div
                className={`servers px-2 flex items-center flex-wrap ml-2 max-[600px]:py-2 ${
                  dubServers.length === 0 ? "h-1/2" : "h-full"
                }`}
              >
                <div className="flex items-center gap-x-2">
                  <FontAwesomeIcon
                    icon={faClosedCaptioning}
                    className="text-[#39d353] text-[13px]"
                  />
                  <p className="font-bold text-[14px]">SUB:</p>
                </div>
                <div className="flex gap-x-[7px] ml-8 flex-wrap">
                  {subServers.map((item, index) => (
                    <div
                      key={index}
                      className={`px-6 py-[5px] rounded-lg cursor-pointer transition-colors ${
                        activeServerId === item?.data_id
                          ? "bg-[#39d353] text-black"
                          : "bg-[#1a1a1a] text-white hover:bg-[#222222]"
                      } max-[700px]:px-3`}
                      onClick={() => handleServerSelect(item)}
                    >
                      <p className="text-[13px] font-semibold">
                        {item.serverName}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {dubServers.length > 0 && (
              <div
                className={`servers px-2 flex items-center flex-wrap ml-2 max-[600px]:py-2 ${
                  subServers.length === 0 ? "h-1/2 " : "h-full"
                }`}
              >
                <div className="flex items-center gap-x-3">
                  <FontAwesomeIcon
                    icon={faMicrophone}
                    className="text-[#39d353] text-[13px]"
                  />
                  <p className="font-bold text-[14px]">DUB:</p>
                </div>
                <div className="flex gap-x-[7px] ml-8 flex-wrap">
                  {dubServers.map((item, index) => (
                    <div
                      key={index}
                      className={`px-6 py-[5px] rounded-lg cursor-pointer transition-colors ${
                        activeServerId === item?.data_id
                          ? "bg-[#39d353] text-black"
                          : "bg-[#1a1a1a] text-white hover:bg-[#222222]"
                      } max-[700px]:px-3`}
                      onClick={() => handleServerSelect(item)}
                    >
                      <p className="text-[13px] font-semibold">
                        {item.serverName}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-center font-medium text-[15px] text-gray-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
          Could not load servers <br />
          Either reload or try again after sometime
        </p>
      )}
    </div>
  );
}

export default Servers;
