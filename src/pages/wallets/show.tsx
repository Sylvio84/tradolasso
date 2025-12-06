import { NumberField, Show, ShowButton, TextField } from "@refinedev/antd";
import { useShow, useInvalidate } from "@refinedev/core";
import { Typography, Table, Card, Space, Button, Modal, Form, Input, InputNumber, Select, DatePicker, App } from "antd";
import { EditOutlined, SwapOutlined, PlusOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { Link } from "react-router";
import { useState, useEffect } from "react";
import { http } from "../../providers/hydra";
import { AddToWatchlistButton } from "../../components/AddToWatchlistButton";

const { Title } = Typography;
const { TextArea } = Input;

interface ScreenerAsset {
  id: number;
  screener?: { id: number; name: string };
  metrics?: Record<string, string>;
}

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
    lastPrice: string | null;
    screenerAssets?: ScreenerAsset[];
  };
}

// Helper to get lasso.score from screenerAssets
const getLassoScore = (screenerAssets: ScreenerAsset[] | undefined): number | null => {
  if (!screenerAssets) return null;
  for (const sa of screenerAssets) {
    if (sa.metrics && "lasso.score" in sa.metrics) {
      return parseFloat(sa.metrics["lasso.score"]);
    }
  }
  return null;
};

interface Currency {
  code: string;
  label: string;
  symbol: string;
}

interface TransactionType {
  value: string;
  label: string;
}

interface Asset {
  id: number;
  symbol: string;
  name: string;
  currency: string | null;
}

