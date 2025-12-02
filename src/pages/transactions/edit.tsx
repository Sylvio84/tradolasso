import { Edit, useForm } from "@refinedev/antd";
import { useList } from "@refinedev/core";
import {
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Space,
} from "antd";
import { useState, useEffect } from "react";
import { http } from "../../providers/hydra";
import dayjs from "dayjs";

const { TextArea } = Input;

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
}

interface WalletTransaction {
  id: number;
  transactionType: string | null;
  transactionDate: string | null;
  quantity: string | null;
  unitPrice: string | null;
  fees: string | null;
  currency: string | null;
  conversionRate: string | null;
  notes: string | null;
  asset?: {
    id: number;
    symbol: string;
    name: string;
  } | null;
  walletLine?: {
    id: number;
    wallet?: {
      id: number;
      name: string;
    };
  } | null;
}

export const TransactionEdit = () => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);

  const { formProps, saveButtonProps, query } = useForm<WalletTransaction>({
    resource: "wallet_transactions",
  });

  const record = query?.data?.data;

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

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form
        {...formProps}
        layout="vertical"
        onFinish={(values: Record<string, unknown>) => {
          const transactionDate = values.transactionDate as { toISOString?: () => string } | string | null;
          const payload = {
            ...values,
            transactionDate: typeof transactionDate === 'object' && transactionDate?.toISOString
              ? transactionDate.toISOString()
              : transactionDate,
            quantity: values.quantity?.toString() || null,
            unitPrice: values.unitPrice?.toString() || null,
            fees: values.fees?.toString() || null,
            conversionRate: values.conversionRate?.toString() || null,
          };
          return formProps.onFinish?.(payload);
        }}
      >
        <Form.Item label="Wallet" >
          <Input
            disabled
            value={record?.walletLine?.wallet?.name || "-"}
          />
        </Form.Item>

        <Form.Item label="Asset">
          <Select
            disabled
            value={record?.asset?.id}
            loading={assetsLoading}
            showSearch
            optionFilterProp="label"
            options={assets.map((a) => ({
              value: a.id,
              label: `${a.symbol} - ${a.name}`,
            }))}
          />
        </Form.Item>

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

        <Form.Item
          label="Date de transaction"
          name="transactionDate"
          getValueProps={(value) => ({
            value: value ? dayjs(value) : null,
          })}
        >
          <DatePicker
            style={{ width: "100%" }}
            format="DD/MM/YYYY"
            placeholder="Sélectionner une date"
          />
        </Form.Item>

        <Space style={{ width: "100%", display: "flex" }} size="middle">
          <Form.Item
            label="Quantité"
            name="quantity"
            style={{ flex: 1 }}
            getValueProps={(value) => ({
              value: value ? parseFloat(value) : null,
            })}
          >
            <InputNumber style={{ width: "100%" }} step={0.0001} />
          </Form.Item>
          <Form.Item
            label="Prix unitaire"
            name="unitPrice"
            style={{ flex: 1 }}
            getValueProps={(value) => ({
              value: value ? parseFloat(value) : null,
            })}
          >
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
          <Form.Item
            label="Taux de conversion"
            name="conversionRate"
            style={{ flex: 1 }}
            getValueProps={(value) => ({
              value: value ? parseFloat(value) : null,
            })}
          >
            <InputNumber style={{ width: "100%" }} step={0.0001} />
          </Form.Item>
        </Space>

        <Form.Item
          label="Frais"
          name="fees"
          getValueProps={(value) => ({
            value: value ? parseFloat(value) : null,
          })}
        >
          <InputNumber style={{ width: "100%" }} step={0.01} />
        </Form.Item>

        <Form.Item label="Notes" name="notes">
          <TextArea rows={3} />
        </Form.Item>
      </Form>
    </Edit>
  );
};
