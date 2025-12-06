import { useState } from "react";
import { Dropdown, Button, Modal, Form, Input, App } from "antd";
import { StarOutlined, PlusOutlined, DownOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";
import { useInvalidate } from "@refinedev/core";
import { http } from "../providers/hydra";

const { TextArea } = Input;

interface Watchlist {
  id: number;
  name: string;
  isAutomatic: boolean;
  color?: string | null;
}

interface AddToWatchlistButtonProps {
  assetId: number;
  assetSymbol?: string;
  size?: "small" | "middle" | "large";
  type?: "default" | "primary" | "text" | "link";
  showLabel?: boolean;
}

export const AddToWatchlistButton: React.FC<AddToWatchlistButtonProps> = ({
  assetId,
  assetSymbol,
  size = "small",
  type = "default",
  showLabel = false,
}) => {
  const { modal, message } = App.useApp();
  const navigate = useNavigate();
  const invalidate = useInvalidate();

  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [watchlistsLoading, setWatchlistsLoading] = useState(false);
  const [isCreateWatchlistModalOpen, setIsCreateWatchlistModalOpen] = useState(false);
  const [createWatchlistForm] = Form.useForm();

  // Load watchlists (manual only)
  const loadWatchlists = async () => {
    setWatchlistsLoading(true);
    try {
      const params = new URLSearchParams({
        isAutomatic: "false",
        pagination: "false",
      });
      const { data } = await http(`/watchlists?${params}`);
      setWatchlists(data.member || []);
    } catch (error) {
      console.error("Error loading watchlists:", error);
    } finally {
      setWatchlistsLoading(false);
    }
  };

  // Add asset to watchlist
  const handleAddToWatchlist = async (watchlistId: number) => {
    try {
      await http(`/watchlist_assets`, {
        method: "POST",
        headers: { "Content-Type": "application/ld+json" },
        body: JSON.stringify({
          watchlistId,
          assetId,
        }),
      });
      message.success(
        `${assetSymbol || "Actif"} ajouté à la watchlist`
      );

      // Reload watchlists to update the dropdown
      loadWatchlists();

      // Invalidate watchlist caches - use "all" to refresh everything
      invalidate({
        resource: "watchlists",
        invalidates: ["all"],
      });

      // Also invalidate watchlist_assets resource
      invalidate({
        resource: "watchlist_assets",
        invalidates: ["all"],
      });
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.["hydra:description"] || "Erreur lors de l'ajout";
      message.error(errorMsg);
    }
  };

  // Create new watchlist with asset
  const handleCreateWatchlist = async () => {
    try {
      const values = await createWatchlistForm.validateFields();

      // Create watchlist
      const { data: newWatchlist } = await http(`/watchlists`, {
        method: "POST",
        headers: { "Content-Type": "application/ld+json" },
        body: JSON.stringify({
          name: values.name,
          description: values.description || null,
          isAutomatic: false,
          status: "normal",
        }),
      });

      // Add asset to the new watchlist
      await http(`/watchlist_assets`, {
        method: "POST",
        headers: { "Content-Type": "application/ld+json" },
        body: JSON.stringify({
          watchlistId: newWatchlist.id,
          assetId,
        }),
      });

      message.success("Watchlist créée et actif ajouté");
      setIsCreateWatchlistModalOpen(false);
      createWatchlistForm.resetFields();

      // Reload watchlists to update the dropdown
      loadWatchlists();

      // Invalidate watchlist caches - use "all" to refresh everything
      invalidate({
        resource: "watchlists",
        invalidates: ["all"],
      });

      // Also invalidate watchlist_assets resource
      invalidate({
        resource: "watchlist_assets",
        invalidates: ["all"],
      });

      // Optionally navigate to the new watchlist
      modal.confirm({
        title: "Watchlist créée",
        content: "Voulez-vous voir la watchlist ?",
        okText: "Voir",
        cancelText: "Rester ici",
        onOk: () => navigate(`/watchlists/show/${newWatchlist.id}`),
      });
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.["hydra:description"] ||
        "Erreur lors de la création";
      message.error(errorMsg);
    }
  };

  // Dropdown menu items
  const getWatchlistMenuItems = () => {
    const items: any[] = [];

    // Add existing watchlists
    watchlists.forEach((wl) => {
      items.push({
        key: `watchlist-${wl.id}`,
        label: (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {wl.color && (
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: wl.color,
                  flexShrink: 0,
                }}
              />
            )}
            <span>{wl.name}</span>
          </div>
        ),
        onClick: () => handleAddToWatchlist(wl.id),
      });
    });

    // Add separator and "Create new" option
    if (items.length > 0) {
      items.push({ type: "divider" });
    }

    items.push({
      key: "create-new",
      label: (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <PlusOutlined />
          <span>Créer une nouvelle liste</span>
        </div>
      ),
      onClick: () => {
        loadWatchlists(); // Refresh list
        setIsCreateWatchlistModalOpen(true);
      },
    });

    return items;
  };

  return (
    <>
      <Dropdown
        menu={{ items: getWatchlistMenuItems() }}
        onOpenChange={(open) => {
          if (open) loadWatchlists();
        }}
        trigger={["click"]}
      >
        <Button
          icon={<StarOutlined />}
          size={size}
          type={type}
          loading={watchlistsLoading}
        >
          {showLabel && (
            <>
              Watchlist <DownOutlined />
            </>
          )}
        </Button>
      </Dropdown>

      {/* Create Watchlist Modal */}
      <Modal
        title="Créer une nouvelle watchlist"
        open={isCreateWatchlistModalOpen}
        onOk={handleCreateWatchlist}
        onCancel={() => {
          setIsCreateWatchlistModalOpen(false);
          createWatchlistForm.resetFields();
        }}
        okText="Créer et ajouter"
        cancelText="Annuler"
      >
        <Form form={createWatchlistForm} layout="vertical">
          <Form.Item
            name="name"
            label="Nom"
            rules={[
              { required: true, message: "Le nom est requis" },
              { max: 100, message: "Le nom ne peut pas dépasser 100 caractères" },
            ]}
          >
            <Input placeholder="Ma nouvelle watchlist" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Description (optionnelle)" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
