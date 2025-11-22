import { useState, useEffect } from "react";
import { Search, Plus, X, Users } from "lucide-react";
import { useAuthStore } from "../store/auth";
import { apiService } from "../lib/api";

export default function UserSearchModal({
  isOpen,
  onClose,
  onUserAdd,
  existingUsers = [],
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();

  // Mock users for demo - replace with real API call
  const mockUsers = [
    {
      id: "1",
      email: "sharmaujjwal2024@gmail.com",
      name: "Ujjwal Sharma",
      avatar: null,
      isOnline: true,
    },
    {
      id: "2",
      email: "anjalpatidar00@gmail.com",
      name: "Anjal Patidar",
      avatar: null,
      isOnline: true,
    },
  ];

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    console.log("🔍 Searching for:", query);
    setIsLoading(true);
    try {
      // Try real API first, fallback to mock data
      let results = [];
      try {
        results = await apiService.searchUsers(query);
        console.log("✅ API results:", results);
      } catch (error) {
        console.log("❌ API error, using mock data:", error);
        // Fallback to mock data for demo
        results = mockUsers.filter(
          (mockUser) =>
            mockUser.email.toLowerCase().includes(query.toLowerCase()) ||
            mockUser.name?.toLowerCase().includes(query.toLowerCase())
        );
        console.log("📝 Mock results:", results);
      }

      console.log("👤 Current user:", user?.email);
      console.log("🚫 Existing users:", existingUsers);

      // Filter out current user and existing users
      const filteredResults = results.filter(
        (result) =>
          result.email !== user?.email &&
          !existingUsers.some((existing) => existing.email === result.email)
      );

      console.log("✨ Final filtered results:", filteredResults);
      setSearchResults(filteredResults);
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleAddUser = (selectedUser) => {
    onUserAdd(selectedUser);
    setSearchQuery("");
    setSearchResults([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-zinc-700">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">
              Add People
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-zinc-400" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-700/50 border border-slate-200 dark:border-zinc-600 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
              autoFocus
            />
          </div>

          {/* Search Results */}
          <div className="mt-4 max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-slate-500 dark:text-zinc-400 mt-2 text-sm">
                  Searching...
                </p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-700/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-medium">
                          {result.name
                            ? result.name[0].toUpperCase()
                            : result.email[0].toUpperCase()}
                        </div>
                        {result.isOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-zinc-800 rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-zinc-100">
                          {result.name || result.email.split("@")[0]}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-zinc-400">
                          {result.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddUser(result)}
                      className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all transform hover:scale-105"
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            ) : searchQuery.length > 0 ? (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-slate-300 dark:text-zinc-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-zinc-400">
                  No users found
                </p>
                <p className="text-sm text-slate-400 dark:text-zinc-500">
                  Try searching by email address
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-slate-300 dark:text-zinc-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-zinc-400">
                  Search for people to add
                </p>
                <p className="text-sm text-slate-400 dark:text-zinc-500">
                  Start typing an email address
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
