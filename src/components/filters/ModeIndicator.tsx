import { Tag, Space } from "antd";
import {
  FilterOutlined,
  ThunderboltOutlined,
  PushpinOutlined,
} from "@ant-design/icons";

export type ScreenerMode = "filters" | "auto" | "manual";

interface ModeIndicatorProps {
  mode: ScreenerMode;
  watchlistName?: string;
  isModified?: boolean;
}

export const ModeIndicator: React.FC<ModeIndicatorProps> = ({
  mode,
  watchlistName,
  isModified = false,
}) => {
  const getModeConfig = () => {
    switch (mode) {
      case "filters":
        return {
          color: "blue",
          icon: <FilterOutlined />,
          label: "Filtres libres",
        };
      case "auto":
        return {
          color: "green",
          icon: <ThunderboltOutlined />,
          label: `Watchlist auto${watchlistName ? `: ${watchlistName}` : ""}`,
        };
      case "manual":
        return {
          color: "orange",
          icon: <PushpinOutlined />,
          label: `Watchlist manuelle${watchlistName ? `: ${watchlistName}` : ""}`,
        };
    }
  };

  const config = getModeConfig();

  return (
    <div style={{ marginBottom: 16 }}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Tag color={config.color} icon={config.icon} style={{ width: "100%", fontSize: "13px", padding: "6px 10px" }}>
          {config.label}
        </Tag>
        {isModified && mode === "auto" && (
          <Tag color="warning" style={{ width: "100%" }}>
            MODIFIÉ
          </Tag>
        )}
      </Space>
    </div>
  );
};
