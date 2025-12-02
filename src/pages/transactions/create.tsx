import { Create } from "@refinedev/antd";
import { useList } from "@refinedev/core";
import {
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  message,
  Space,
} from "antd";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { http } from "../../providers/hydra";

const { TextArea } = Input;

interface Wallet {
  id: number;
  name: string;
  brokerName?: string;
}

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

interface WalletLine {
  id: number;
  asset?: {
    id: number;
    symbol: string;
    name: string;
  };
}

export const TransactionCreate = () => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [walletLines, setWalletLines] = useState<WalletLine[]>([]);
  const [walletLinesLoading, setWalletLinesLoading] = useState(false);
  const [useExistingPosition, setUseExistingPosition] = useState(false);
  const navigate = useNavigate();

  const { query: walletsQuery } = useList<Wallet>({
    resource: "wallets",
    pagination: { mode: "off" },
  });

  const wallets = walletsQuery.data?.data || [];
  const walletsLoading = walletsQuery.isLoading;

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
    const loadAssets = async () => {
      setAssetsLoading(true);
      try {
        const { data } = await http("/assets?pagination=false");
        setAssets(data.member || []);
      } catch (error) {
        console.error("Erreur chargement assets:", error);
      } finally {
        setAssetsLoading(false);
      }
    };
    loadCurrencies();
    loadTransactionTypes();
    loadAssets();
  }, []);

  const handleWalletChange = async (walletId: number) => {
    form.setFieldValue("walletLineId", undefined);
    setWalletLines([]);
    if (walletId) {
      setWalletLinesLoading(true);
      try {
        const { data } = await http(`/wallets/${walletId}/lines`);
        setWalletLines(data.member || []);
      } catch (error) {
        console.error("Erreur chargement positions:", error);
      } finally {
        setWalletLinesLoading(false);
      }
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();

      const walletId = values.walletId;
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

      if (useExistingPosition && values.walletLineId) {
        payload.walletLineId = values.walletLineId;
      } else if (values.assetId) {
        payload.assetId = values.assetId;
      }

      await http(`/wallets/${walletId}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      message.success("Transaction créée");
      navigate("/transactions");
    } catch (error) {
      message.error("Erreur lors de la création de la transaction");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Create
      saveButtonProps={{
        onClick: handleSave,
        loading: saving,
      }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          currency: "EUR",
          conversionRate: 1,
          transactionType: "buy",
        }}
      >
        <Form.Item
          label="Wallet"
          name="walletId"
          rules={[{ required: true, message: "Wallet requis" }]}
        >
          <Select
            placeholder="Sélectionner un wallet"
            loading={walletsLoading}
            showSearch
            optionFilterProp="label"
            onChange={handleWalletChange}
            options={wallets.map((w) => ({
              value: w.id,
              label: `${w.name}${w.brokerName ? ` (${w.brokerName})` : ""}`,
            }))}
          />
        </Form.Item>

        <Form.Item label="Type de position">
          <Select
            value={useExistingPosition ? "existing" : "new"}
            onChange={(v) => setUseExistingPosition(v === "existing")}
            options={[
              { value: "new", label: "Nouvel asset" },
              { value: "existing", label: "Position existante" },
            ]}
          />
        </Form.Item>

        {useExistingPosition ? (
          <Form.Item
            label="Position existante"
            name="walletLineId"
            rules={[{ required: true, message: "Position requise" }]}
          >
            <Select
              placeholder="Sélectionner une position"
              loading={walletLinesLoading}
              showSearch
              optionFilterProp="label"
              options={walletLines.map((line) => ({
                value: line.id,
                label: line.asset
                  ? `${line.asset.symbol} - ${line.asset.name}`
                  : `Position #${line.id}`,
              }))}
            />
          </Form.Item>
        ) : (
          <Form.Item
            label="Asset"
            name="assetId"
            rules={[{ required: true, message: "Asset requis" }]}
          >
            <Select
              placeholder="Rechercher un asset"
              loading={assetsLoading}
              showSearch
              optionFilterProp="label"
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
    </Create>
  );
};
