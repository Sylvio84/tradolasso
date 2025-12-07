import { useState } from "react";
import { Modal, Button, Space, Spin, Empty, App } from "antd";
import { PlusOutlined, FileTextOutlined } from "@ant-design/icons";
import { useList, useInvalidate } from "@refinedev/core";
import { AssetNotesList } from "./AssetNotesList";
import { AssetNoteForm } from "./AssetNoteForm";
import { Form } from "antd";
import { http } from "../../providers/hydra";

interface AssetNotesModalProps {
  assetId: number;
  assetSymbol?: string;
  assetName?: string;
  open: boolean;
  onClose: () => void;
}

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

export const AssetNotesModal = ({
  assetId,
  assetSymbol,
  assetName,
  open,
  onClose
}: AssetNotesModalProps) => {
  const { message } = App.useApp();
  const invalidate = useInvalidate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [editingNote, setEditingNote] = useState<AssetNote | null>(null);

  // Load asset notes
  const { query: notesQuery } = useList<AssetNote>({
    resource: `assets/${assetId}/notes`,
    queryOptions: {
      enabled: open && !!assetId,
      queryKey: ["asset_notes", "modal", assetId],
    },
    filters: [
      {
        field: "status",
        operator: "nin",
        value: ["archived"],
      },
    ],
    sorters: [
      {
        field: "status",
        order: "desc", // Pinned first
      },
      {
        field: "createdAt",
        order: "desc",
      },
    ],
  });

  const notesData = notesQuery.data;
  const notesLoading = notesQuery.isLoading;
  const refetchNotes = notesQuery.refetch;

  // Create new note
  const handleCreateNote = async () => {
    try {
      const values = await createForm.validateFields();

      await http(`/assets/${assetId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/ld+json" },
        body: JSON.stringify({
          title: values.title,
          content: values.content,
          type: values.type || null,
          sentiment: values.sentiment || null,
          icon: values.icon || null,
          color: values.color || null,
          status: values.status || "normal",
        }),
      });

      message.success("Note créée");
      setIsCreateModalOpen(false);
      createForm.resetFields();
      refetchNotes();

      invalidate({
        resource: "asset_notes",
        invalidates: ["all"],
      });
    } catch (error: any) {
      const errorMsg = error?.response?.data?.["hydra:description"] || "Erreur lors de la création";
      message.error(errorMsg);
    }
  };

  // Edit note
  const handleEditNote = (note: AssetNote) => {
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
    setIsEditModalOpen(true);
  };

  const handleEditNoteSubmit = async () => {
    try {
      const values = await editForm.validateFields();

      await http(`/asset_notes/${editingNote?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/merge-patch+json" },
        body: JSON.stringify(values),
      });

      message.success("Note modifiée");
      setIsEditModalOpen(false);
      editForm.resetFields();
      setEditingNote(null);
      refetchNotes();

      invalidate({
        resource: "asset_notes",
        invalidates: ["all"],
      });
    } catch (error: any) {
      const errorMsg = error?.response?.data?.["hydra:description"] || "Erreur lors de la modification";
      message.error(errorMsg);
    }
  };

  const handleDeleted = () => {
    refetchNotes();
    invalidate({
      resource: "asset_notes",
      invalidates: ["all"],
    });
  };

  const handleClose = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    createForm.resetFields();
    editForm.resetFields();
    setEditingNote(null);
    onClose();
  };

  return (
    <>
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            <span>
              Notes - {assetSymbol}
              {assetName && ` (${assetName})`}
            </span>
          </Space>
        }
        open={open}
        onCancel={handleClose}
        footer={[
          <Button key="close" onClick={handleClose}>
            Fermer
          </Button>,
        ]}
        width={900}
        style={{ top: 20 }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              createForm.setFieldsValue({ status: "normal" });
              setIsCreateModalOpen(true);
            }}
          >
            Créer une note
          </Button>

          {notesLoading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <Spin size="large" />
            </div>
          ) : notesData?.data && notesData.data.length > 0 ? (
            <AssetNotesList
              notes={notesData.data as any}
              onEdit={handleEditNote}
              onDeleted={handleDeleted}
            />
          ) : (
            <Empty
              description="Aucune note pour cet actif"
              style={{ padding: "40px" }}
            />
          )}
        </Space>
      </Modal>

      {/* Create Note Modal */}
      <Modal
        title="Créer une note"
        open={isCreateModalOpen}
        onOk={handleCreateNote}
        onCancel={() => {
          setIsCreateModalOpen(false);
          createForm.resetFields();
        }}
        okText="Créer"
        cancelText="Annuler"
        width={700}
      >
        <AssetNoteForm form={createForm} />
      </Modal>

      {/* Edit Note Modal */}
      <Modal
        title="Modifier la note"
        open={isEditModalOpen}
        onOk={handleEditNoteSubmit}
        onCancel={() => {
          setIsEditModalOpen(false);
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
