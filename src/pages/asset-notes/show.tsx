import { Show, TextField } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography, Space, Tag, Badge, Descriptions, Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";

const { Title, Paragraph } = Typography;

const TYPE_COLORS: Record<string, string> = {
  technical: "blue",
  fundamental: "green",
  risk: "red",
  opportunity: "gold",
  other: "default",
};

const SENTIMENT_COLORS: Record<string, string> = {
  bullish: "#10B981",
  positive: "#3B82F6",
  negative: "#EF4444",
  neutral: "#64748B",
  warning: "#F59E0B",
  info: "#6B7280",
};

export const AssetNoteShow = () => {
  const navigate = useNavigate();
  const { query } = useShow();
  const { data, isLoading } = query;
  const record = data?.data;

  return (
    <Show
      isLoading={isLoading}
      headerButtons={({ defaultButtons }) => (
        <>
          {record?.asset?.id && (
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(`/assets/show/${record.asset.id}`)}
            >
              Retour à l'actif
            </Button>
          )}
          {defaultButtons}
        </>
      )}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Title level={3}>
            {record?.icon} {record?.title}
          </Title>
          <Space>
            {record?.type && <Tag color={TYPE_COLORS[record.type]}>{record.type}</Tag>}
            {record?.sentiment && <Badge color={SENTIMENT_COLORS[record.sentiment]} text={record.sentiment} />}
            {record?.status === "pinned" && <Tag color="gold">Épinglée</Tag>}
            {record?.status === "archived" && <Tag color="default">Archivée</Tag>}
          </Space>
        </div>

        <Descriptions bordered column={2}>
          <Descriptions.Item label="Actif" span={2}>
            {record?.asset ? (
              <Button
                type="link"
                onClick={() => navigate(`/assets/show/${record.asset.id}`)}
                style={{ padding: 0 }}
              >
                {record.asset.symbol} - {record.asset.name}
              </Button>
            ) : (
              "-"
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Créée le">
            {record?.createdAt ? new Date(record.createdAt).toLocaleDateString("fr-FR") : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Modifiée le">
            {record?.updatedAt ? new Date(record.updatedAt).toLocaleDateString("fr-FR") : "-"}
          </Descriptions.Item>
        </Descriptions>

        <div>
          <Title level={5}>Contenu</Title>
          <Paragraph style={{ whiteSpace: "pre-wrap" }}>{record?.content}</Paragraph>
        </div>
      </Space>
    </Show>
  );
};
