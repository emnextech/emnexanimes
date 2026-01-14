import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Suggestion from "../suggestion/Suggestion";
import useSearch from "@/src/hooks/useSearch";
import { useNavigate } from "react-router-dom";

function WebSearch() {
    const navigate = useNavigate();
    const {
        setIsSearchVisible,
        searchValue,
        setSearchValue,
        isFocused,
        setIsFocused,
        debouncedValue,
        suggestionRefs,
        addSuggestionRef,
    } = useSearch();

    const handleSearchClick = () => {
        if (window.innerWidth <= 600) {
            setIsSearchVisible((prev) => !prev);
        }
        if (searchValue.trim() && window.innerWidth > 600) {
            navigate(`/search?keyword=${encodeURIComponent(searchValue)}`);
        }
    };

    return (
        <div className="flex items-center relative w-[380px] max-[600px]:w-fit">
            <input
                type="text"
                className="bg-[#1a1a1a] border border-white/10 px-4 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#39d353]/50 w-full rounded-l-lg max-[600px]:hidden transition-colors"
                placeholder="Search anime..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                    setTimeout(() => {
                        const isInsideSuggestionBox = suggestionRefs.current.some(
                            (ref) => ref && ref.contains(document.activeElement),
                        );
                        if (!isInsideSuggestionBox) {
                            setIsFocused(false);
                        }
                    }, 100);
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        if (searchValue.trim()) {
                            navigate(`/search?keyword=${encodeURIComponent(searchValue)}`);
                        }
                    }
                }}
            />
            <button
                className="bg-[#1a1a1a] border border-l-0 border-white/10 p-2 px-4 rounded-r-lg max-[600px]:bg-transparent max-[600px]:border-0 focus:outline-none max-[600px]:p-0 hover:bg-[#222] transition-colors"
                onClick={handleSearchClick}
            >
                <FontAwesomeIcon
                    icon={faMagnifyingGlass}
                    className="text-lg text-gray-400 hover:text-[#39d353] max-[600px]:text-white max-[600px]:text-2xl max-[575px]:text-xl max-[600px]:mt-[7px] transition-colors"
                />
            </button>
            {searchValue.trim() && isFocused && (
                <div
                    ref={addSuggestionRef}
                    className="absolute z-[100000] top-full w-full"
                >
                    <Suggestion keyword={debouncedValue} className="w-full" />
                </div>
            )}
        </div>
    );
}

export default WebSearch;
