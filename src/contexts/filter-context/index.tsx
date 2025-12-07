import React, { createContext, useContext, useCallback, useRef, useState } from "react";
import type { FormProps } from "antd";

interface FilterContextValue {
  registerFilter: (route: string, formProps: FormProps, onReset: () => void) => void;
  unregisterFilter: (route: string) => void;
  getFilterProps: (route: string) => { formProps?: FormProps; onReset?: () => void };
  siderVisible: boolean;
  setSiderVisible: (visible: boolean) => void;
}

const FilterContext = createContext<FilterContextValue | undefined>(undefined);

interface FilterRegistration {
  formProps: FormProps;
  onReset: () => void;
}

export const FilterContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const filtersRef = useRef<Map<string, FilterRegistration>>(new Map());
  const [siderVisible, setSiderVisible] = useState(true);

  const registerFilter = useCallback(
    (route: string, formProps: FormProps, onReset: () => void) => {
      filtersRef.current.set(route, { formProps, onReset });
    },
    []
  );

  const unregisterFilter = useCallback((route: string) => {
    filtersRef.current.delete(route);
  }, []);

  const getFilterProps = useCallback((route: string) => {
    const registration = filtersRef.current.get(route);
    if (!registration) {
      return {};
    }
    return {
      formProps: registration.formProps,
      onReset: registration.onReset,
    };
  }, []);

  const value: FilterContextValue = {
    registerFilter,
    unregisterFilter,
    getFilterProps,
    siderVisible,
    setSiderVisible,
  };

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
};

export const useFilterContext = (): FilterContextValue => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error(
      "useFilterContext must be used within a FilterContextProvider"
    );
  }
  return context;
};
