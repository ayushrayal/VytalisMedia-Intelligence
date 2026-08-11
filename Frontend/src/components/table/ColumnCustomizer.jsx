import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { SlidersHorizontal, GripVertical, Lock, Search, X, RotateCcw } from "lucide-react";

/**
 * Reusable ColumnCustomizer Component.
 * Optimized Viewport Safety & Layout:
 * - Reduced panel height: height: min(520px, calc(100vh - 120px))
 * - Strict top coordinate boundary clamping to guarantee panel stays inside viewport bounds
 * - Compact header (12px padding), search toolbar (36px input, 32px reset), 34px item rows
 * - Fixed 56px footer pinned permanently at bottom with unclipped [ Cancel ] and [ Apply Changes ]
 * - React Portal rendering at document.body level
 */
export const ColumnCustomizer = ({
  allColumns = [],
  orderedKeys = [],
  visibleKeys = [],
  onApply,
  onReset,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Temporary draft state inside panel
  const [draftOrderedKeys, setDraftOrderedKeys] = useState(orderedKeys);
  const [draftVisibleKeys, setDraftVisibleKeys] = useState(visibleKeys);

  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const dragItemRef = useRef(null);

  const [coords, setCoords] = useState({ top: 0, left: 0, width: 400, isMobile: false });

  // Calculate panel position relative to button & viewport boundaries
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const isMobile = viewportWidth < 768;
    if (isMobile) {
      setCoords({ isMobile: true });
      return;
    }

    const PANEL_WIDTH = 400;
    const PANEL_MAX_HEIGHT = Math.min(520, viewportHeight - 120);
    const GAP = 8;
    const VIEWPORT_PADDING = 16;

    // Prefer aligning right edge of panel with right edge of button
    let left = rect.right - PANEL_WIDTH;
    if (left < VIEWPORT_PADDING) {
      left = rect.left;
    }

    // Clamp left strictly within visible viewport bounds
    const maxLeft = viewportWidth - PANEL_WIDTH - VIEWPORT_PADDING;
    const minLeft = VIEWPORT_PADDING;
    left = Math.max(minLeft, Math.min(left, maxLeft));

    // Calculate top position
    let top = rect.bottom + GAP;
    const maxTop = viewportHeight - PANEL_MAX_HEIGHT - VIEWPORT_PADDING;

    if (top > maxTop) {
      if (rect.top - PANEL_MAX_HEIGHT - GAP >= VIEWPORT_PADDING) {
        top = rect.top - PANEL_MAX_HEIGHT - GAP;
      } else {
        top = Math.max(VIEWPORT_PADDING, maxTop);
      }
    }

    setCoords({
      top: Math.max(VIEWPORT_PADDING, top),
      left,
      width: PANEL_WIDTH,
      isMobile: false,
    });
  }, []);

  // Sync draft state whenever popover opens or props change
  useEffect(() => {
    if (isOpen) {
      setDraftOrderedKeys(orderedKeys);
      setDraftVisibleKeys(visibleKeys);
      setSearchTerm("");
    }
  }, [isOpen, orderedKeys, visibleKeys]);

  // Positioning and Event Listeners
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e) => {
      if (buttonRef.current && buttonRef.current.contains(e.target)) return;
      if (panelRef.current && panelRef.current.contains(e.target)) return;
      setIsOpen(false);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, updatePosition]);

  const columnMap = useMemo(() => {
    const map = new Map();
    allColumns.forEach((col) => map.set(col.id, col));
    return map;
  }, [allColumns]);

  // Draft ordered column descriptors
  const draftColumns = useMemo(() => {
    return draftOrderedKeys
      .filter((id) => columnMap.has(id))
      .map((id) => columnMap.get(id));
  }, [draftOrderedKeys, columnMap]);

  // Filtered draft columns based on search term
  const filteredColumns = useMemo(() => {
    if (!searchTerm.trim()) return draftColumns;
    const term = searchTerm.toLowerCase().trim();
    return draftColumns.filter(
      (col) =>
        col.label.toLowerCase().includes(term) ||
        col.category.toLowerCase().includes(term)
    );
  }, [draftColumns, searchTerm]);

  // Group columns by Category while preserving custom order
  const groupedCategories = useMemo(() => {
    const categories = ["IDENTITY", "PERFORMANCE", "FUNNEL", "DELIVERY"];
    const result = [];

    categories.forEach((cat) => {
      const items = filteredColumns.filter((col) => col.category === cat);
      if (items.length > 0) {
        result.push({ category: cat, items });
      }
    });

    return result;
  }, [filteredColumns]);

  // Toggle visibility of a column
  const handleToggleColumn = (id) => {
    const col = columnMap.get(id);
    if (col && col.required) return;

    setDraftVisibleKeys((prev) => {
      if (prev.includes(id)) {
        return prev.filter((k) => k !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Reorder handling via HTML5 Drag and Drop
  const handleDragStart = (e, index) => {
    dragItemRef.current = index;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = dragItemRef.current;
    if (dragIndex === null || dragIndex === dropIndex) return;

    const newOrdered = [...draftOrderedKeys];
    const [draggedKey] = newOrdered.splice(dragIndex, 1);
    newOrdered.splice(dropIndex, 0, draggedKey);

    setDraftOrderedKeys(newOrdered);
    dragItemRef.current = null;
  };

  // Apply Changes
  const handleApply = () => {
    onApply(draftOrderedKeys, draftVisibleKeys);
    setIsOpen(false);
  };

  // Reset to Predefined Defaults
  const handleReset = () => {
    if (onReset) onReset();
    setIsOpen(false);
  };

  // Render Inner Customizer Panel Content
  const renderPanelContent = () => (
    <>
      <style>{`
        .customizer-list::-webkit-scrollbar {
          width: 6px;
        }
        .customizer-list::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 999px;
        }
        .customizer-list::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>

      {/* 1. Header (Fixed) */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #F1F5F9",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "650", color: "#0F172A" }}>
            Customize Columns
          </h3>
          <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748B", fontWeight: "400" }}>
            Choose and arrange the fields shown in your table.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          style={{
            border: "none",
            background: "none",
            padding: "4px",
            cursor: "pointer",
            color: "#94A3B8",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* 2. Search Bar & Reset Toolbar (Fixed) */}
      <div
        style={{
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            flex: 1,
            position: "relative",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Search size={14} style={{ position: "absolute", left: "10px", color: "#94A3B8" }} />
          <input
            type="text"
            placeholder="Search fields..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              height: "36px",
              padding: "0 10px 0 32px",
              borderRadius: "6px",
              border: "1px solid #E5E7EB",
              fontSize: "13px",
              outline: "none",
              backgroundColor: "#F8FAFC",
              color: "#0F172A",
              boxSizing: "border-box",
            }}
          />
        </div>
        <button
          type="button"
          onClick={handleReset}
          style={{
            border: "none",
            background: "none",
            color: "#0A84FF",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 6px",
            height: "32px",
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          <RotateCcw size={13} />
          Reset
        </button>
      </div>

      {/* 3. Categorized Column List Area (Scrollable internally) */}
      <div
        className="customizer-list"
        style={{
          padding: "2px 14px 10px 14px",
          overflowY: "auto",
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {groupedCategories.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", fontSize: "12.5px", color: "#94A3B8" }}>
            No matching fields found.
          </div>
        ) : (
          groupedCategories.map((group) => (
            <div key={group.category} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  color: "#64748B",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  marginTop: "8px",
                  marginBottom: "4px",
                  padding: "0 4px",
                }}
              >
                {group.category}
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                {group.items.map((col) => {
                  const globalIndex = draftOrderedKeys.indexOf(col.id);
                  const isVisible = draftVisibleKeys.includes(col.id);

                  return (
                    <div
                      key={col.id}
                      draggable={!col.required}
                      onDragStart={(e) => handleDragStart(e, globalIndex)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, globalIndex)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        height: "34px",
                        padding: "0 8px",
                        borderRadius: "6px",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid transparent",
                        transition: "background-color 0.15s ease",
                        userSelect: "none",
                        boxSizing: "border-box",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#F8FAFC";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#FFFFFF";
                      }}
                    >
                      {/* Drag Handle */}
                      <div
                        style={{
                          cursor: col.required ? "not-allowed" : "grab",
                          color: "#94A3B8",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <GripVertical size={14} color={col.required ? "#CBD5E1" : "#94A3B8"} />
                      </div>

                      {/* Checkbox or Lock Icon */}
                      {col.required ? (
                        <div style={{ display: "flex", alignItems: "center", width: "16px" }}>
                          <Lock size={13} color="#94A3B8" />
                        </div>
                      ) : (
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={() => handleToggleColumn(col.id)}
                          style={{
                            width: "15px",
                            height: "15px",
                            accentColor: "#0A84FF",
                            cursor: "pointer",
                          }}
                        />
                      )}

                      {/* Field Label */}
                      <span
                        onClick={() => handleToggleColumn(col.id)}
                        style={{
                          fontSize: "13px",
                          fontWeight: "500",
                          color: isVisible ? "#0F172A" : "#64748B",
                          flex: 1,
                          cursor: col.required ? "default" : "pointer",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {col.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 4. Footer Actions (Always Visible & Pinned at Bottom) */}
      <div
        style={{
          height: "56px",
          padding: "10px 16px",
          borderTop: "1px solid #E5E7EB",
          backgroundColor: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "8px",
          flexShrink: 0,
          boxSizing: "border-box",
        }}
      >
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          style={{
            height: "36px",
            padding: "0 14px",
            borderRadius: "8px",
            border: "1px solid #E5E7EB",
            backgroundColor: "#FFFFFF",
            color: "#0F172A",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "all 0.15s ease",
          }}
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleApply}
          style={{
            height: "36px",
            padding: "0 16px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#0A84FF",
            color: "#FFFFFF",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: "0 1px 2px rgba(10, 132, 255, 0.2)",
            transition: "all 0.15s ease",
          }}
        >
          Apply Changes
        </button>
      </div>
    </>
  );

  return (
    <div style={{ display: "inline-block" }}>
      {/* Customize Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          height: "36px",
          padding: "0 12px",
          borderRadius: "8px",
          backgroundColor: isOpen ? "#F1F5F9" : "#FFFFFF",
          border: isOpen ? "1px solid #0A84FF" : "1px solid #E5E7EB",
          color: isOpen ? "#0A84FF" : "#0F172A",
          fontSize: "13px",
          fontWeight: "600",
          cursor: "pointer",
          boxShadow: isOpen
            ? "0 0 0 2px rgba(10, 132, 255, 0.12)"
            : "0 1px 2px rgba(15, 23, 42, 0.03)",
          transition: "all 0.15s ease",
          outline: "none",
        }}
      >
        <SlidersHorizontal size={15} color={isOpen ? "#0A84FF" : "#64748B"} />
        <span>Customize</span>
      </button>

      {/* Render Floating Panel via React Portal */}
      {isOpen &&
        createPortal(
          coords.isMobile ? (
            <>
              {/* Mobile Backdrop */}
              <div
                onClick={() => setIsOpen(false)}
                style={{
                  position: "fixed",
                  inset: 0,
                  backgroundColor: "rgba(15, 23, 42, 0.4)",
                  backdropFilter: "blur(2px)",
                  zIndex: 999,
                }}
              />
              {/* Mobile Bottom Sheet Modal */}
              <div
                ref={panelRef}
                style={{
                  position: "fixed",
                  left: "16px",
                  right: "16px",
                  bottom: "16px",
                  maxHeight: "80vh",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "16px",
                  border: "1px solid #E5E7EB",
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
                  zIndex: 1000,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  boxSizing: "border-box",
                }}
              >
                {renderPanelContent()}
              </div>
            </>
          ) : (
            /* Desktop Viewport-Positioned Popover Panel */
            <div
              ref={panelRef}
              style={{
                position: "fixed",
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                width: "400px",
                maxWidth: "calc(100vw - 32px)",
                height: "min(520px, calc(100vh - 120px))",
                maxHeight: "calc(100vh - 120px)",
                backgroundColor: "#FFFFFF",
                borderRadius: "12px",
                border: "1px solid #E5E7EB",
                boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)",
                zIndex: 1000,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                boxSizing: "border-box",
              }}
            >
              {renderPanelContent()}
            </div>
          ),
          document.body
        )}
    </div>
  );
};

export default ColumnCustomizer;
