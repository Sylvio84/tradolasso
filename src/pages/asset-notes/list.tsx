import { useState } from "react";
import { List, useTable } from "@refinedev/antd";
import { Form, Input, Select, Space, Button, Modal } from "antd";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import { AssetNotesList } from "../../components/asset-notes";
import { AssetNoteForm } from "../../components/asset-notes";
import { useNavigate } from "react-router";
import { http } from "../../providers/hydra";
import { useInvalidate } from "@refinedev/core";
import { App } from "antd";

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

export const AssetNoteList = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const invalidate = useInvalidate();
  const [filterForm] = Form.useForm();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [editingNote, setEditingNote] = useState<AssetNote | null>(null);

  const { tableProps, searchFormProps, filters, setFilters } = useTable<AssetNote>({
    syncWithLocation: true,
    filters: {
      initial: [
        {
          field: "status",
          operator: "nin",
          value: ["archived"],
        },
      ],
    },
    sorters: {
      initial: [
        {
          field: "status",
          order: "desc", // Pinned first
        },
        {
          field: "createdAt",
          order: "desc",
        },
      ],
    },
  });

  const handleFilter = (values: any) => {
    const newFilters: any[] = [
      {
        field: "status",
        operator: "nin",
        value: ["archived"],
      },
    ];

    if (values.search) {
      newFilters.push({
        field: "title",
        operator: "contains",
        value: values.search,
      });
    }

    if (values.type) {
      newFilters.push({
        field: "type",
        operator: "eq",
        value: values.type,
      });
    }

    if (values.sentiment) {
      newFilters.push({
        field: "sentiment",
        operator: "eq",
        value: values.sentiment,
      });
    }

    if (values.status) {
      newFilters.push({
        field: "status",
        operator: "eq",
        value: values.status,
      });
    }

    setFilters(newFilters);
  };

  const handleEdit = (note: AssetNote) => {
    setEditingNote(note);
    editForm.setFieldsValue({
      title: note.title,
      content: note.content,
      type: note.type,
      sentiment: note.sentiment,
      icon: note.icon,
      color: note.color,
      status: note.status,
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();

      await http(`/asset_notes/${editingNote?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/merge-patch+json" },
        body: JSON.stringify(values),
      });

      message.success("Note modifiée");
      setEditModalOpen(false);
      editForm.resetFields();
      setEditingNote(null);

      invalidate({
        resource: "asset_notes",
        invalidates: ["list"],
      });
    } catch (error: any) {
      const errorMsg = error?.response?.data?.["hydra:description"] || "Erreur lors de la modification";
      message.error(errorMsg);
    }
  };

  const handleDeleted = () => {
    invalidate({
      resource: "asset_notes",
      invalidates: ["list"],
    });
  };

  return (
    <>
      <List
        headerButtons={({ defaultButtons }) => (
          <>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate("/asset-notes/create")}
            >
              Créer une note
            </Button>
            {defaultButtons}
          </>
        )}
      >
        <Form form={filterForm} onFinish={handleFilter} layout="inline" style={{ marginBottom: 24 }}>
          <Form.Item name="search">
            <Input
              placeholder="Rechercher dans les notes..."
              prefix={<SearchOutlined />}
              allowClear
              style={{ width: 250 }}
            />
          </Form.Item>

          <Form.Item name="type">
            <Select placeholder="Type" style={{ width: 150 }} allowClear>
              <Select.Option value="technical">Technique</Select.Option>
              <Select.Option value="fundamental">Fondamental</Select.Option>
              <Select.Option value="risk">Risque</Select.Option>
              <Select.Option value="opportunity">Opportunité</Select.Option>
              <Select.Option value="other">Autre</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="sentiment">
            <Select placeholder="Sentiment" style={{ width: 150 }} allowClear>
              <Select.Option value="bullish">Haussier</Select.Option>
              <Select.Option value="positive">Positif</Select.Option>
              <Select.Option value="negative">Négatif</Select.Option>
              <Select.Option value="neutral">Neutre</Select.Option>
              <Select.Option value="warning">Avertissement</Select.Option>
              <Select.Option value="info">Info</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="status">
            <Select placeholder="Statut" style={{ width: 150 }} allowClear>
              <Select.Option value="pinned">Épinglées</Select.Option>
              <Select.Option value="normal">Normales</Select.Option>
              <Select.Option value="archived">Archivées</Select.Option>
            </Select>
          </Form.Item>

          <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
            Rechercher
          </Button>
        </Form>

        <AssetNotesList
          notes={(tableProps.dataSource as AssetNote[]) || []}
          onEdit={handleEdit}
          onDeleted={handleDeleted}
          showAsset={true}
        />
      </List>

      {/* Edit Modal */}
      <Modal
        title="Modifier la note"
        open={editModalOpen}
        onOk={handleEditSubmit}
        onCancel={() => {
          setEditModalOpen(false);
          editForm.resetFields();
          setEditingNote(null);
        }}
        okText="Enregistrer"
        cancelText="Annuler"
        width={700}
      >
        <AssetNoteForm form={editForm} />
      </Modal>
    </>
  );
};
