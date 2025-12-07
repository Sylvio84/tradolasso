import { Card } from "antd";
import type { ReactNode } from "react";

interface FilterContainerProps {
  title?: string;
  extra?: ReactNode;
  children: ReactNode;
}

export const FilterContainer: React.FC<FilterContainerProps> = ({
  title = "Filtres",
  extra,
  children,
}) => {
  return (
    <Card
      title={title}
      size="small"
      style={{ width: "100%", height: "fit-content" }}
      extra={extra}
      bodyStyle={{ padding: 16 }}
    >
      {children}
    </Card>
  );
};
