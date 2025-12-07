import { Edit, useForm } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Form, App } from "antd";
import { AssetNoteForm } from "../../components/asset-notes";
import { http } from "../../providers/hydra";
import { useNavigate, useParams } from "react-router";

export const AssetNoteEdit = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { id } = useParams();
  const { formProps, saveButtonProps } = useForm({
    redirect: false,
  });

  const { query } = useShow({ id });
  const record = query.data?.data;

  const handleFinish = async (values: any) => {
    try {
      await http(`/asset_notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/merge-patch+json" },
        body: JSON.stringify(values),
      });

      message.success("Note modifiée avec succès");

      if (record?.asset?.id) {
        navigate(`/assets/show/${record.asset.id}`);
      } else {
        navigate("/asset-notes");
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.["hydra:description"] || "Erreur lors de la modification";
      message.error(errorMsg);
    }
  };

  return (
    <Edit saveButtonProps={{ ...saveButtonProps, onClick: () => formProps.form?.submit() }}>
      <Form {...formProps} onFinish={handleFinish} layout="vertical">
        <AssetNoteForm form={formProps.form!} initialValues={record} />
      </Form>
    </Edit>
  );
};
