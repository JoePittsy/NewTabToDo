import React from "react";

export interface TabDef {
  key: string;
  label: string;
}

interface DialogHeaderProps {
  title: string;
  tabs: TabDef[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  style?: React.CSSProperties;
  className?: string;
  onClose: () => void;
}

export const DialogHeader: React.FC<DialogHeaderProps> = ({
  title,
  tabs,
  activeTab,
  setActiveTab,
  onClose,
  style,
  className,
}) => {
  React.useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "1.3em", color: "#8ec6ff" }}>
          {title}
        </h2>
        <button
          onClick={onClose}
          style={{
            marginTop: 8,
            padding: "0.5em 1.2em",
            borderRadius: 6,
            color: "#8ec6ff",
            backgroundColor: "transparent",
            border: "none",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "1.08em",
          }}
        >
          X
        </button>
      </div>
      <div
        style={{
          display: "flex",
          gap: 0,
          marginBottom: "0.5em",
          borderBottom: "1.5px solid #222",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key as any)}
            style={{
              background: "none",
              border: "none",
              color: activeTab === t.key ? "#8ec6ff" : "#7a869a",
              fontWeight: activeTab === t.key ? 700 : 500,
              fontSize: "1em",
              padding: "0.5em 1.2em",
              borderBottom:
                activeTab === t.key
                  ? "2.5px solid #8ec6ff"
                  : "2.5px solid transparent",
              cursor: "pointer",
              outline: "none",
              borderRadius: "8px 8px 0 0",
              marginRight: 2,
              transition: "color 0.2s, border-bottom 0.2s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DialogHeader;
