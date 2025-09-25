import { t } from "ttag";

import { getMaxDimensionsSupported } from "metabase/visualizations";
import { getOptionFromColumn } from "metabase/visualizations/lib/settings/utils";
import { isNumber, isString } from "metabase-lib/v1/types/utils/isa";
import type { DatasetColumn, Series } from "metabase-types/api";

import {
  getAllVisibleColumns,
  getDefaultColumnDimension,
  getDefaultRowColumns,
  getDefaultValueColumns,
} from "./utils";

const isColumnDimensionHidden = (series: any, settings: any) => {
  return !settings["sqlpivot.column_dimension"];
};

export const SQL_PIVOT_SETTINGS = {
  "sqlpivot.row_columns": {
    get section() {
      return t`Data`;
    },
    get title() {
      return t`Row dimensions`;
    },
    get description() {
      return t`Choose the columns to use as row headers`;
    },
    widget: "fields",
    getDefault: ([{ data }]: Series) => {
      return getDefaultRowColumns(data.cols);
    },
    getProps: ([{ data }]: Series, vizSettings: any) => {
      const addedRowColumns = vizSettings["sqlpivot.row_columns"] || [];
      const options = data.cols
        .filter((col: DatasetColumn) => isString(col))
        .map((col: DatasetColumn) => getOptionFromColumn(col));

      const maxRowDimensions = getMaxDimensionsSupported("sql_pivot");
      return {
        options,
        addAnother:
          options.length > addedRowColumns.length &&
          addedRowColumns.length < maxRowDimensions &&
          addedRowColumns.every(
            (column: any) => column !== undefined && column !== null,
          )
            ? t`Add another dimension`
            : null,
        columns: data.cols,
        fieldSettingWidgets: [],
        showColumnSettingForIndices: [0],
      };
    },
    persistDefault: true,
    useRawSeries: true,
  },

  "sqlpivot.column_dimension": {
    get section() {
      return t`Data`;
    },
    get title() {
      return t`Column dimension`;
    },
    get description() {
      return t`Choose the column to spread across columns (for matrix view)`;
    },
    widget: "select",
    getDefault: ([{ data }]: Series) => {
      return getDefaultColumnDimension(data.cols);
    },
    getProps: ([{ data }]: Series) => ({
      options: [
        { name: t`None`, value: null },
        ...data.cols
          .filter((col: DatasetColumn) => isString(col))
          .map((col: DatasetColumn) => getOptionFromColumn(col)),
      ],
    }),
    useRawSeries: true,
  },

  "sqlpivot.value_columns": {
    get section() {
      return t`Data`;
    },
    get title() {
      return t`Value columns`;
    },
    get description() {
      return t`Choose the columns to use as values in the pivot`;
    },
    widget: "select",
    props: {
      multi: true,
    },
    getDefault: ([{ data }]: Series) => {
      return getDefaultValueColumns(data.cols);
    },
    getProps: ([{ data }]: Series) => ({
      options: data.cols
        .filter((col: DatasetColumn) => isNumber(col))
        .map((col: DatasetColumn) => getOptionFromColumn(col)),
    }),
    useRawSeries: true,
  },

  "sqlpivot.transpose": {
    get section() {
      return t`Display`;
    },
    get title() {
      return t`Transpose layout`;
    },
    get description() {
      return t`Switch rows and columns in the pivot table`;
    },
    widget: "toggle",
    inline: true,
    default: false,
  },

  "sqlpivot.show_row_aggregation": {
    get section() {
      return t`Display`;
    },
    get title() {
      return t`Show row aggregation`;
    },
    get description() {
      return t`Add a column showing the average score for each row`;
    },
    widget: "toggle",
    inline: true,
    default: false,
    getHidden: isColumnDimensionHidden,
  },

  "sqlpivot.show_column_aggregation": {
    get section() {
      return t`Display`;
    },
    get title() {
      return t`Show column aggregation`;
    },
    get description() {
      return t`Add a row showing the average score for each column`;
    },
    widget: "toggle",
    inline: true,
    default: false,
    getHidden: isColumnDimensionHidden,
  },

  "sqlpivot.hidden_column_labels": {
    get section() {
      return t`Display`;
    },
    get title() {
      return t`Hide labels for columns`;
    },
    get description() {
      return t`Select columns for which you want to hide the column labels`;
    },
    widget: "multiselect",
    getValue: (_rawSeries: Series, settings: any) => {
      return settings["sqlpivot.hidden_column_labels"] ?? [];
    },
    getProps: ([{ data }]: Series, settings: any) => {
      try {
        // Get all visible columns from current pivot configuration
        const visibleColumns = getAllVisibleColumns(data, settings);
        return {
          placeholder: t`Select columns to hide labels...`,
          options: visibleColumns.map((col: DatasetColumn) => ({
            label: col.display_name || col.name,
            value: col.name,
          })),
        };
      } catch (error) {
        // Fallback to original data columns if transformation fails
        console.warn(
          "Failed to get visible columns, using original data columns:",
          error,
        );
        return {
          placeholder: t`Select columns to hide labels...`,
          options: data.cols.map((col: DatasetColumn) => ({
            label: col.display_name || col.name,
            value: col.name,
          })),
        };
      }
    },
    useRawSeries: true,
  },

  "sqlpivot.enable_color_coding": {
    get section() {
      return t`Display`;
    },
    get title() {
      return t`Enable color coding`;
    },
    get description() {
      return t`Apply color coding to numeric values based on configurable thresholds`;
    },
    widget: "toggle",
    inline: true,
    default: false,
  },

  "sqlpivot.color_scheme": {
    get section() {
      return t`Display`;
    },
    get title() {
      return t`Color scheme`;
    },
    get description() {
      return t`Choose a color scheme for the numeric values`;
    },
    widget: "select",
    getDefault: () => "score",
    getProps: () => ({
      options: [
        { name: t`Score-based (Blue/Green/Yellow)`, value: "score" },
        { name: t`Traffic Light (Red/Yellow/Green)`, value: "traffic" },
        { name: t`Heat Map (Red to Blue)`, value: "heat" },
        { name: t`Custom`, value: "custom" },
      ],
    }),
    getHidden: (series: Series, settings: any) => {
      return !settings["sqlpivot.enable_color_coding"];
    },
  },

  "sqlpivot.color_thresholds": {
    get section() {
      return t`Display`;
    },
    get title() {
      return t`Custom thresholds`;
    },
    get description() {
      return t`Set custom threshold values for color transitions (comma-separated, e.g., "70,85")`;
    },
    widget: "input",
    getDefault: () => "78.6,92.9",
    getHidden: (series: Series, settings: any) => {
      return (
        !settings["sqlpivot.enable_color_coding"] ||
        settings["sqlpivot.color_scheme"] !== "custom"
      );
    },
  },

  "sqlpivot.color_range_type": {
    get section() {
      return t`Display`;
    },
    get title() {
      return t`Range calculation`;
    },
    get description() {
      return t`How to calculate the color range`;
    },
    widget: "select",
    getDefault: () => "auto",
    getProps: () => ({
      options: [
        { name: t`Auto (use data min/max)`, value: "auto" },
        { name: t`Custom range`, value: "custom" },
      ],
    }),
    getHidden: (series: Series, settings: any) => {
      return !settings["sqlpivot.enable_color_coding"];
    },
  },

  "sqlpivot.color_min_value": {
    get section() {
      return t`Display`;
    },
    get title() {
      return t`Minimum value`;
    },
    get description() {
      return t`Minimum value for color range (used when range calculation is set to custom)`;
    },
    widget: "number",
    getDefault: () => 0,
    getHidden: (series: Series, settings: any) => {
      return (
        !settings["sqlpivot.enable_color_coding"] ||
        settings["sqlpivot.color_range_type"] !== "custom"
      );
    },
  },

  "sqlpivot.color_max_value": {
    get section() {
      return t`Display`;
    },
    get title() {
      return t`Maximum value`;
    },
    get description() {
      return t`Maximum value for color range (used when range calculation is set to custom)`;
    },
    widget: "number",
    getDefault: () => 100,
    getHidden: (series: Series, settings: any) => {
      return (
        !settings["sqlpivot.enable_color_coding"] ||
        settings["sqlpivot.color_range_type"] !== "custom"
      );
    },
  },
};
