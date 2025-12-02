import {
  DateField,
  DeleteButton,
  EditButton,
  List,
  NumberField,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { type BaseRecord } from "@refinedev/core";
import { Space, Table, Tag, Typography } from "antd";

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

export const TransactionList = () => {
  const { tableProps } = useTable<WalletTransaction>({
    syncWithLocation: true,
    sorters: {
      initial: [{ field: "transactionDate", order: "desc" }],
    },
  });

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" width={70} />
        <Table.Column
          dataIndex="transactionDate"
          title="Date"
          render={(value: string | null) =>
            value ? <DateField value={value} format="DD/MM/YYYY" /> : "-"
          }
          sorter
        />
        <Table.Column
          dataIndex="transactionType"
          title="Type"
          render={(value: string | null) =>
            value ? (
              <Tag color={TRANSACTION_TYPE_COLORS[value] || "default"}>
                {TRANSACTION_TYPE_LABELS[value] || value}
              </Tag>
            ) : (
              "-"
            )
          }
        />
        <Table.Column
          title="Asset"
          render={(_, record: WalletTransaction) => {
            const asset = record.asset;
            if (!asset) return "-";
            return (
              <span>
                <strong>{asset.symbol}</strong>{" "}
                <Typography.Text type="secondary">({asset.name})</Typography.Text>
              </span>
            );
          }}
        />
        <Table.Column
          title="Wallet"
          render={(_, record: WalletTransaction) => {
            const wallet = record.walletLine?.wallet;
            if (!wallet) return "-";
            return wallet.name;
          }}
        />
        <Table.Column
          dataIndex="quantity"
          title="Quantité"
          align="right"
          render={(value: string | null) =>
            value ? <NumberField value={value} /> : "-"
          }
        />
        <Table.Column
          dataIndex="unitPrice"
          title="Prix unitaire"
          align="right"
          render={(value: string | null, record: WalletTransaction) => {
            if (!value) return "-";
            return (
              <span>
                <NumberField value={value} /> {record.currency || "EUR"}
              </span>
            );
          }}
        />
        <Table.Column
          dataIndex="totalValueEur"
          title="Total (EUR)"
          align="right"
          render={(value: string | null) =>
            value ? (
              <span>
                <NumberField value={value} /> €
              </span>
            ) : (
              "-"
            )
          }
        />
        <Table.Column
          dataIndex="fees"
          title="Frais"
          align="right"
          render={(value: string | null, record: WalletTransaction) => {
            if (!value || parseFloat(value) === 0) return "-";
            return (
              <span>
                <NumberField value={value} /> {record.currency || "EUR"}
              </span>
            );
          }}
        />
        <Table.Column
          dataIndex="createdAt"
          title="Créé le"
          render={(value: string | null) =>
            value ? <DateField value={value} format="DD/MM/YYYY HH:mm" /> : "-"
          }
        />
        <Table.Column
          title="Actions"
          dataIndex="actions"
          render={(_, record: BaseRecord) => (
            <Space>
              <ShowButton hideText size="small" recordItemId={record.id} />
              <EditButton hideText size="small" recordItemId={record.id} />
              <DeleteButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
