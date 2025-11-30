import {
  DateField,
  DeleteButton,
  EditButton,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { type BaseRecord } from "@refinedev/core";
import { Space, Table, Tag } from "antd";

const ASSET_TYPE_COLORS: Record<string, string> = {
  stock: "blue",
  fund: "green",
  bond: "orange",
  crypto: "purple",
  commodity: "gold",
  real_estate: "cyan",
  forex: "magenta",
  cash_account: "default",
};

export const AssetList = () => {
  const { tableProps } = useTable({
    syncWithLocation: true,
  });

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" width={80} />
        <Table.Column dataIndex="symbol" title="Symbol" />
        <Table.Column dataIndex="name" title="Name" />
        <Table.Column dataIndex="isin" title="ISIN" />
        <Table.Column
          dataIndex="type"
          title="Type"
          render={(value: string) =>
            value ? (
              <Tag color={ASSET_TYPE_COLORS[value] || "default"}>{value}</Tag>
            ) : (
              "-"
            )
          }
        />
        <Table.Column dataIndex="currency" title="Currency" />
        <Table.Column dataIndex="countryCode" title="Country" />
        <Table.Column
          dataIndex="createdAt"
          title="Created"
          render={(value: string) => <DateField value={value} format="DD/MM/YYYY" />}
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
