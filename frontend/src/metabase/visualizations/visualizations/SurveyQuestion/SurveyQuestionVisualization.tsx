import { useMemo, useState } from "react";
import { t } from "ttag";

import {
  Box,
  Flex,
  Group,
  Icon,
  SegmentedControl,
  Stack,
  Text,
} from "metabase/ui";
import { getComputedSettingsForSeries } from "metabase/visualizations/lib/settings/visualization";
import type { VisualizationProps } from "metabase/visualizations/types";
import type { DatasetColumn, DatasetData, RawSeries } from "metabase-types/api";

import { BarChart } from "../BarChart";
import { PieChart } from "../PieChart";

import { SurveyHorizontalBar } from "./SurveyHorizontalBar";

interface ProcessedData {
  labels: string[];
  values: number[];
  percentages: number[];
  counts: number[];
  total: number;
  questionTitle: string;
  actualQuestionText?: string;
  category?: string;
}

const processQuestionData = (
  data: DatasetData,
  responseColumnName?: string,
  countColumnName?: string,
): ProcessedData => {
  let responseCol = -1;
  let countCol = -1;
  let questionTitleCol = -1;

  // First, check if we have a question_title column
  questionTitleCol = data.cols.findIndex(
    (col) => col.name === "question_title",
  );

  if (responseColumnName && countColumnName) {
    // Use the columns specified in settings
    responseCol = data.cols.findIndex((col) => col.name === responseColumnName);
    countCol = data.cols.findIndex((col) => col.name === countColumnName);
  } else {
    // Fallback to original hardcoded logic for backward compatibility
    responseCol = data.cols.findIndex(
      (col) =>
        col.name === "option_label" ||
        col.name === "answer" ||
        col.name === "response",
    );
    countCol = data.cols.findIndex(
      (col) =>
        col.name === "count" ||
        col.name === "response_count" ||
        col.name === "total",
    );
  }

  if (responseCol === -1 || countCol === -1) {
    return {
      labels: [],
      values: [],
      percentages: [],
      counts: [],
      total: 0,
      questionTitle: "",
      actualQuestionText: undefined,
      category: undefined,
    };
  }

  const labels: string[] = [];
  const counts: number[] = [];
  let actualQuestionText: string | undefined;

  data.rows.forEach((row, index) => {
    labels.push(String(row[responseCol]));
    counts.push(Number(row[countCol]) || 0);
    // Extract the actual question text from the first row if available
    if (index === 0 && questionTitleCol !== -1) {
      actualQuestionText = String(row[questionTitleCol]);
    }
  });

  const total = counts.reduce((sum, count) => sum + count, 0);
  const percentages = counts.map((count) =>
    total > 0 ? Math.round((count / total) * 100) : 0,
  );

  const questionTitle =
    data.cols[responseCol]?.display_name ||
    data.cols[responseCol]?.name ||
    "Survey Question";

  return {
    labels,
    values: counts,
    percentages,
    counts,
    total,
    questionTitle,
    actualQuestionText,
    category: undefined,
  };
};

const createBarChartData = (
  processedData: ProcessedData,
  originalData: DatasetData,
) => {
  // Create a proper column structure based on the original columns
  // Use first column as template, or create a minimal column if none exists
  const templateCol = originalData.cols[0] || {
    name: "",
    display_name: "",
    source: "fields" as const,
    base_type: "type/Text" as const,
  };

  const responseCol = {
    ...templateCol, // Copy properties from template column
    name: "response",
    display_name: "Response",
    base_type: "type/Text" as const,
    semantic_type: "type/Category" as const,
    source: "fields" as const,
    field_ref: ["field", "response", { "base-type": "type/Text" }],
  } satisfies DatasetColumn;

  const countCol = {
    ...templateCol, // Copy properties from template column
    name: "count",
    display_name: "Count",
    base_type: "type/Integer" as const,
    semantic_type: "type/Number" as const,
    source: "fields" as const,
    field_ref: ["field", "count", { "base-type": "type/Integer" }],
  } satisfies DatasetColumn;

  const percentageCol = {
    ...templateCol, // Copy properties from template column
    name: "percentage",
    display_name: "Percentage",
    base_type: "type/Float" as const,
    semantic_type: "type/Percentage" as const,
    source: "fields" as const,
    field_ref: ["field", "percentage", { "base-type": "type/Float" }],
  } satisfies DatasetColumn;

  return {
    ...originalData,
    cols: [responseCol, countCol, percentageCol],
    rows: processedData.labels.map((label, i) => [
      label,
      processedData.counts[i],
      processedData.percentages[i],
    ]),
  };
};

const createPieChartData = (
  processedData: ProcessedData,
  originalData: DatasetData,
) => {
  // Create a proper column structure based on the original columns
  // Use first column as template, or create a minimal column if none exists
  const templateCol = originalData.cols[0] || {
    name: "",
    display_name: "",
    source: "fields" as const,
    base_type: "type/Text" as const,
  };

  const responseCol = {
    ...templateCol, // Copy properties from template column
    name: "response",
    display_name: "Response",
    base_type: "type/Text" as const,
    semantic_type: "type/Category" as const,
    source: "fields" as const,
    field_ref: ["field", "response", { "base-type": "type/Text" }],
  } satisfies DatasetColumn;

  const countCol = {
    ...templateCol, // Copy properties from template column
    name: "count",
    display_name: "Count",
    base_type: "type/Integer" as const,
    semantic_type: "type/Number" as const,
    source: "fields" as const,
    field_ref: ["field", "count", { "base-type": "type/Integer" }],
  } satisfies DatasetColumn;

  return {
    ...originalData,
    cols: [responseCol, countCol],
    rows: processedData.labels.map((label, i) => [
      label,
      processedData.counts[i],
    ]),
  };
};

