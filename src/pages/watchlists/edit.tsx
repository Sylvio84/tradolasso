import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select, Radio, ColorPicker, Alert } from "antd";

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

export const WatchlistEdit = () => {
  const { formProps, saveButtonProps, form } = useForm({
    redirect: "show",
  });

  const isAutomatic = Form.useWatch("isAutomatic", form);
  const assetCount = (formProps.initialValues?.assetCount as number) || 0;

  const onFinish = (values: any) => {
    const payload: any = {
      name: values.name,
      description: values.description || null,
      assetType: values.assetType || null,
      icon: values.icon || null,
      status: values.status,
    };

    // Handle color from ColorPicker
    if (values.color) {
      if (typeof values.color === "string") {
        payload.color = values.color;
      } else if (values.color.toHexString) {
        payload.color = values.color.toHexString();
      }
    }

    // Don't allow changing isAutomatic if watchlist has assets
    if (assetCount === 0) {
      payload.isAutomatic = values.isAutomatic;

      // Handle criterias for automatic watchlists
      if (values.isAutomatic && values.criterias) {
        try {
          payload.criterias = JSON.parse(values.criterias);
        } catch (error) {
          payload.criterias = null;
        }
      } else {
        payload.criterias = null;
      }
    }

    return formProps.onFinish?.(payload);
  };

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form
        {...formProps}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          ...formProps.initialValues,
          criterias:
            formProps.initialValues?.criterias
              ? JSON.stringify(formProps.initialValues.criterias, null, 2)
              : undefined,
        }}
      >
        <Form.Item
          name="isAutomatic"
          label="Type de watchlist"
          rules={[{ required: true }]}
        >
          <Radio.Group disabled={assetCount > 0}>
            <Radio value={false}>Manuelle</Radio>
            <Radio value={true}>Automatique</Radio>
          </Radio.Group>
        </Form.Item>

        {assetCount > 0 && (
          <Alert
            message="Impossible de changer le type"
            description="Cette watchlist contient des actifs. Vous ne pouvez pas changer son type."
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

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

        <Form.Item name="status" label="Statut">
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
    </Edit>
  );
};
