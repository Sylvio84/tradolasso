import { NumberField, Show, TextField } from "@refinedev/antd";
import { useShow, useInvalidate } from "@refinedev/core";
import { Typography, Table, Card, Space, Button, Modal, Form, Input, InputNumber, Select, message } from "antd";
import { EditOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import { http } from "../../providers/hydra";

const { Title } = Typography;
const { TextArea } = Input;

interface WalletLine {
  id: number;
  quantity: string | null;
  buyPrice: string | null;
  buyConversionRate: string | null;
  currency: string | null;
  fees: string | null;
  notes: string | null;
  asset?: {
    id: number;
    name: string;
    symbol: string;
  };
}

interface Currency {
  code: string;
  label: string;
  symbol: string;
}

export const WalletShow = () => {
  const [editingLine, setEditingLine] = useState<WalletLine | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const invalidate = useInvalidate();

  const {
    query: { data, isLoading },
  } = useShow({});

  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        const { data } = await http("/currencies?page=1&itemsPerPage=100");
        setCurrencies(data.member || []);
      } catch (error) {
        console.error("Erreur chargement devises:", error);
      }
    };
    loadCurrencies();
  }, []);

  const record = data?.data;
  const lines: WalletLine[] = record?.walletLines || [];

  const handleEdit = (line: WalletLine) => {
    setEditingLine(line);
    form.setFieldsValue({
      currency: line.currency,
      quantity: line.quantity ? parseFloat(line.quantity) : null,
      buyPrice: line.buyPrice ? parseFloat(line.buyPrice) : null,
      buyConversionRate: line.buyConversionRate ? parseFloat(line.buyConversionRate) : null,
      notes: line.notes,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingLine) return;
    try {
      setSaving(true);
      const values = await form.validateFields();

      const payload = {
        currency: values.currency,
        quantity: values.quantity?.toString() || null,
        buyPrice: values.buyPrice?.toString() || null,
        buyConversionRate: values.buyConversionRate?.toString() || null,
        notes: values.notes,
      };

      await http(`/wallet_lines/${editingLine.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/merge-patch+json" },
        body: JSON.stringify(payload),
      });

      message.success("Ligne mise à jour");
      setIsModalOpen(false);
      setEditingLine(null);
      invalidate({ resource: "wallets", invalidates: ["detail"] });
    } catch (error) {
      message.error("Erreur lors de la mise à jour");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingLine(null);
    form.resetFields();
  };

  return (
    <Show isLoading={isLoading}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Card>
          <Title level={5}>ID</Title>
          <TextField value={record?.id} />
          <Title level={5}>Nom</Title>
          <TextField value={record?.name} />
          <Title level={5}>Broker</Title>
          <TextField value={record?.brokerName} />
        </Card>

        <Card title="Positions du wallet">
          <Table
            dataSource={lines}
            rowKey="id"
            pagination={false}
            size="small"
          >
            <Table.Column
              title="Asset"
              dataIndex={["asset", "symbol"]}
              render={(_, record: WalletLine) => (
                <span>
                  {record.asset?.symbol || "-"}{" "}
                  {record.asset?.name && (
                    <Typography.Text type="secondary">
                      ({record.asset.name})
                    </Typography.Text>
                  )}
                </span>
              )}
            />
            <Table.Column
              title="Quantité"
              dataIndex="quantity"
              render={(value) => value ? <NumberField value={value} /> : "-"}
            />
            <Table.Column
              title="Prix d'achat"
              dataIndex="buyPrice"
              render={(value, record: WalletLine) => {
                if (!value) return "-";
                const price = parseFloat(value);
                const rate = parseFloat(record.buyConversionRate || "1");
                const priceEur = price * rate;
                const isEur = record.currency === "EUR" || !record.currency;
                return (
                  <div>
                    <div><NumberField value={priceEur} /> €</div>
                    {!isEur && (
                      <Typography.Text type="secondary">
                        <NumberField value={price} /> {record.currency}
                      </Typography.Text>
                    )}
                  </div>
                );
              }}
            />
            <Table.Column
              title="Total achat"
              render={(_, record: WalletLine) => {
                const quantity = parseFloat(record.quantity || "0");
                const buyPrice = parseFloat(record.buyPrice || "0");
                const rate = parseFloat(record.buyConversionRate || "1");
                const total = quantity * buyPrice;
                const totalEur = total * rate;
                const isEur = record.currency === "EUR" || !record.currency;
                if (!total) return "-";
                return (
                  <div>
                    <div><NumberField value={totalEur} /> €</div>
                    {!isEur && (
                      <Typography.Text type="secondary" style={{ fontSize: "12px" }}>
                        <NumberField value={total} /> {record.currency}
                      </Typography.Text>
                    )}
                  </div>
                );
              }}
            />
            <Table.Column
              title="Actions"
              render={(_, record: WalletLine) => (
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                />
              )}
            />
          </Table>
        </Card>
      </Space>

      <Modal
        title={`Éditer la ligne - ${editingLine?.asset?.symbol || ""}`}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={handleCancel}
        confirmLoading={saving}
        okText="Enregistrer"
        cancelText="Annuler"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Devise" name="currency">
            <Select
              placeholder="Sélectionner une devise"
              allowClear
              showSearch
              optionFilterProp="label"
              options={currencies.map((c) => ({
                value: c.code,
                label: c.label,
              }))}
            />
          </Form.Item>

          <Form.Item label="Quantité" name="quantity">
            <InputNumber style={{ width: "100%" }} step={0.0001} />
          </Form.Item>

          <Title level={5}>Achat</Title>
          <Space style={{ width: "100%" }} size="middle">
            <Form.Item label="Prix d'achat" name="buyPrice" style={{ flex: 1 }}>
              <InputNumber style={{ width: "100%" }} step={0.01} />
            </Form.Item>
            <Form.Item label="Taux de conversion" name="buyConversionRate" style={{ flex: 1 }}>
              <InputNumber style={{ width: "100%" }} step={0.0001} />
            </Form.Item>
          </Space>

          <Form.Item label="Notes" name="notes">
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </Show>
  );
};
