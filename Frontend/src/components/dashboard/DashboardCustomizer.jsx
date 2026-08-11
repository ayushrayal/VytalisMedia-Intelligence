import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  X,
  GripVertical,
  RotateCcw,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { DASHBOARD_WIDGETS } from "../../config/dashboardWidgets.js";

/**
 * Single sortable item inside the customization drawer.
 */
const CustomizerRow = ({ widget, isVisible, onToggle }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id, disabled: !isVisible });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    backgroundColor: isDragging ? "#F1F5F9" : "#FFFFFF",
  };

  const IconComp = widget.icon;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 12px",
        borderRadius: "8px",
        border: "1px solid #E5E7EB",
        marginBottom: "8px",
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
        transition: "border-color 0.15s ease, background-color 0.15s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
        {isVisible ? (
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Drag to reorder ${widget.title}`}
            title="Drag to reorder"
            style={{
              background: "none",
              border: "none",
              padding: "2px",
              cursor: "grab",
              color: "#94A3B8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              outline: "none",
              touchAction: "none",
            }}
          >
            <GripVertical size={16} />
          </button>
        ) : (
          <div style={{ width: "20px" }} />
        )}

        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "6px",
            backgroundColor: "#F8FAFC",
            border: "1px solid #F1F5F9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#0F172A",
            flexShrink: 0,
          }}
        >
          {IconComp && <IconComp size={15} />}
        </div>

        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {widget.title}
          </span>
          <span style={{ fontSize: "11px", color: "#64748B" }}>
            {widget.category}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onToggle(widget.id)}
        aria-label={isVisible ? `Hide ${widget.title}` : `Show ${widget.title}`}
        aria-checked={isVisible}
        style={{
          height: "28px",
          padding: isVisible ? "0 10px" : "0 10px",
          borderRadius: "6px",
          backgroundColor: isVisible ? "#F1F5F9" : "#0A84FF",
          color: isVisible ? "#0F172A" : "#FFFFFF",
          border: isVisible ? "1px solid #CBD5E1" : "none",
          fontSize: "12px",
          fontWeight: "600",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          transition: "all 0.15s ease",
          outline: "none",
          flexShrink: 0,
        }}
      >
        {isVisible ? (
          "Hide"
        ) : (
          <>
            <Plus size={13} /> Add
          </>
        )}
      </button>
    </div>
  );
};

/**
 * DashboardCustomizer Drawer Component.
 * Premium right-side customization panel.
 */
export const DashboardCustomizer = ({
  isOpen,
  onClose,
  orderedIds = [],
  visibleIds = [],
  onToggleWidget,
  onMoveWidget,
  onResetDefault,
  savedBadge = false,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (!isOpen) return null;

  const visibleWidgets = orderedIds
    .filter((id) => visibleIds.includes(id))
    .map((id) => DASHBOARD_WIDGETS.find((w) => w.id === id))
    .filter(Boolean);

  const availableWidgets = DASHBOARD_WIDGETS.filter((w) => !visibleIds.includes(w.id));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onMoveWidget(active.id, over.id);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.35)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        zIndex: 1100,
        display: "flex",
        justifyContent: "flex-end",
      }}
      className="vytalis-backdrop-animate"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Customize Dashboard"
        className="vytalis-modal-animate"
        style={{
          width: "100%",
          maxWidth: "400px",
          height: "100vh",
          backgroundColor: "#FFFFFF",
          borderLeft: "1px solid #E5E7EB",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-10px 0 25px -5px rgba(15, 23, 42, 0.1)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#0F172A" }}>
                Customize Dashboard
              </h3>
              {savedBadge && (
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "#16A34A",
                    backgroundColor: "#F0FDF4",
                    border: "1px solid #DCFCE7",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <CheckCircle2 size={11} /> Saved
                </span>
              )}
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748B", lineHeight: 1.4 }}>
              Choose and reorder the metrics and sections you want to see.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close customizer"
            style={{
              background: "none",
              border: "none",
              color: "#94A3B8",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              outline: "none",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Widget Content */}
        <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
          {/* Section 1: VISIBLE WIDGETS */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748B" }}>
                Visible Widgets ({visibleWidgets.length})
              </span>
              <span style={{ fontSize: "11px", color: "#94A3B8" }}>Drag handles to reorder</span>
            </div>

            {visibleWidgets.length === 0 ? (
              <div style={{ padding: "16px", borderRadius: "8px", backgroundColor: "#F8FAFC", border: "1px stroke #E5E7EB", textAlign: "center", fontSize: "13px", color: "#64748B" }}>
                No active widgets. Add from available metrics below.
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={visibleWidgets.map((w) => w.id)} strategy={verticalListSortingStrategy}>
                  {visibleWidgets.map((widget) => (
                    <CustomizerRow
                      key={widget.id}
                      widget={widget}
                      isVisible={true}
                      onToggle={onToggleWidget}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* Section 2: AVAILABLE WIDGETS */}
          {availableWidgets.length > 0 && (
            <div>
              <div style={{ marginBottom: "10px" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748B" }}>
                  Available Metrics ({availableWidgets.length})
                </span>
              </div>

              <div>
                {availableWidgets.map((widget) => (
                  <CustomizerRow
                    key={widget.id}
                    widget={widget}
                    isVisible={false}
                    onToggle={onToggleWidget}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #E5E7EB",
            backgroundColor: "#F8FAFC",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <button
            type="button"
            onClick={onResetDefault}
            style={{
              background: "none",
              border: "none",
              color: "#64748B",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 0",
              outline: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#0F172A")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
          >
            <RotateCcw size={14} /> Reset to Default
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              height: "36px",
              padding: "0 18px",
              borderRadius: "8px",
              backgroundColor: "#0F172A",
              color: "#FFFFFF",
              border: "none",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              outline: "none",
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardCustomizer;
