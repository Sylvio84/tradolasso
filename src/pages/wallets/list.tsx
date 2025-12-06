import {
  DateField,
  DeleteButton,
  EditButton,
  List,
  useTable,
} from "@refinedev/antd";
import { type BaseRecord } from "@refinedev/core";
import { Space, Table, Button } from "antd";
import { FolderOpenOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";

export const WalletList = () => {
  const navigate = useNavigate();
  const { tableProps } = useTable({
    syncWithLocation: true,
    pagination: {
      pageSize: 20,
    },
  });

  return (
    <List>
      <Table
        {...tableProps}
        rowKey="id"
        pagination={{
          ...tableProps.pagination,
          showTotal: (total) => `${total} résultat${total > 1 ? "s" : ""}`,
        }}
      >
        <Table.Column dataIndex="id" title={"ID"} />
        <Table.Column dataIndex="name" title={"Name"} />
          <Table.Column dataIndex="brokerName" title={"Broker"} />
        <Table.Column
          dataIndex={["createdAt"]}
          title={"Created at"}
          render={(value: any) => <DateField value={value} format="DD/MM/YYYY" />}
        />
        <Table.Column
          title={"Actions"}
          dataIndex="actions"
          render={(_, record: BaseRecord) => (
            <Space>
              <Button
                type="primary"
                size="small"
                icon={<FolderOpenOutlined />}
                onClick={() => navigate(`/wallets/show/${record.id}`)}
              >
                Ouvrir
              </Button>
              <EditButton hideText size="small" recordItemId={record.id} />
              <DeleteButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
