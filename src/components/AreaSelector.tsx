/**
 * AreaSelector Component
 *
 * CUSTOMER FLOW - First screen on homepage
 * Shows "Select Your Area" before customer can proceed to menu
 *
 * Features:
 * - Simple dropdown with searchable areas
 * - Area cards with landmarks
 * - No GPS, no maps, pure locality selection
 * - Mobile-friendly
 */

"use client";

import { useEffect, useState } from "react";
import { useAreaStore } from "@/store/useAreaStore";
import { toast } from "@/components/ui/Toast";

interface Area {
  _id: string;
  name: string;
  description?: string;
  landmarks?: string[];
}

export function AreaSelector() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredAreas, setFilteredAreas] = useState<Area[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const { selectedArea, setSelectedArea } = useAreaStore();

  useEffect(() => {
    fetchAreas();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAreas(areas);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = areas.filter(
        (area) =>
          area.name.toLowerCase().includes(query) ||
          area.landmarks?.some((lm) => lm.toLowerCase().includes(query))
      );
      setFilteredAreas(filtered);
    }
  }, [searchQuery, areas]);

  async function fetchAreas() {
    try {
      setLoading(true);
      const response = await fetch("/api/areas");
      const data = await response.json();
      if (data.success) {
        setAreas(data.data);
        setFilteredAreas(data.data);
      } else {
        toast.error("Failed to load areas");
      }
    } catch (error) {
      console.error("Error fetching areas:", error);
      toast.error("Failed to load areas");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectArea(area: Area) {
    setSelectedArea(area);
    setShowDropdown(false);
    setSearchQuery("");
    toast.success(`Selected ${area.name}`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-pulse text-white/40">Loading areas...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-4">
        <label className="block text-sm font-medium text-white/60 mb-2">
          Select Your Area
        </label>

        {selectedArea ? (
          <div className="mb-3 p-3 bg-emerald-400/10 border border-emerald-400/20 rounded-xl">
            <p className="text-emerald-400 font-semibold">{selectedArea.name}</p>
            {selectedArea.description && (
              <p className="text-emerald-400/70 text-sm mt-1">
                {selectedArea.description}
              </p>
            )}
            <button
              onClick={() => {
                setSelectedArea(null);
                setShowDropdown(true);
              }}
              className="text-emerald-400 text-sm underline mt-2"
            >
              Change Area
            </button>
          </div>
        ) : null}

        {!selectedArea && (
          <div className="relative">
            <input
              type="text"
              placeholder="Search your area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              className="w-full px-4 py-3 bg-background border border-white/10 text-white placeholder:text-white/25 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
            />

            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto"
                style={{ background: "linear-gradient(145deg, rgba(13,24,41,0.98), rgba(10,18,35,0.99))", border: "1px solid rgba(255,255,255,0.08)" }}>
                {filteredAreas.length > 0 ? (
                  <ul className="divide-y divide-white/5">
                    {filteredAreas.map((area) => (
                      <li key={area._id}>
                        <button
                          onClick={() => handleSelectArea(area)}
                          className="w-full text-left px-4 py-3 hover:bg-primary/10 transition-colors"
                        >
                          <p className="font-semibold text-white">
                            {area.name}
                          </p>
                          {area.landmarks && area.landmarks.length > 0 && (
                            <p className="text-sm text-white/40">
                              {area.landmarks.slice(0, 2).join(", ")}
                            </p>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-white/40">
                    No areas found
                  </div>
                )}
              </div>
            )}

            {showDropdown && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowDropdown(false)}
              />
            )}
          </div>
        )}
      </div>

      {/* Popular areas quick select */}
      {!selectedArea && (
        <div className="mt-6">
          <p className="text-sm text-white/40 mb-3">Popular Areas</p>
          <div className="grid grid-cols-2 gap-2">
            {areas.slice(0, 6).map((area) => (
              <button
                key={area._id}
                onClick={() => handleSelectArea(area)}
                className="p-3 border border-white/10 rounded-xl hover:bg-primary/10 hover:border-primary/30 transition-colors text-sm font-medium text-white/70 hover:text-white truncate"
              >
                {area.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
