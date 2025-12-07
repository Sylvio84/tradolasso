import { Card, Tag, Badge, Space, Typography, Button, App } from "antd";
import { PushpinOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";
import { http } from "../../providers/hydra";
import { useInvalidate } from "@refinedev/core";

const { Text, Paragraph } = Typography;

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
  asset?: {
    id: number;
    symbol: string;
    name: string;
  };
}

interface AssetNoteCardProps {
  note: AssetNote;
  onEdit?: (note: AssetNote) => void;
  onDeleted?: () => void;
  showAsset?: boolean;
}

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

export const AssetNoteCard = ({ note, onEdit, onDeleted, showAsset = false }: AssetNoteCardProps) => {
  const { modal, message } = App.useApp();
  const navigate = useNavigate();
  const invalidate = useInvalidate();

  const handleDelete = () => {
    modal.confirm({
      title: "Supprimer cette note ?",
      content: "Cette action est irréversible",
      okText: "Supprimer",
      okType: "danger",
      cancelText: "Annuler",
      onOk: async () => {
        try {
          await http(`/asset_notes/${note.id}`, {
            method: "DELETE",
          });
          message.success("Note supprimée");
          invalidate({
            resource: "asset_notes",
            invalidates: ["all"],
          });
          onDeleted?.();
        } catch (error: any) {
          const errorMsg = error?.response?.data?.["hydra:description"] || "Erreur lors de la suppression";
          message.error(errorMsg);
        }
      },
    });
  };

  return (
    <Card
      size="small"
      title={
        <Space>
          {note.icon && <span style={{ fontSize: "1.2em" }}>{note.icon}</span>}
          <span>{note.title}</span>
          {note.status === "pinned" && (
            <PushpinOutlined style={{ color: "#F59E0B" }} />
          )}
        </Space>
      }
      extra={
        <Space>
          {onEdit && (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(note)}
            />
          )}
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={handleDelete}
          />
        </Space>
      }
      style={{ borderLeft: `4px solid ${note.color || "#E5E7EB"}` }}
    >
      <Space direction="vertical" size="small" style={{ width: "100%" }}>
        <Space wrap>
          {note.type && (
            <Tag color={TYPE_COLORS[note.type]}>{note.type}</Tag>
          )}
          {note.sentiment && (
            <Badge
              color={SENTIMENT_COLORS[note.sentiment]}
              text={note.sentiment}
            />
          )}
          {showAsset && note.asset && (
            <Button
              type="link"
              size="small"
              onClick={() => navigate(`/assets/show/${note.asset?.id}`)}
            >
              {note.asset.symbol} - {note.asset.name}
            </Button>
          )}
        </Space>

        <Paragraph ellipsis={{ rows: 3, expandable: true }} style={{ marginBottom: 0 }}>
          {note.content}
        </Paragraph>

        <Text type="secondary" style={{ fontSize: "0.85em" }}>
          Créée le {note.createdAt ? new Date(note.createdAt).toLocaleDateString("fr-FR") : "-"} •
          Modifiée le {note.updatedAt ? new Date(note.updatedAt).toLocaleDateString("fr-FR") : "-"}
        </Text>
      </Space>
    </Card>
  );
};
