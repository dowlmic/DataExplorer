----------------------------------------------------------------------------------------------------------------------------------------------------------------

DATA EXPLORER

--------------------------------------------------------------------------------

TECHNICAL DOCUMENTATION

--------------------------------------------------------------------------------
--------------------------------------------------------------------------------


--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

--LIBRARIES AND VERSIONS--

The Data Explorer requires the following libraries:
	-- JQuery (must be compatible with version 1.12.1)
	-- JQuery UI (must be compatible with version 1.11.4)
	-- D3 (must be compatible with version 3.4.6)
	-- Boostrap (must be compatible with version 3.3.6)


--LINKING LIBRARIES--

-- Libraries are currently linked using local files within the lib directory of
	the repo
-- All libraries are linked in index.html
	-- NOTE: The order in which Bootsrap and JQuery UI libraries are linked
		influences the appearance of the web page due to conflicts
		between the two libraries. To avoid these conflicts, make sure
		Bootstrap is linked first and JQuery UI is linked after.


--JAVASCRIPT FILES--

All code written for this tool is divided between 6 different JavaScript files:
	-- initialize.js: This file contains all the global variables and the
		functions responsible for uploading data, creating the proper
		page layout depending on whether the given data is timeseries
		data or not, and initiates the graph creation process
	-- timeseries.js: This file contains all functions related to creating
		the timelines within the leftContainer div of the page as well
		as the search and highlight feature
	-- svgChain.js: This file contains all functions related to creating the
		SVG chain
	-- dropDown.js: This file contains all methods to create the drop down
		selectors, including the graph selector and all attribute
		selectors
	-- graphLegend.js: This file contains all functions responsible for
		creating the graph legends for each graph in the SVG chain.
	-- graphInteractions.js: This file contains all functions for graph
		interactions that are longer than a couple lines of code


--STYLESHEETS--

There is a single stylesheet called style.css that has styles that are used
throughout the web page, such as margins or colors.


--------------------------------------------------------------------------------
CODE WALKTHROUGH
--------------------------------------------------------------------------------

--GLOBAL VARIABLES--

-- svgData: A JavaScript object that contains all the data for all the SVGs in
	the SVG chain
-- svgCount: A running count of the number of SVGs currently in the SVG chain
-- width: The width of the SVGs in the SVG chain
-- height: The height of the SVGs in the SVG chain
-- svgPadding: The padding of the SVGs in the SVG chain
-- chartPadding: The amount of padding to artificially create in the SVGs in
	the SVG chain. This is done for visual appeal
-- scalePadding: The amount of padding to add to a continuous x- or y- scale
	expressed as a percent. This is done for visual appeal
-- maxLabelLength: The maximum number of characters that is deemed acceptable
	for categorical tick labels on the x- or y-axis. This is done for visual
	appeal
-- numHeatSquares: The number of desired squares in a heatmap
-- timelineKeyStartIndex: The index of the first column of time series data in
	the CSV
-- isTimeseries: A boolean to help determine what graph types and interactions
	to support based on whether the uploaded CSV contains time series data
	or not.
-- KEY_TYPES: A frozen JavaScript dictionary to hold the different types of
	keys for visual attributes. This dictionary is used to make the code
	more legible
-- NO_SELECTION: A frozen JavsScript string to denote when no selection for a
	particilar visual attribute has been made. This is only used in the drop
	down menus for color, size, and shape
-- SHAPES: A frozen JavaScript array that contains a list of supported shapes
	for scatterplot nodes. This list reflects the different shapes supported
	by D3 with path elements in SVGs
-- GRAPH_TYPES: A frozen JavaScript dictionary to hold the different types of
	graphs that are supported. The value of the dictionary is determined by
	the isTimeseries boolean after a CSV has been loaded into the Data
	Explorer. This dictionary is used to make the code more legible.
-- defaltGraph: The default graph type that is used when starting an SVG chain.
	This default value is always set to GRAPH_TYPES.SCATTERPLOT.



--STARTING THE DATA EXPLORER--