export const WalletShow = () => {
  const { modal, message } = App.useApp();
  const [editingLine, setEditingLine] = useState<WalletLine | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>([]);
  const [transactionLine, setTransactionLine] = useState<WalletLine | null>(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionForm] = Form.useForm();
  const [savingTransaction, setSavingTransaction] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
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
    const loadTransactionTypes = async () => {
      try {
        const { data } = await http("/transaction_types");
        setTransactionTypes(data.member || []);
      } catch (error) {
        console.error("Erreur chargement types de transaction:", error);
      }
    };
    loadCurrencies();
    loadTransactionTypes();
  }, []);

  const searchAssets = async () => {
    setAssetsLoading(true);
    try {
      const params = new URLSearchParams({
        itemsPerPage: "100",
        pagination: "false",
      });
      const { data } = await http(`/assets?${params}`);
      setAssets(data.member || []);
    } catch (error) {
      console.error("Erreur recherche assets:", error);
    } finally {
      setAssetsLoading(false);
    }
  };

  const record = data?.data;
  const lines: WalletLine[] = record?.walletLines || [];

  useEffect(() => {
    if (record?.name) {
      document.title = `${record.name} | Wallet`;
    }
  }, [record?.name]);

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
      invalidate({ resource: "wallets", invalidates: ["detail"], id: record?.id });
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

  const handleTransaction = (line: WalletLine) => {
    setTransactionLine(line);
    transactionForm.setFieldsValue({
      transactionType: "buy",
      currency: line.currency || "EUR",
      conversionRate: line.buyConversionRate ? parseFloat(line.buyConversionRate) : 1,
    });
    setIsTransactionModalOpen(true);
  };

  const handleNewTransaction = () => {
    setTransactionLine(null);
    transactionForm.setFieldsValue({
      transactionType: "buy",
      currency: "EUR",
      conversionRate: 1,
    });
    searchAssets();
    setIsTransactionModalOpen(true);
  };

  const handleSaveTransaction = async () => {
    if (!record?.id) return;
    try {
      setSavingTransaction(true);
      const values = await transactionForm.validateFields();

      const payload: Record<string, unknown> = {
        transactionType: values.transactionType,
        transactionDate: values.transactionDate?.toISOString() || null,
        quantity: values.quantity?.toString() || null,
        unitPrice: values.unitPrice?.toString() || null,
        fees: values.fees?.toString() || null,
        currency: values.currency,
        conversionRate: values.conversionRate?.toString() || null,
        notes: values.notes,
      };

      if (transactionLine) {
        payload.walletLineId = transactionLine.id;
      } else if (values.assetId) {
        payload.assetId = values.assetId;
      }

      await http(`/wallets/${record.id}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      message.success("Transaction créée");
      setIsTransactionModalOpen(false);
      setTransactionLine(null);
      transactionForm.resetFields();
      invalidate({ resource: "wallets", invalidates: ["detail"], id: record.id });
    } catch (error) {
      message.error("Erreur lors de la création de la transaction");
      console.error(error);
    } finally {
      setSavingTransaction(false);
    }
  };

  const handleCancelTransaction = () => {
    setIsTransactionModalOpen(false);
    setTransactionLine(null);
    transactionForm.resetFields();
  };

  const handleDeleteLine = (line: WalletLine) => {
    modal.confirm({
      title: "Supprimer la ligne",
      content: `Êtes-vous sûr de vouloir supprimer la position ${line.asset?.symbol || ""} ? Cette action est irréversible.`,
      okText: "Supprimer",
      okType: "danger",
      cancelText: "Annuler",
      onOk: async () => {
        try {
          await http(`/wallet_lines/${line.id}`, {
            method: "DELETE",
          });
          message.success("Ligne supprimée");
          invalidate({ resource: "wallets", invalidates: ["detail"], id: record?.id });
        } catch (error) {
          message.error("Erreur lors de la suppression");
          console.error(error);
        }
      },
    });
  };

  return (
    <Show isLoading={isLoading}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Card>
          <Title level={5}>Nom</Title>
          <TextField value={record?.name} />
          <Title level={5}>Broker</Title>
          <TextField value={record?.brokerName} />
        </Card>

        <Card
          title="Positions du wallet"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleNewTransaction}
            >
              Transaction
            </Button>
          }
        >
          <Table
            dataSource={lines}
            rowKey="id"
            pagination={false}
            size="small"
            summary={() => {
              let totalBuyEur = 0;
              let totalCurrentEur = 0;

              lines.forEach((line) => {
                const quantity = parseFloat(line.quantity || "0");
                const buyPrice = parseFloat(line.buyPrice || "0");
                const lastPrice = parseFloat(line.asset?.lastPrice || "0");
                const rate = parseFloat(line.buyConversionRate || "1");

                totalBuyEur += quantity * buyPrice * rate;
                totalCurrentEur += quantity * lastPrice * rate;
              });

              const pnlNet = totalCurrentEur - totalBuyEur;
              const pnlPercent = totalBuyEur > 0 ? ((totalCurrentEur - totalBuyEur) / totalBuyEur) * 100 : 0;
              const isPositive = pnlNet >= 0;

              return (
                <Table.Summary.Row style={{ fontWeight: "bold", backgroundColor: "rgba(0,0,0,0.02)" }}>
                  <Table.Summary.Cell index={0} colSpan={4}>
                    <Typography.Text strong>Total ({lines.length} assets)</Typography.Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>
                    <NumberField value={totalBuyEur} /> €
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} />
                  <Table.Summary.Cell index={6}>
                    <NumberField value={totalCurrentEur} /> €
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={7}>
                    <Typography.Text type={isPositive ? "success" : "danger"} strong>
                      {isPositive ? "+" : ""}<NumberField value={pnlNet} /> €
                    </Typography.Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={8}>
                    <Typography.Text type={isPositive ? "success" : "danger"} strong>
                      {isPositive ? "+" : ""}{pnlPercent.toFixed(2)} %
                    </Typography.Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={9} />
                </Table.Summary.Row>
              );
            }}
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
              title="Lasso"
              render={(_: unknown, record: WalletLine) => {
                const score = getLassoScore(record.asset?.screenerAssets);
                return score !== null ? <NumberField value={score} options={{ maximumFractionDigits: 1 }} /> : "-";
              }}
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
              title="Prix actuel"
              render={(_, record: WalletLine) => {
                const lastPrice = record.asset?.lastPrice;
                if (!lastPrice) return "-";
                const price = parseFloat(lastPrice);
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
              title="Total actuel"
              render={(_, record: WalletLine) => {
                const quantity = parseFloat(record.quantity || "0");
                const lastPrice = parseFloat(record.asset?.lastPrice || "0");
                const total = quantity * lastPrice;
                if (!total) return "-";
                const rate = parseFloat(record.buyConversionRate || "1");
                const totalEur = total * rate;
                const isEur = record.currency === "EUR" || !record.currency;
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
              title="+/- net"
              render={(_, record: WalletLine) => {
                const quantity = parseFloat(record.quantity || "0");
                const buyPrice = parseFloat(record.buyPrice || "0");
                const lastPrice = parseFloat(record.asset?.lastPrice || "0");
                if (!quantity || !buyPrice || !lastPrice) return "-";
                const rate = parseFloat(record.buyConversionRate || "1");
                const totalBuy = quantity * buyPrice * rate;
                const totalCurrent = quantity * lastPrice * rate;
                const diff = totalCurrent - totalBuy;
                const isPositive = diff >= 0;
                return (
                  <Typography.Text type={isPositive ? "success" : "danger"}>
                    {isPositive ? "+" : ""}<NumberField value={diff} /> €
                  </Typography.Text>
                );
              }}
            />
            <Table.Column
              title="+/- %"
              render={(_, record: WalletLine) => {
                const buyPrice = parseFloat(record.buyPrice || "0");
                const lastPrice = parseFloat(record.asset?.lastPrice || "0");
                if (!buyPrice || !lastPrice) return "-";
                const percent = ((lastPrice - buyPrice) / buyPrice) * 100;
                const isPositive = percent >= 0;
                return (
                  <Typography.Text type={isPositive ? "success" : "danger"}>
                    {isPositive ? "+" : ""}{percent.toFixed(2)} %
                  </Typography.Text>
                );
              }}
            />
            <Table.Column
              title="Actions"
              render={(_, record: WalletLine) => (
                <Space>
                  {record.asset?.id && (
                    <>
                      <Link to={`/assets/show/${record.asset.id}?from=wallet:${data?.data?.id}`}>
                        <Button
                          type="text"
                          size="small"
                          icon={<EyeOutlined />}
                          title="Voir l'asset"
                        />
                      </Link>
                      <AddToWatchlistButton
                        assetId={record.asset.id}
                        assetSymbol={record.asset.symbol}
                        size="small"
                        type="text"
                      />
                    </>
                  )}
                  <Button
                    type="text"
                    size="small"
                    icon={<SwapOutlined />}
                    onClick={() => handleTransaction(record)}
                    title="Ajouter une transaction"
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(record)}
                    title="Éditer"
                  />
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteLine(record)}
                    title="Supprimer"
                  />
                </Space>
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

      <Modal
        title={transactionLine ? `Transaction - ${transactionLine.asset?.symbol || ""}` : "Nouvelle transaction"}
        open={isTransactionModalOpen}
        onOk={handleSaveTransaction}
        onCancel={handleCancelTransaction}
        confirmLoading={savingTransaction}
        okText="Créer"
        cancelText="Annuler"
        width={600}
      >
        <Form form={transactionForm} layout="vertical">
          {!transactionLine && (
            <Form.Item
              label="Asset"
              name="assetId"
              rules={[{ required: true, message: "Asset requis" }]}
            >
              <Select
                placeholder="Rechercher un asset par symbole"
                showSearch
                optionFilterProp="label"
                loading={assetsLoading}
                options={assets.map((a) => ({
                  value: a.id,
                  label: `${a.symbol} - ${a.name}`,
                }))}
              />
            </Form.Item>
          )}

          <Form.Item
            label="Type de transaction"
            name="transactionType"
            rules={[{ required: true, message: "Type requis" }]}
          >
            <Select
              placeholder="Sélectionner un type"
              options={transactionTypes
                .filter((t) => !["cash_deposit", "cash_withdrawal"].includes(t.value))
                .map((t) => ({
                  value: t.value,
                  label: t.label,
                }))}
            />
          </Form.Item>

          <Form.Item label="Date de transaction" name="transactionDate">
            <DatePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              placeholder="Sélectionner une date"
            />
          </Form.Item>

          <Space style={{ width: "100%", display: "flex" }} size="middle">
            <Form.Item label="Quantité" name="quantity" style={{ flex: 1 }}>
              <InputNumber style={{ width: "100%" }} step={0.0001} />
            </Form.Item>
            <Form.Item label="Prix unitaire" name="unitPrice" style={{ flex: 1 }}>
              <InputNumber style={{ width: "100%" }} step={0.01} />
            </Form.Item>
          </Space>

          <Space style={{ width: "100%", display: "flex" }} size="middle">
            <Form.Item label="Devise" name="currency" style={{ flex: 1 }}>
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
            <Form.Item label="Taux de conversion" name="conversionRate" style={{ flex: 1 }}>
              <InputNumber style={{ width: "100%" }} step={0.0001} />
            </Form.Item>
          </Space>

          <Form.Item label="Frais" name="fees">
            <InputNumber style={{ width: "100%" }} step={0.01} />
          </Form.Item>

          <Form.Item label="Notes" name="notes">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Show>
  );
};
