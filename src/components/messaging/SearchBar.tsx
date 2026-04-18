import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";

interface SearchBarProps {
  onUserSelect: (userId: string) => void;
}

export const SearchBar = ({ onUserSelect }: SearchBarProps) => {
  const { user: currentUser } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length >= 2) {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, username")
          .neq("id", currentUser?.id)
          .ilike("username", `%${query}%`)
          .limit(10);

        if (!error && data) {
          setResults(data);
        }
      } else {
        setResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query, currentUser?.id]);

  return (
    <div className="space-y-2 p-2">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by username..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8"
        />
      </div>
      {results.length > 0 && (
        <ScrollArea className="h-48 border rounded-md">
          {results.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-2 p-2 hover:bg-muted cursor-pointer transition-colors"
              onClick={() => {
                onUserSelect(user.id);
                setQuery("");
                setResults([]);
              }}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback>{user.username?.slice(0, 2).toUpperCase() || user.full_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user.username || user.full_name}</span>
              </div>
            </div>
          ))}
        </ScrollArea>
      )}
    </div>
  );
};
