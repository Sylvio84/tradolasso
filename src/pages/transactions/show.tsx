import { DateField, NumberField, Show, ShowButton } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Card, Descriptions, Space, Tag, Typography } from "antd";
import { useEffect } from "react";

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
  totalValue: string | null;
  totalValueEur: string | null;
  createdAt: string | null;
  createdBy: string | null;
  walletLine?: {
    id: number;
    wallet?: {
      id: number;
      name: string;
    };
  } | null;
  asset?: {
    id: number;
    symbol: string;
    name: string;
  } | null;
}

const TRANSACTION_TYPE_COLORS: Record<string, string> = {
  buy: "green",
  sell: "red",
  dividend: "gold",
  cash_deposit: "blue",
  cash_withdrawal: "orange",
  fees: "default",
  interest: "cyan",
  stock_split: "purple",
  value_update: "magenta",
};

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  buy: "Achat",
  sell: "Vente",
  dividend: "Dividende",
  cash_deposit: "Dépôt",
  cash_withdrawal: "Retrait",
  fees: "Frais",
  interest: "Intérêts",
  stock_split: "Split",
  value_update: "Mise à jour",
};

export const TransactionShow = () => {
  const {
    query: { data, isLoading },
  } = useShow<WalletTransaction>({});

  const record = data?.data;

  useEffect(() => {
    if (record) {
      const type = record.transactionType ? TRANSACTION_TYPE_LABELS[record.transactionType] || record.transactionType : "Transaction";
      const asset = record.asset?.symbol || "";
      document.title = asset ? `${type} ${asset} | Transaction` : `${type} | Transaction`;
    }
  }, [record]);

  return (
    <Show isLoading={isLoading}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Card title="Informations générales">
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="ID">{record?.id}</Descriptions.Item>
            <Descriptions.Item label="Type">
              {record?.transactionType ? (
                <Tag
                  color={
                    TRANSACTION_TYPE_COLORS[record.transactionType] || "default"
                  }
                >
                  {TRANSACTION_TYPE_LABELS[record.transactionType] ||
                    record.transactionType}
                </Tag>
              ) : (
                "-"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Date de transaction">
              {record?.transactionDate ? (
                <DateField
                  value={record.transactionDate}
                  format="DD/MM/YYYY"
                />
              ) : (
                "-"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Créé le">
              {record?.createdAt ? (
                <DateField value={record.createdAt} format="DD/MM/YYYY HH:mm" />
              ) : (
                "-"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Créé par">
              {record?.createdBy || "-"}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="Asset et Wallet">
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Asset">
              {record?.asset ? (
                <Space>
                  <span>
                    <strong>{record.asset.symbol}</strong> - {record.asset.name}
                  </span>
                  <ShowButton
                    hideText
                    size="small"
                    resource="assets"
                    recordItemId={record.asset.id}
                  />
                </Space>
              ) : (
                "-"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Wallet">
              {record?.walletLine?.wallet ? (
                <Space>
                  <span>{record.walletLine.wallet.name}</span>
                  <ShowButton
                    hideText
                    size="small"
                    resource="wallets"
                    recordItemId={record.walletLine.wallet.id}
                  />
                </Space>
              ) : (
                "-"
              )}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="Détails de la transaction">
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Quantité">
              {record?.quantity ? <NumberField value={record.quantity} /> : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Prix unitaire">
              {record?.unitPrice ? (
                <span>
                  <NumberField value={record.unitPrice} />{" "}
                  {record.currency || "EUR"}
                </span>
              ) : (
                "-"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Total">
              {record?.totalValue ? (
                <span>
                  <NumberField value={record.totalValue} />{" "}
                  {record.currency || "EUR"}
                </span>
              ) : (
                "-"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Total (EUR)">
              {record?.totalValueEur ? (
                <Typography.Text strong>
                  <NumberField value={record.totalValueEur} /> €
                </Typography.Text>
              ) : (
                "-"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Frais">
              {record?.fees && parseFloat(record.fees) !== 0 ? (
                <span>
                  <NumberField value={record.fees} />{" "}
                  {record.currency || "EUR"}
                </span>
              ) : (
                "-"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Taux de conversion">
              {record?.conversionRate ? (
                <NumberField value={record.conversionRate} />
              ) : (
                "-"
              )}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {record?.notes && (
          <Card title="Notes">
            <Typography.Paragraph>{record.notes}</Typography.Paragraph>
          </Card>
        )}
      </Space>
    </Show>
  );
};
