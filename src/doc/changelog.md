## v1.1.1

- Added event when a workspace is created
- Fixed error when trying to create filters with no data

## v1.1.0 (2016-11-24)

- Added the ability to create graphs using column labels instead of column values, allowing the user to generate charts inverting rows and columns.
- Added configuration tab.
- Added filters to remove columns and rows form the charts.
- Added title input field to set the title of the charts.
- Fixed piecharts not working properly (The piecharts where all different while using the same configuration)
- Normalized GraphConfigurer input parameters for all GraphConfigurers.
- GraphConfigurers are now shared between widget and operator.
- Added GraphConfigurer tests.
- Added Highcharts workspace creation.
- Added Highcharts support on the graph creator operator

## v1.0.4

- Initial support for creating highchart configurations
- Build a `ckan-chart-creator-operator` sharing the code with this widget

## v1.0.3

- Update style
- Fix bug on non-Firefox browsers
- **Internal**: update to StyledElements 0.6. Now this widget requires WireCloud 0.8.2+

## v1.0.2

- Update CSS
- Disable graphs types can't be used as the corresponding graph widget is not connected
- Graph state are upade when wiring state changes
- Add support for creating workspace with the selected configuration
- Disable step 2 and step 3 if the user can't use them

## v1.0.1

- Add support for Google Charts