When the user first loads index.html, there is only a "Browse" button to upload
a CSV file on the page. In the background, all libraries, local JavaScript
files, and stylesheets are loaded. When the user selects a file to upload,
initialize.js checks whether the selected file has a ".csv" extension.
	-- If the file does not have the proper extension, a JavaScript popup
		alerts the user that "[SelectedFile] is not a CSV file. Please
		upload a CSV file." The user can click on the "Browse" button to
		attempt to upload a file again.
	-- If the file does have the proper extendion, a JQuery dialog asks
		about the data contained in the file to determine how to parse
		it. Once this dialog disappears, the user will see that the
		"Browse" button has been disabled. This prevents issues with
		loading different data, which would append another SVG chain
		to the current chain and ultimately confuse the user.

When a CSV file has been selected, a JQuery dialog asks, "Does this CSV contain
time series data?"
	-- If the user selects "Yes," the Data Explorer launches in Time Series
		Mode. This is done by calling setUpPageLayout further down in
		initialize.js to create the proper page layout. Then,
		createTimelines in timelines.js is called to parse and display
		the data. The isTimeseries boolean is set to true to help
		determine which graph types and interactions to support.
	-- If the user selects "No," the Data Explorer launches in Generic Mode.
		This is done by calling setUpPageLayout further down in
		initialize.js to create the proper page layout. Then, createSVG
		in svgChain.js is called to parse and display the data. The
		isTimeseries boolean is set to false to help determine which
		graph types and interactions to support.


--GENERIC MODE--

CSV Format Assumptions:

Data in an uploaded CSV is assumed to contain data in a specific format:
-- Each row in the CSV contains data for a single data point
-- Each column in the CSV contains data for a specfic attribute of that data
	point


How to Use:

In Generic Mode, the page simply contains a div inside a scrolling div to hold
the SVG chain. This chain is started automatically in svgChain.svg by creating
a new graph that defaults to a scatterplot with circular nodes that are a blue
color (from d3.scale.category10()(0)) that are all the same size. That is, these
visual attributes are set to NO_SELECTION by default.  The drop down menus for
graph type, x-axis, and y-axis are all above the graph while the drop down menus
for color, size, and shape are all below the graph. Because color, size, and
shape are all NO_SELECTION, the legend for the graph is invisible (but
technically is just a div to the right of the graph with a black border and a
header of "Legend").

In this mode, svgChain.js is respondible for the majority of the graph's
appearance and some of the interactions (e.g. showing a scatterplot's node's
coordinates on hover). However, graphLegend.js is responsible for updating the
graph's legend and setting the legend's div to visible or invisible based on
whether color, size, or shape have been set to anything other than NO_SELECTION.
This JavaScript file also creates the color and shape pickers for altering
these visual attributes in the legend.

Similarly, dropDowns.js contains all methods for creating all the drop down
menus throughout the page, including positioning the ul elements to appear below
the drop down menu buttons and assigning onclick functions to the li elements.

For the more complicated graph interaction of enabling node selection, the
related functions are broken out into graphInteractions.js (especially because
svgChain.js is so long already). Node selection is entirely dependent on the
graph type. Therefore, if there are issues selecting nodes, it is likely that
the issue lies within the code for that specific graph in the on dragend
function in enableNodeSelection (or a function called by this function). (NOTE:
The most likely graph to have such issues is heatmaps due to the complexity of
trying to determine whether the selection box passes through but does not
completely contain a square in the heatmap.)


--TIME SERIES MODE--

CSV Format Assumptions:

Data in an uploaded CSV is assumed to contain data in a specific format:
-- Each row in the CSV contains data for a single topic
-- Each column in the CSV contains data for a specfic attribute of that topic
	-- Column 1: The name of the topic
	-- Column 2: The cluster or group that this topic belongs to. The
		cluster can be a name, number, or other object-- the algorithm
		to determine clusters (located in svgChain.js) shouldn't care
		what kind of data it is
		-- NOTE: Although this assumption is made, the user can select
			a different column of the CSV to group the time series
			data by through a drop down menu after Time Series Mode
			has been launched
	-- Column 3: The space-separated list of highest weighted words in the
		topic in descending order
	-- Column 4: Metadata (currently unused)
	-- Columns 5+: Time series data for that topic. The column headers for
		these columns must be parsable by JavaScript's Date(inputDate)
		function


How to Use:

In Time Series Mode, the page contains an outer div with 2 inner divs: a narrow
one to the left and a larger one to the right.

The narrow div to the left contains instructions for users to initiate an SVG
chain in the right div, a search box to find a specific timeline by name, a drop
down menu to select the column in the CSV file to categorize/group the time
series data by, and a series of SVGs with one or more timelines in each SVG.
These SVGs contain a set of time series data for only one group (as determined
by the drop down menu). By default, the second column of the CSV is used for
this categorization. Each SVG is given a header to show which category it
represents and a color for the timelines within that SVG. (NOTE: The colors are
for visual appeal only; they do not mean anything.) Using the search box, the
user can search for a timeline by the name of the topic it represents. As the
user types, a maximum of 10 autocomplete options will be displayed to help the
user find the desired data faster. When the "Search" button is clicked, each
row in the CSV is searched to find the matching topic title. Once found, the
matching timeline is located and highlighted in green. The SVG that contains
that timeline is then automatically scrolled to using JQuery.

When an SVG is clicked, a new graph is created in the right div (which scrolls
separately from the timeline div) using only the data from the clicked SVG. The
color associated with the clicked SVG is set as the preferredColor for the new
graph (as opposed to the default d3.scale.category10()(0) in Generic Mode).

The timeline SVGs to the left of the page above, the search feature, and the
onclick function for the SVGs are all created within timeseries.js. The layout
of this left div, including the user instructions, text input box, and search
button, are all created in initialize.js. The large graphs created by clicking
on a timeline SVG are largely created from svgChain.js using the same functions
in Generic Mode. This means that they also have the same interactions with the
drop down menus for the visual attributes and buttons in the legends.

Although the large graphs in the right div are created using the same functions
as in Generic View, the fact that the isTimeseries boolean is set to true alters
these graphs slightly by enabling the timeline and bar chart overview graph
types (in addition to scatterplots, bar charts, and heatmaps). Also, when an
element with the class "node" is clicked, the data associated with that element
(which should be a single row of data in the CSV) is used to create a JQuery
dialog box that contains a timeline and word cloud for just that node. At the
bottom of the dialog, there is a button that the user can click on to view the
raw data associated with that node. For any bar chart overview or timeline, the
onhover functions reveal the name of the topic associates with it.

Most of the code for creating the larger graphs in Time Series Mode is also
contained in svgChain.js. However, some code, such as creating the axes for the
timelines, is contained in timeseries.js. The code to create the JQuery dialog
showing data for an individual node is contained in graphInteractions.js since
this code is longer than a couple lines.


--------------------------------------------------------------------------------
TROUBLING THINGS
--------------------------------------------------------------------------------

Although this code has been refactored to have similar functions call the same
function (or even be the same function), there are some things that would be
difficult to change without combing through a lot of the code:
	-- Layout Variables and CSS: Getting the layout right for this page was
		difficult, especially whenever I wanted to alter the location
		of the axes and the data. Although I know that I fixed some of
		the issues surrounding this, changing any layout variable or CSS
		style (even one as simple as margin) could easily have an
		undesired or unintended effect, particularly for inline CSS.
	-- Heatmaps: Heatmaps were a headache to implement with D3. I believe I
		have finally debugged the heatmap squares' positions thoroughly
		enough, but I would not be surprised to learn that there is
		another bug under the right conditions (which may be difficult
		to explain or replicate for future debugging). Also, selecting
		heatmap squares has often revealed bugs. These issues typically
		revolve around the fact that the methods for mapping heatmap
		sqaures in the graph, determining their widths and heights, and
		selecting them all depends on whether the data for an axis is
		categorical or continuous. Issues that arise with heatmaps are
		likely associated with how categorical or continuous data is
		handled, but usually is not both. If an issue is found with a
		heatmap, take note of whether the axes are categorical or
		continuous as this is often the most helpful when continuing to
		debug these issues.


--------------------------------------------------------------------------------
MORE INFORMATION
--------------------------------------------------------------------------------

Didn't find the information you were looking for? README.txt is a user guide for
how to use the Data Explorer, which may provide more information. If you are
looking for more technical information, look at the individual JavaScript files
as they are all documented thoroughly.
