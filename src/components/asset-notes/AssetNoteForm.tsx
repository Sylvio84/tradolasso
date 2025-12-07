import { Form, Input, Select, ColorPicker, FormInstance } from "antd";
import { Color } from "antd/es/color-picker";

const { TextArea } = Input;

interface AssetNoteFormProps {
  form: FormInstance;
  initialValues?: any;
}

export const AssetNoteForm = ({ form, initialValues }: AssetNoteFormProps) => {
  return (
    <Form form={form} initialValues={initialValues} layout="vertical">
      <Form.Item
        name="title"
        label="Titre"
        rules={[
          { required: true, message: "Le titre est requis" },
          { max: 255, message: "Le titre ne peut pas dépasser 255 caractères" },
        ]}
      >
        <Input placeholder="Ex: Analyse technique Q4 2025" />
      </Form.Item>

      <Form.Item
        name="content"
        label="Contenu"
        rules={[{ required: true, message: "Le contenu est requis" }]}
      >
        <TextArea
          rows={6}
          placeholder="Détails de votre analyse..."
        />
      </Form.Item>

      <Form.Item name="type" label="Type">
        <Select placeholder="Sélectionnez un type" allowClear>
          <Select.Option value="technical">Technique</Select.Option>
          <Select.Option value="fundamental">Fondamental</Select.Option>
          <Select.Option value="risk">Risque</Select.Option>
          <Select.Option value="opportunity">Opportunité</Select.Option>
          <Select.Option value="other">Autre</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item name="sentiment" label="Sentiment">
        <Select placeholder="Sélectionnez un sentiment" allowClear>
          <Select.Option value="bullish">Haussier</Select.Option>
          <Select.Option value="positive">Positif</Select.Option>
          <Select.Option value="negative">Négatif</Select.Option>
          <Select.Option value="neutral">Neutre</Select.Option>
          <Select.Option value="warning">Avertissement</Select.Option>
          <Select.Option value="info">Info</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item name="icon" label="Icône">
        <Input placeholder="Ex: 📈, 💡, ⚠️" maxLength={50} />
      </Form.Item>

      <Form.Item
        name="color"
        label="Couleur"
        getValueFromEvent={(color: Color) => {
          return color.toHexString();
        }}
      >
        <ColorPicker format="hex" />
      </Form.Item>

      <Form.Item name="status" label="Statut">
        <Select defaultValue="normal">
          <Select.Option value="normal">Normale</Select.Option>
          <Select.Option value="pinned">Épinglée</Select.Option>
          <Select.Option value="archived">Archivée</Select.Option>
        </Select>
      </Form.Item>
    </Form>
  );
};
