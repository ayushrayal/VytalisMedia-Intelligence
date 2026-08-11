import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  RotateCcw,
  Check,
  X,
  Lock,
  ChevronDown,
  GripVertical,
} from "lucide-react";
import {
  ALL_DAILY_BREAKDOWN_FIELDS,
  DEFAULT_DAILY_BREAKDOWN_FIELD_IDS,
  DAILY_BREAKDOWN_FIELDS_MAP,
} from "./dailyBreakdownFields.js";

/**
 * DailyBreakdownCustomizer Component.
 * Implements "What do you want to see today?" compact analytics field selector with chip reordering,
 * field swapping, adding, removing, resetting, and applying changes.
 */
export const DailyBreakdownCustomizer = ({
  totalRecordsCount = 0,
  draftFields = [],
  setDraftFields,
  onApply,
  onReset,
}) => {
  // Active popover index for field swapping dropdown
  const [openPopoverIndex, setOpenPopoverIndex] = useState(null);
  const dragItemRef = useRef(null);
  const popoverRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setOpenPopoverIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Group all available fields by Category
  const categorizedFields = [
    {
      category: "PERFORMANCE",
      fields: ALL_DAILY_BREAKDOWN_FIELDS.filter((f) => f.category === "PERFORMANCE"),
    },
    {
      category: "FUNNEL",
      fields: ALL_DAILY_BREAKDOWN_FIELDS.filter((f) => f.category === "FUNNEL"),
    },
    {
      category: "DELIVERY & EFFICIENCY",
      fields: ALL_DAILY_BREAKDOWN_FIELDS.filter((f) => f.category === "DELIVERY & EFFICIENCY"),
    },
  ];

  // Drag & Drop handlers for chips
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

    const updated = [...draftFields];
    const [dragged] = updated.splice(dragIndex, 1);
    updated.splice(dropIndex, 0, dragged);
    setDraftFields(updated);
    dragItemRef.current = null;
  };

  // Swap field at target index with a new selected field ID
  const handleSwapField = (targetIndex, newFieldId) => {
    const updated = [...draftFields];
    updated[targetIndex] = newFieldId;
    setDraftFields(updated);
    setOpenPopoverIndex(null);
  };

  // Remove field at target index
  const handleRemoveField = (indexToRemove) => {
    const fieldId = draftFields[indexToRemove];
    if (fieldId === "date") return; // Date cannot be removed
    setDraftFields(draftFields.filter((_, idx) => idx !== indexToRemove));
    if (openPopoverIndex === indexToRemove) setOpenPopoverIndex(null);
  };

  // Add next available field
  const handleAddField = () => {
    const allAvailable = ALL_DAILY_BREAKDOWN_FIELDS.map((f) => f.id);
    const unselected = allAvailable.filter((id) => !draftFields.includes(id));
    if (unselected.length > 0) {
      setDraftFields([...draftFields, unselected[0]]);
    }
  };

  const isAddDisabled = draftFields.length >= ALL_DAILY_BREAKDOWN_FIELDS.length;

  return (
    <div
      style={{
        padding: "18px 20px",
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #E5E7EB",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      {/* 1. HEADER TITLE & SUBTITLE */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#0F172A" }}>
              Daily Breakdown
            </h3>
            <span
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "#64748B",
                backgroundColor: "#F1F5F9",
                padding: "2px 8px",
                borderRadius: "999px",
                border: "1px solid #E2E8F0",
              }}
            >
              {totalRecordsCount} records
            </span>
          </div>

          <p style={{ margin: "2px 0 0 0", fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>
            What do you want to see today?
          </p>
          <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748B" }}>
            Choose the metrics you want to see in your daily performance breakdown.
          </p>
        </div>
      </div>

      {/* 2. CHIP SELECTORS WRAPPER */}
      <div
        ref={popoverRef}
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "8px",
          position: "relative",
        }}
      >
        {draftFields.map((fieldId, index) => {
          const field = DAILY_BREAKDOWN_FIELDS_MAP.get(fieldId) || {
            id: fieldId,
            label: fieldId,
            required: false,
          };
          const isDate = field.id === "date";
          const isPopoverOpen = openPopoverIndex === index;

          return (
            <div
              key={`${field.id}-${index}`}
              draggable={!isDate}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              style={{ position: "relative" }}
            >
              {/* COMPACT FIELD CHIP */}
              <div
                onClick={() => setOpenPopoverIndex(isPopoverOpen ? null : index)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  height: "32px",
                  padding: isDate ? "0 12px" : "0 8px 0 10px",
                  borderRadius: "8px",
                  backgroundColor: isPopoverOpen ? "#F1F5F9" : "#FFFFFF",
                  border: isPopoverOpen ? "1px solid #1683FF" : "1px solid #E2E8F0",
                  color: isPopoverOpen ? "#1683FF" : "#0F172A",
                  fontSize: "13px",
                  fontWeight: "500",
                  cursor: "pointer",
                  userSelect: "none",
                  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
                  transition: "all 0.15s ease",
                }}
              >
                {!isDate && (
                  <GripVertical size={13} color="#94A3B8" style={{ cursor: "grab" }} />
                )}

                {isDate ? (
                  <Lock size={12} color="#94A3B8" />
                ) : null}

                <span>{field.label}</span>

                <ChevronDown size={13} color={isPopoverOpen ? "#1683FF" : "#94A3B8"} />

                {!isDate && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveField(index);
                    }}
                    style={{
                      border: "none",
                      background: "none",
                      padding: "2px",
                      marginLeft: "2px",
                      cursor: "pointer",
                      color: "#94A3B8",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#94A3B8")}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* FIELD SWAP DROPDOWN POPOVER */}
              {isPopoverOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "38px",
                    left: 0,
                    zIndex: 100,
                    width: "240px",
                    maxHeight: "300px",
                    overflowY: "auto",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "10px",
                    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.12)",
                    padding: "6px",
                  }}
                >
                  {categorizedFields.map((catGroup) => (
                    <div key={catGroup.category} style={{ marginBottom: "6px" }}>
                      <div
                        style={{
                          fontSize: "10px",
                          fontWeight: "700",
                          color: "#64748B",
                          letterSpacing: "0.5px",
                          padding: "6px 8px 2px 8px",
                        }}
                      >
                        {catGroup.category}
                      </div>
                      {catGroup.fields.map((f) => {
                        const isCurrentlySelected = draftFields.includes(f.id);
                        const isThisChip = field.id === f.id;

                        return (
                          <div
                            key={f.id}
                            onClick={() => {
                              if (!isCurrentlySelected || isThisChip) {
                                handleSwapField(index, f.id);
                              }
                            }}
                            style={{
                              padding: "6px 8px",
                              fontSize: "12.5px",
                              borderRadius: "6px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              cursor: isCurrentlySelected && !isThisChip ? "not-allowed" : "pointer",
                              opacity: isCurrentlySelected && !isThisChip ? 0.4 : 1,
                              backgroundColor: isThisChip ? "#F1F5F9" : "transparent",
                              color: isThisChip ? "#1683FF" : "#0F172A",
                              fontWeight: isThisChip ? "600" : "400",
                            }}
                            onMouseEnter={(e) => {
                              if (!isCurrentlySelected || isThisChip) {
                                e.currentTarget.style.backgroundColor = "#F8FAFC";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isThisChip) e.currentTarget.style.backgroundColor = "transparent";
                            }}
                          >
                            <span>{f.label}</span>
                            {isThisChip && <Check size={14} color="#1683FF" />}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* 3. TOOLBAR ACTIONS */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
          {/* + Add Field Button */}
          <button
            type="button"
            onClick={handleAddField}
            disabled={isAddDisabled}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              height: "32px",
              padding: "0 10px",
              borderRadius: "8px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E2E8F0",
              color: isAddDisabled ? "#94A3B8" : "#0F172A",
              fontSize: "12.5px",
              fontWeight: "600",
              cursor: isAddDisabled ? "not-allowed" : "pointer",
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.02)",
              transition: "all 0.15s ease",
            }}
          >
            <Plus size={14} color={isAddDisabled ? "#94A3B8" : "#1683FF"} />
            <span>Add Field</span>
          </button>

          {/* Reset Button */}
          <button
            type="button"
            onClick={onReset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              height: "32px",
              padding: "0 10px",
              borderRadius: "8px",
              backgroundColor: "transparent",
              border: "none",
              color: "#64748B",
              fontSize: "12.5px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#0F172A")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>

          {/* Apply Changes Button */}
          <button
            type="button"
            onClick={() => onApply(draftFields)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: "32px",
              padding: "0 14px",
              borderRadius: "8px",
              backgroundColor: "#1683FF",
              border: "none",
              color: "#FFFFFF",
              fontSize: "12.5px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(22, 131, 255, 0.2)",
              transition: "background-color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0072EC")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1683FF")}
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyBreakdownCustomizer;
