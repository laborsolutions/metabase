import { t } from "ttag";

import {
  getDefaultSize,
  getMinSize,
} from "metabase/visualizations/shared/utils/sizes";
import type {
  VisualizationDefinition,
  VisualizationSettingsDefinitions,
} from "metabase/visualizations/types";

export const SURVEY_QUESTION_DEFINITION: VisualizationDefinition = {
  getUiName: () => "Survey Question",
  identifier: "survey_question",
  iconName: "bar",
  noun: "survey question chart",
  minSize: getMinSize("bar"),
  defaultSize: getDefaultSize("bar"),
  checkRenderable: () => true,
  isSensible: () => true,
  settings: {
    "survey.response_column": {
      get section() {
        return t`Data`;
      },
      get title() {
        return t`Response Column`;
      },
      widget: "fields",
      isValid: (series, settings) => {
        const responseColumn = settings["survey.response_column"];
        return responseColumn != null;
      },
      getDefault: ([{ data }]) => {
        // Try to find the best default response column
        const responseCol = data.cols.find(
          (col) =>
            col.name === "option_label" ||
            col.name === "answer" ||
            col.name === "response" ||
            col.semantic_type === "type/Category" ||
            col.base_type === "type/Text",
        );
        return responseCol ? [responseCol.name] : [];
      },
      getProps: ([{ data }]) => ({
        addedItemsAreUnique: true,
        options: data.cols
          .filter(
            (col) =>
              col.base_type === "type/Text" ||
              col.semantic_type === "type/Category",
          )
          .map((col) => ({
            name: col.display_name || col.name,
            value: col.name,
          })),
      }),
    },
    "survey.count_column": {
      get section() {
        return t`Data`;
      },
      get title() {
        return t`Count Column`;
      },
      widget: "fields",
      isValid: (series, settings) => {
        const countColumn = settings["survey.count_column"];
        return countColumn != null;
      },
      getDefault: ([{ data }]) => {
        // Try to find the best default count column
        const countCol = data.cols.find(
          (col) =>
            col.name === "count" ||
            col.name === "response_count" ||
            col.name === "total" ||
            col.semantic_type === "type/Number" ||
            col.base_type === "type/Integer" ||
            col.base_type === "type/BigInteger" ||
            col.base_type === "type/Float",
        );
        return countCol ? [countCol.name] : [];
      },
      getProps: ([{ data }]) => ({
        addedItemsAreUnique: true,
        options: data.cols
          .filter(
            (col) =>
              col.semantic_type === "type/Number" ||
              col.base_type === "type/Integer" ||
              col.base_type === "type/BigInteger" ||
              col.base_type === "type/Float",
          )
          .map((col) => ({
            name: col.display_name || col.name,
            value: col.name,
          })),
      }),
    },
    "survey.show_percentages": {
      title: "Show percentages",
      default: true,
      widget: "toggle",
    },
    "survey.show_counts": {
      title: "Show response counts",
      default: true,
      widget: "toggle",
    },
    "survey.default_chart_type": {
      title: "Default chart type",
      default: "bar",
      widget: "select",
      props: {
        options: [
          { name: "Bar Chart", value: "bar" },
          { name: "Pie Chart", value: "pie" },
        ],
      },
    },
    "survey.show_total": {
      title: "Show total responses",
      default: true,
      widget: "toggle",
    },
  } as VisualizationSettingsDefinitions,
  canSavePng: true,
};