export function SurveyQuestionVisualization(props: VisualizationProps) {
  const [viewType, setViewType] = useState<"horizontal" | "bar" | "pie">(
    "horizontal",
  );
  const { rawSeries, settings = {}, card } = props;

  const processedData = useMemo(() => {
    if (!rawSeries?.[0]?.data) {
      return null;
    }

    // Get column mappings from settings
    const responseColumnName = settings["survey.response_column"]?.[0];
    const countColumnName = settings["survey.count_column"]?.[0];

    return processQuestionData(
      rawSeries[0].data,
      responseColumnName,
      countColumnName,
    );
  }, [rawSeries, settings]);

  const transformedSeries = useMemo<RawSeries>(() => {
    if (!processedData || processedData.labels.length === 0) {
      return [];
    }
    const originalData = rawSeries[0]?.data;
    if (!originalData) {
      return [];
    }
    const chartData =
      viewType === "pie"
        ? createPieChartData(processedData, originalData)
        : createBarChartData(processedData, originalData);

    // Prepare the proper visualization settings for each chart type
    const chartVisualizationSettings =
      viewType === "pie"
        ? {
            ...settings,
            "pie.dimension": "response",
            "pie.metric": "count",
            "pie.show_legend": true,
            "pie.show_total": true,
          }
        : {
            ...settings,
            "graph.dimensions": ["response"],
            "graph.metrics": ["count"],
            "graph.show_values": true,
            "graph.x_axis.title_text": "",
            "graph.y_axis.title_text": "Responses",
          };

    return [
      {
        ...rawSeries[0],
        data: chartData,
        card: {
          ...card,
          display: viewType === "horizontal" ? "bar" : viewType,
          visualization_settings: chartVisualizationSettings,
        },
      },
    ];
  }, [processedData, viewType, rawSeries, card, settings]);

  // Compute settings for the transformed series
  const computedSettings = useMemo(() => {
    if (transformedSeries.length === 0) {
      return settings;
    }
    return getComputedSettingsForSeries(transformedSeries);
  }, [transformedSeries, settings]);

  if (!processedData || processedData.labels.length === 0) {
    return (
      <Flex align="center" justify="center" h="100%">
        <Text c="text-medium">{t`No survey data available`}</Text>
      </Flex>
    );
  }

  const totalResponses = processedData.total;

  return (
    <Stack h="100%" gap="md" p="lg">
      <Group justify="space-between" align="flex-start">
        <Box>
          <Text size="sm" fw={600} c="text-dark" mb={4}>
            {t`QUESTION RESULTS`}
          </Text>
          {processedData.actualQuestionText && (
            <Text size="md" c="text-dark" mb={8}>
              {processedData.actualQuestionText}
            </Text>
          )}
          {processedData.category && (
            <Text size="xs" c="text-medium">
              {processedData.category}
            </Text>
          )}
        </Box>

        <Group gap="sm">
          <Text size="xl" fw={700} c="brand">
            {totalResponses}
          </Text>
          <SegmentedControl
            value={viewType}
            onChange={(value: string) =>
              setViewType(value as "horizontal" | "bar" | "pie")
            }
            data={[
              {
                label: <Icon name="horizontal_bar" size={16} />,
                value: "horizontal",
              },
              { label: <Icon name="bar" size={16} />, value: "bar" },
              { label: <Icon name="pie" size={16} />, value: "pie" },
            ]}
            size="sm"
          />
        </Group>
      </Group>

      <Box style={{ flex: 1 }}>
        {viewType === "horizontal" ? (
          <SurveyHorizontalBar
            labels={processedData.labels}
            counts={processedData.counts}
            percentages={processedData.percentages}
            showPercentages={settings["survey.show_percentages"] !== false}
            showCounts={settings["survey.show_response_counts"] !== false}
          />
        ) : transformedSeries.length > 0 ? (
          viewType === "pie" ? (
            <PieChart
              {...props}
              rawSeries={transformedSeries}
              settings={computedSettings}
            />
          ) : (
            <BarChart
              {...props}
              rawSeries={transformedSeries}
              settings={computedSettings}
            />
          )
        ) : (
          <Box
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "200px",
              color: "var(--mb-color-text-light)",
            }}
          >
            <Text>{t`No data to display`}</Text>
          </Box>
        )}
      </Box>

      {viewType !== "horizontal" && (
        <Stack gap={4}>
          {processedData.labels.map((label, i) => (
            <Group key={label} gap="xs">
              <Box
                w={12}
                h={12}
                style={{
                  backgroundColor:
                    viewType === "pie"
                      ? `var(--color-chart-${i % 8})`
                      : "var(--color-brand)",
                  borderRadius: 2,
                }}
              />
              <Text size="sm" style={{ flex: 1 }}>
                {label}
              </Text>
              <Text size="sm" fw={500}>
                {t`${processedData.percentages[i]}% (${processedData.counts[i]})`}
              </Text>
            </Group>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
