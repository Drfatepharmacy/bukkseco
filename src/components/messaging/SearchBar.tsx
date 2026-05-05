import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";

interface SearchResult {
  id: string;
  full_name: string;
  avatar_url: string | null;
  username: string | null;
  email: string;
  vendor_profiles: { business_name: string }[];
  user_roles: { role: string }[];
}

interface SearchBarProps {
  onUserSelect: (userId: string) => void;
}

export const SearchBar = ({ onUserSelect }: SearchBarProps) => {
  const { user: currentUser } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          avatar_url,
          username,
          email,
          vendor_profiles!left (business_name),
          user_roles!left (role)
        `)
        .neq("id", currentUser?.id)
        .limit(5);

      if (!error && data) {
        setResults(data);
      }
    };

    const delayDebounceFn = setTimeout(async () => {
      if (query.length >= 2) {
        const { data, error } = await supabase
          .from("profiles")
          .select(`
            id,
            full_name,
            avatar_url,
            username,
            email,
            vendor_profiles!left (business_name),
            user_roles!left (role)
          `)
          .neq("id", currentUser?.id)
          .or(`username.ilike.%${query}%,full_name.ilike.%${query}%,email.ilike.%${query}%,vendor_profiles.business_name.ilike.%${query}%`)
          .limit(10);

        if (!error && data) {
          setResults(data);
        }
      } else if (query.length === 0 && isFocused) {
        fetchSuggestions();
      } else {
        setResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query, currentUser?.id, isFocused]);

  return (
    <div className="space-y-2 p-2">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email or business..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          className="pl-8"
        />
      </div>
      {results.length > 0 && (isFocused || query.length >= 2) && (
        <ScrollArea className="h-64 border rounded-md bg-card shadow-lg">
          <div className="p-2 text-xs font-semibold text-muted-foreground border-b">
            {query.length >= 2 ? "Search Results" : "Suggested Contacts"}
          </div>
          {results.map((user) => {
            const businessName = user.vendor_profiles?.[0]?.business_name;
            const role = user.user_roles?.[0]?.role;
            const subtitle = businessName || (role ? role.charAt(0).toUpperCase() + role.slice(1) : "");

            return (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer transition-colors border-b last:border-0"
                onClick={() => {
                  onUserSelect(user.id);
                  setQuery("");
                  setResults([]);
                }}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback>
                    {user.username?.slice(0, 2).toUpperCase() || user.full_name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold truncate">
                    {user.full_name || user.username}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </span>
                  {subtitle && (
                    <span className="text-xs font-medium text-primary truncate">
                      {subtitle}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </ScrollArea>
      )}
    </div>
  );
};
