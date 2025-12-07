import { Card, List, Badge, Space, Typography, Empty } from "antd";
import { PushpinFilled } from "@ant-design/icons";
import { useList } from "@refinedev/core";

const { Text } = Typography;

interface AssetNote {
  id: number;
  title: string;
  content: string;
  type?: string | null;
  status?: string | null;
  icon?: string | null;
  color?: string | null;
  sentiment?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface PinnedNotesWidgetProps {
  assetId: number;
}

const SENTIMENT_COLORS: Record<string, string> = {
  bullish: "#10B981",
  positive: "#3B82F6",
  negative: "#EF4444",
  neutral: "#64748B",
  warning: "#F59E0B",
  info: "#6B7280",
};

export const PinnedNotesWidget = ({ assetId }: PinnedNotesWidgetProps) => {
  const { query } = useList<AssetNote>({
    resource: `assets/${assetId}/notes`,
    filters: [
      {
        field: "status",
        operator: "eq",
        value: "pinned",
      },
    ],
    queryOptions: {
      queryKey: ["asset_notes", "pinned", assetId],
    },
  });

  const { data, isLoading } = query;

  if (!isLoading && (!data?.data || data.data.length === 0)) {
    return null;
  }

  return (
    <Card
      title={
        <Space>
          <PushpinFilled style={{ color: "#F59E0B" }} />
          <span>Notes importantes</span>
        </Space>
      }
      size="small"
      loading={isLoading}
      style={{ marginBottom: 24 }}
    >
      <List
        dataSource={data?.data}
        locale={{
          emptyText: <Empty description="Aucune note épinglée" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
        }}
        renderItem={(note: AssetNote) => (
          <List.Item>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Space>
                {note.icon && <span>{note.icon}</span>}
                <Text strong>{note.title}</Text>
                {note.sentiment && (
                  <Badge color={SENTIMENT_COLORS[note.sentiment]} text={note.sentiment} />
                )}
              </Space>
              <Text type="secondary">{note.content}</Text>
            </Space>
          </List.Item>
        )}
      />
    </Card>
  );
};
