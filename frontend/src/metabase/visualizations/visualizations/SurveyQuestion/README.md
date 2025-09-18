# Survey Question Visualization

A custom Metabase visualization component designed for displaying survey question results with interactive chart type switching between bar charts and pie charts.

## Features

- **Chart Type Switcher**: Toggle between bar chart and pie chart visualizations
- **Response Statistics**: Displays percentages and counts for each response option
- **Total Response Count**: Shows the total number of responses prominently
- **Color-Coded Responses**: Visual distinction between different response options
- **Automatic Data Processing**: Handles various survey data formats

## Usage

### Data Format

The visualization expects data with the following column names:
- **Response/Option Column**: `option_label`, `answer`, or `response`
- **Count Column**: `count`, `response_count`, or `total`

### SQL Query Example

```sql
SELECT
  option_label,
  COUNT(*) as count
FROM qa.int_survey_responses_enhanced
WHERE survey_id = '94baa80d-06be-48d0-96f1-0ad3f7effbc4'
  AND question_id = 'specific-question-id'
GROUP BY option_label
ORDER BY count DESC
```

### Creating a Survey Question Visualization

1. Create a new question in Metabase
2. Write a SQL query that returns survey response data
3. Select "Survey Question" as the visualization type
4. The component will automatically:
   - Display "QUESTION RESULTS" as the title
   - Show the total response count in the top-right
   - Provide chart type switching between bar and pie charts
   - Display percentages and counts for each response option

## Component Structure

The visualization consists of:
- **Header Section**: Title, optional subtitle (category), and total response count
- **Chart Controls**: Chart type switcher (bar/pie icons)
- **Visualization Area**: The selected chart type (bar or pie)
- **Legend/Response List**: Color-coded list of responses with percentages and counts

## Settings

The visualization supports the following settings (configurable in chart settings):
- `survey.show_percentages`: Show/hide percentage values
- `survey.show_counts`: Show/hide response counts
- `survey.default_chart_type`: Set default chart type (bar or pie)
- `survey.show_total`: Show/hide total response count

## Testing with Sample Data

Use survey ID `94baa80d-06be-48d0-96f1-0ad3f7effbc4` from the ClickHouse `qa` database for testing.