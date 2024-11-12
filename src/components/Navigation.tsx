import { Search, Compass, BookOpen } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { searchArticles } from "../services/wikipediaService";
import { searchArxivPapers } from "../services/arxivService";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

const Navigation = () => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchType, setSearchType] = useState<"wiki" | "arxiv">("wiki");
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const query = searchParams.get("q");
    if (query && location.pathname !== "/discover") {
      const decodedQuery = decodeURIComponent(query);
      setSearchValue(decodedQuery);
    }
  }, [searchParams, location.pathname]);

  const { data: wikiResults, isLoading: wikiLoading } = useQuery({
    queryKey: ["wiki-search", searchValue],
    queryFn: () => searchArticles(searchValue),
    enabled: searchValue.length > 0 && searchType === "wiki",
    gcTime: 1000 * 60 * 5,
    staleTime: 0,
  });

  const { data: arxivResults, isLoading: arxivLoading } = useQuery({
    queryKey: ["arxiv-search", searchValue],
    queryFn: () => searchArxivPapers(searchValue),
    enabled: searchValue.length > 0 && searchType === "arxiv",
    gcTime: 1000 * 60 * 5,
    staleTime: 0,
  });

  const handleArticleSelect = (title: string, selectedArticle: any) => {
    setOpen(false);
    setSearchValue(title);
    toast({
      title: "Loading articles",
      description: `Loading articles about ${title}...`,
      duration: 2000,
    });
    
    const currentResults = searchType === "wiki" ? wikiResults : arxivResults;
    const reorderedResults = [
      selectedArticle,
      ...(currentResults || []).filter(article => article.id !== selectedArticle.id)
    ];
    
    navigate(`/?q=${encodeURIComponent(title)}`, {
      state: { reorderedResults, mode: searchType }
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearchValue("");
    }
  };

  const handleRandomArticle = async () => {
    setSearchValue("");
    toast({
      title: "Loading random article",
      description: "Finding something interesting for you...",
      duration: 2000,
    });
  };

  const handleDiscoverClick = () => {
    setSearchValue("");
    if (location.pathname === "/discover") {
      navigate("/");
    } else {
      navigate("/discover");
    }
  };

  const handleModeToggle = () => {
    const newMode = searchType === "wiki" ? "arxiv" : "wiki";
    setSearchType(newMode);
    navigate("/", { state: { mode: newMode, forceReload: true } });
  };

  const isDiscoverPage = location.pathname === "/discover";
  const isLoading = searchType === "wiki" ? wikiLoading : arxivLoading;
  const searchResults = searchType === "wiki" ? wikiResults : arxivResults;

  return (
    <>
      <div className={`fixed top-0 left-0 right-0 h-14 z-50 flex items-center justify-between px-4 ${
        isDiscoverPage 
          ? "bg-black" 
          : "bg-black"
      }`}>
        <div 
          className="text-xl font-bold text-wikitok-red cursor-pointer"
          onClick={handleRandomArticle}
        >
          WikTok
        </div>
        <div 
          className="flex items-center bg-black/20 backdrop-blur-sm rounded-full px-4 py-2 cursor-pointer"
          onClick={() => setOpen(true)}
        >
          <Search className="w-4 h-4 text-white/60 mr-2" />
          <span className="text-white/60 text-sm">
            {searchValue || "Search articles"}
          </span>
        </div>
        <div className="flex space-x-6">
          <BookOpen 
            className={`w-5 h-5 cursor-pointer transition-colors ${
              searchType === "arxiv" ? "text-wikitok-red" : "text-white"
            }`}
            onClick={handleModeToggle}
          />
          <Compass 
            className={`w-5 h-5 cursor-pointer transition-colors ${
              location.pathname === "/discover" ? "text-wikitok-red" : "text-white"
            }`}
            onClick={handleDiscoverClick}
          />
        </div>
      </div>

      <CommandDialog 
        open={open} 
        onOpenChange={handleOpenChange}
      >
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={`Search ${searchType === "wiki" ? "Wikipedia" : "arXiv ML Papers"}...`}
            value={searchValue}
            onValueChange={setSearchValue}
            className="border-none focus:ring-0"
          />
          <CommandList className="max-h-[80vh] overflow-y-auto">
            {isLoading && (
              <CommandEmpty>Searching...</CommandEmpty>
            )}
            {!isLoading && !searchResults && searchValue.length > 0 && (
              <CommandEmpty>No results found.</CommandEmpty>
            )}
            {!isLoading && !searchValue && (
              <CommandEmpty>Start typing to search articles</CommandEmpty>
            )}
            {!isLoading && searchResults && searchResults.length === 0 && (
              <CommandEmpty>No results found.</CommandEmpty>
            )}
            {!isLoading && searchResults && searchResults.length > 0 && (
              <CommandGroup heading={searchType === "wiki" ? "Wikipedia Articles" : "arXiv Papers"}>
                {searchResults.map((result) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleArticleSelect(result.title, result)}
                    className="flex items-center p-2 cursor-pointer hover:bg-accent rounded-lg"
                  >
                    <div className="flex items-center w-full gap-3">
                      {result.image && (
                        <img 
                          src={result.image} 
                          alt={result.title}
                          className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-base">{result.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {result.content}
                        </div>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
};

export default Navigation;