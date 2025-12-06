import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Select, Radio, ColorPicker } from "antd";

const { TextArea } = Input;

// Asset type options
const ASSET_TYPE_OPTIONS = [
  { value: "stock", label: "Actions" },
  { value: "fund", label: "Fonds" },
  { value: "crypto", label: "Cryptomonnaies" },
  { value: "bond", label: "Obligations" },
  { value: "commodity", label: "Matières premières" },
  { value: "real_estate", label: "Immobilier" },
  { value: "forex", label: "Devises" },
  { value: "cash_account", label: "Comptes de trésorerie" },
];

// Status options
const STATUS_OPTIONS = [
  { value: "pinned", label: "Épinglée" },
  { value: "normal", label: "Normale" },
  { value: "archived", label: "Archivée" },
];

// Icon options
const ICON_OPTIONS = [
  { value: "coins", label: "Coins" },
  { value: "trending-up", label: "Trending Up" },
  { value: "star", label: "Star" },
  { value: "fire", label: "Fire" },
  { value: "rocket", label: "Rocket" },
  { value: "eye", label: "Eye" },
  { value: "heart", label: "Heart" },
  { value: "flag", label: "Flag" },
];

export const WatchlistCreate = () => {
  const { formProps, saveButtonProps, form } = useForm({
    redirect: "show",
  });

  const isAutomatic = Form.useWatch("isAutomatic", form);

  const onFinish = (values: any) => {
    const payload: any = {
      name: values.name,
      description: values.description || null,
      assetType: values.assetType || null,
      isAutomatic: values.isAutomatic,
      icon: values.icon || null,
      status: values.status || "normal",
    };

    // Handle color from ColorPicker
    if (values.color) {
      if (typeof values.color === "string") {
        payload.color = values.color;
      } else if (values.color.toHexString) {
        payload.color = values.color.toHexString();
      }
    }

    // Handle criterias for automatic watchlists
    if (values.isAutomatic && values.criterias) {
      try {
        payload.criterias = JSON.parse(values.criterias);
      } catch (error) {
        // Validation should prevent this
        payload.criterias = null;
      }
    } else {
      payload.criterias = null;
    }

    return formProps.onFinish?.(payload);
  };

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="isAutomatic"
          label="Type de watchlist"
          initialValue={false}
          rules={[{ required: true }]}
        >
          <Radio.Group>
            <Radio value={false}>Manuelle</Radio>
            <Radio value={true}>Automatique</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="name"
          label="Nom"
          rules={[
            { required: true, message: "Le nom est requis" },
            { max: 100, message: "Le nom ne peut pas dépasser 100 caractères" },
          ]}
        >
          <Input placeholder="Ma watchlist" />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <TextArea rows={3} placeholder="Description de la watchlist" />
        </Form.Item>

        <Form.Item name="assetType" label="Type d'actifs">
          <Select
            allowClear
            placeholder="Tous les types"
            options={ASSET_TYPE_OPTIONS}
          />
        </Form.Item>

        <Form.Item name="color" label="Couleur">
          <ColorPicker format="hex" showText />
        </Form.Item>

        <Form.Item name="icon" label="Icône">
          <Select
            allowClear
            placeholder="Sélectionner une icône"
            options={ICON_OPTIONS}
          />
        </Form.Item>

        <Form.Item name="status" label="Statut" initialValue="normal">
          <Select options={STATUS_OPTIONS} />
        </Form.Item>

        {isAutomatic && (
          <Form.Item
            name="criterias"
            label="Critères (JSON)"
            rules={[
              {
                required: true,
                message: "Les critères sont requis pour une watchlist automatique",
              },
              {
                validator: async (_, value) => {
                  if (!value) return;
                  try {
                    JSON.parse(value);
                  } catch {
                    throw new Error("Le JSON est invalide");
                  }
                },
              },
            ]}
          >
            <TextArea
              rows={8}
              placeholder='{"filters": {}, "order": {}, "itemsPerPage": 50}'
            />
          </Form.Item>
        )}
      </Form>
    </Create>
  );
};
