import { Create, useForm, useSelect } from "@refinedev/antd";
import { Form, Select } from "antd";
import { AssetNoteForm } from "../../components/asset-notes";
import { http } from "../../providers/hydra";
import { App } from "antd";
import { useNavigate } from "react-router";

export const AssetNoteCreate = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { form, onFinish, saveButtonProps } = useForm({
    redirect: false,
  });

  const { selectProps: assetSelectProps } = useSelect({
    resource: "assets",
    optionValue: "id",
    pagination: {
      mode: "server",
      pageSize: 50,
    },
  });

  const handleFinish = async (values: any) => {
    try {
      const assetId = values.assetId;
      const payload = {
        title: values.title,
        content: values.content,
        type: values.type || null,
        sentiment: values.sentiment || null,
        icon: values.icon || null,
        color: values.color || null,
        status: values.status || "normal",
      };

      const { data } = await http(`/assets/${assetId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/ld+json" },
        body: JSON.stringify(payload),
      });

      message.success("Note créée avec succès");
      navigate(`/assets/show/${assetId}`);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.["hydra:description"] || "Erreur lors de la création";
      message.error(errorMsg);
    }
  };

  return (
    <Create saveButtonProps={{ ...saveButtonProps, onClick: () => form.submit() }}>
      <Form form={form} onFinish={handleFinish} layout="vertical">
        <Form.Item
          name="assetId"
          label="Actif"
          rules={[{ required: true, message: "L'actif est requis" }]}
        >
          <Select
            {...assetSelectProps}
            placeholder="Sélectionnez un actif"
            showSearch
            filterOption={(input, option) =>
              (option?.label?.toString() ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <AssetNoteForm form={form} initialValues={{ status: "normal" }} />
      </Form>
    </Create>
  );
};
