import { List, Tabs, Empty } from "antd";
import {
  FileTextOutlined,
  LineChartOutlined,
  FundOutlined,
  WarningOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import { AssetNoteCard } from "./AssetNoteCard";

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

interface AssetNotesListProps {
  notes: AssetNote[];
  onEdit?: (note: AssetNote) => void;
  onDeleted?: () => void;
  showAsset?: boolean;
}

export const AssetNotesList = ({ notes, onEdit, onDeleted, showAsset = false }: AssetNotesListProps) => {
  const notesByType = {
    all: notes,
    technical: notes.filter((n) => n.type === "technical"),
    fundamental: notes.filter((n) => n.type === "fundamental"),
    risk: notes.filter((n) => n.type === "risk"),
    opportunity: notes.filter((n) => n.type === "opportunity"),
  };

  const renderNoteList = (notesList: AssetNote[]) => (
    <List
      dataSource={notesList}
      renderItem={(note) => (
        <List.Item style={{ padding: "12px 0" }}>
          <AssetNoteCard
            note={note}
            onEdit={onEdit}
            onDeleted={onDeleted}
            showAsset={showAsset}
          />
        </List.Item>
      )}
      locale={{
        emptyText: <Empty description="Aucune note" />,
      }}
    />
  );

  const tabs = [
    {
      key: "all",
      label: (
        <span>
          <FileTextOutlined /> Toutes ({notesByType.all.length})
        </span>
      ),
      children: renderNoteList(notesByType.all),
    },
    {
      key: "technical",
      label: (
        <span>
          <LineChartOutlined /> Technique ({notesByType.technical.length})
        </span>
      ),
      children: renderNoteList(notesByType.technical),
    },
    {
      key: "fundamental",
      label: (
        <span>
          <FundOutlined /> Fondamental ({notesByType.fundamental.length})
        </span>
      ),
      children: renderNoteList(notesByType.fundamental),
    },
    {
      key: "risk",
      label: (
        <span>
          <WarningOutlined /> Risques ({notesByType.risk.length})
        </span>
      ),
      children: renderNoteList(notesByType.risk),
    },
    {
      key: "opportunity",
      label: (
        <span>
          <BulbOutlined /> Opportunités ({notesByType.opportunity.length})
        </span>
      ),
      children: renderNoteList(notesByType.opportunity),
    },
  ];

  return <Tabs items={tabs} />;
};
