--------------------------------------------------------------------------------
--------------------------------------------------------------------------------

DATA EXPLORER

--------------------------------------------------------------------------------

INSTRUCTIONS FOR USE

--------------------------------------------------------------------------------
--------------------------------------------------------------------------------


--------------------------------------------------------------------------------
ACCESSING THE TOOL
--------------------------------------------------------------------------------

1.  Download the project repo into a local directory. If the project was
	downloaded in a compressed format, extract the files in a local
	directory.
2.  Open the file index.html in a web browser.
3.  When the web page opens, you may click on the "Browse" button to select a
	local CSV file to upload.
	-- NOTE: The selected file must have a ".csv" extension. Otherwise, the
		file will not be uploaded, and you may choose a different file
		to upload by clicking on the "Browse" button again.
4.  If the CSV contains time series data, click "Yes" when the dialog box pops
	up. Otherwise, click "No." This launches the tool in Time Series Mode
	or Generic Mode (respectively).

--------------------------------------------------------------------------------
USING THE TOOL
--------------------------------------------------------------------------------

--STARTING THE TOOL--

1.  Open the file index.html in a web browser.
2.  When the web page opens, you may click on the "Browse" button to select a
	local CSV file to upload.
	-- NOTE: The selected file must have a ".csv" extension. Otherwise, the
		file will not be uploaded, and you may choose a different file
		to upload by clicking on the "Browse" button again.
3.  If the CSV contains time series data, click "Yes" when the dialog box pops
	up. Otherwise, click "No." This launches the tool in Time Series Mode
	or Generic Mode (respectively).


--GENERIC MODE--

Creating a Graph:

1.  The tool will parse the selected CSV file, assuming that each row is an
	individual data point and each column is an attribute of that data
	point. Once complete, the data will automatically be displayed in the
	default graph view using default variable mappings for the x- and y-
	axes, color, size, and scale.
	-- NOTE: Currently, the default graph view is a scatterplot with the
		second and third columns in the CSV file mapped as the x- and y-
		values (respectively). Color, size, and shape are not mapped to
		a variable. Instead, these are set to the default values of
		d3.scale.category10()(0) (which is a blue color), 75, and
		"circle" (respectively).
2.  Using the dropdown menus for the Graph Type, X-Axis, Y-Axis, Color, Size,
	and Shape, you can change the data you are looking at and how you wish
	to map data to the graphs. Selecting new choices from the dropdown menus
	will cause the graph to update automatically. The drop down menus are:
	-- Graph Type:
		-- Scatterplot: Each row of data is represented as a single data
			point. This means that, depending on the data, some data
			pints may be mapped onto each other.
		--  Bar Chart: Each row of data is represented as a single bar.
			This means that, depending on the data, some bars may be
			mapped onto each other. To help show occurrences of
			this, bars have an opacity of 10%. This means that
			overlapping bars will be darker in color.
			-- NOTE: The column that is being used for the x-axis
				and the type of data that is in this column of
				the CSV determines how wide to make the bars.
				Treating the data as categorical, the tool
				counts how many different categories or bins are
				in this column of the CSV to help determine the
				bar width. This means that if a column has too
				many categories or too many distinct numbers,
				then the bars will be too thin to plot. In these
				cases, the user is notified that the bars cannot
				be plotted, and the column used for the x-axis
				is reset to the previous column choice for the
				x-axis (if there is a previous choice). If there
				is no previous choice made or if the previous
				choice is the same as the current choice, the
				graph will be blank.
			-- NOTE: Because of the method used to determine the bar
				width (as described in the previous note), bar
				charts with an x-axis that contains continous
				data may have bars that overlap but do not have
				the same y-value. However, the opacity of the
				bars will allow you to still see the bars
				individually.
		-- Heatmap: Each tile in a heatmap represents the number of data
			points from the scatterplot would be contained in that
			tile. The color scale displays tiles that contain more
			data points as "hotter".
	-- X-Axis: Any of the columns from the CSV file can be used as the x-
		values.
	-- Y-Axis: Any of the columns from the CSV file can be used as the y-
		values.
	-- Color: Any of the columns containing numerical data can be used to
		map color on a continuous scale between 2 chosen colors.
		Columns with categorical data may also be used if there are
		no more than 20 categories within that column.
		-- NOTE: This dropdown menu is not available for heatmaps.
	-- Size: Any of the columns containing numerical data can be used to
		map size on a continuous scale between 20 and 200.
		-- NOTE: This dropdown menu is only available for scatterplots.
	-- Shape: Any of the columns that contain no more than 6 categories
		can be used to map shape. Columns with numerical data will
		be considered categorical for the purposes of determining shape.
		This means that there can be no more than 6 distinct numbers
		within a given column used for shape.
		-- NOTE: This dropdown menu is only available for scatterplots.


Altering Color, Size, and Shape:

1.  After columns to use for color, size, or shape have been selected, a legend
	to the right of the graph will automatically update to reflect the
	selections. Any buttons within the legend may be clicked on to alter
	the graph's appearance.
	-- Color:
		-- Categorical Data: The colors for each of the categories are
			shown within a button in the legend. To change the
			color for a single category, click on the button for the
			color to show the color picker. Click on the desired new
			color and click "Ok" to use the new color for that
			category. The graph will then update automatically.
			Clicking on the "X" in the top right corner or clicking
			"Cancel" will not make any changes to the graph's
			appearance.
			-- NOTE: Heatmap colors cannot be altered.
		-- Continuous Data: The colors for continuous data are
			calculated based on a scale between 2 chosen colors
			which represent the lowest and highest value in that
			column. These 2 colors are shown as buttons in the
			legend, with color samples of the calculated colors
			between the 2 colors also shown. To change either of the
			2 colors, click on the corresponding button to show the
			color picker. Click on the desired new color and click
			"Ok" to use the new color. The graph will then update
			automatically. Clicking the "X" in the top right corner
			or clicking "Cancel" will not make any changes to the
			graph's appearance.
	-- Size: There are no buttons for changing the size of the nodes in the
		graph. Instead, these are calculated automatically between a
		size of 20 and 200 and cannot be altered.
	-- Shape: Each category within the selected column is given a unique
		shape by default. To change the shape associated with any
		category, click on the button that contains the shape you wish
		to change to show the shape picker. Click on the radio button
		for the shape you wish to use and click "Ok". The graph will
		update automatically. Clicking the "X" in the top right corner
		or clicking "Cancel" will not make any changes to the graph's
		appearance.


Creating Sub-Graphs:

1.  To create a sub-graph based on a selection of data, simply select the data
	you wish to make a sub-graph of. The mechanics for selecting data is
	dependent on the type of graph.
	-- Scatterplots: With your mouse, click and drag to create a selection
		box around the desired points. All points whose x- and y-
		coordinates lie within the selection box will be automatically
		selected. The selected points' outline will change to a light
		green color to demonstrate which points are selected.
	-- Barcharts: With your mouse, click and drag to create a selection box
		around or through the desired bars. This means that all bars
		that are contained within the selection box and bars that the
		selection box goes through will be selected. A selection box is
		considered going through the bar if the selection box extends
		past the bar's x-value, meaning that the selection box must pass
		through the bar at least half way to select that bar. Bars that
		are selected will show a light green border to demonstrate which
		bars have been selected.
	-- Heatmaps: With your mouse, click and drag to create a selection box
		around or through the desired tiles. This means that all tiles
		that are contained within the selection box and tiles that
		the borders of the selection box goes through will be selected.
		This mechanic enables the selection of a single tile in the
		heatmap. Tiles that are selected will show a light green border
		to demonstrate which tiles have been selected.
2.  Once data has been selected, the sub-graph will be automatically generated
	below the current graph using only the selected data. All drop-down
	menu and legend choices in the original graph will also be used in the
	sub-graph, meaning the data in the sub-graph will be displayed in the
	exact same manner as its original graph.
3.  Once created, sub-graphs are treated independently from the original graph.
	This means that all dropdown menus and legend choices can be made
	independently of each other. Also, sub-graphs can be used to generate
	other sub-graphs by selecting data within the sub-graph.

NOTE: Selecting new data in a graph will remove all sub-graphs based on that
	data and generate a new sub-graph. This means that if data is selected
	and a sub-graph is generated, data is selected from the sub-graph to
	generate another sub-graph, and then a new selection is made on the
	original graph, the 2 sub-graphs are first deleted, then a new sub-
	graph with the newly selected data will be generated. In other words,
	graphs and sub-graphs are treated as strict progressions from one to the
	next based on the data selected. Altering the selected data will remove
	all graphs based on the progression of the previously selected data and
	generate a new graph to demonstrate the new progression.


--TIME SERIES MODE--

This mode assumes that the data is time series data for a set of topics.


Categorizing the Data:

1.  The tool begins by assuming that the second column in the CSV denotes the
	category or cluster to group the time series by. After grouping them by
	category, each group of time series data is plotted in a separate graph.
	Each row in the CSV file is assumed to contain time series data on a
	given topic, with the time series data beginning in the fifth column and
	going to the end of the CSV file where each column header is a date and
	each value in those columns is a weight assigned to that topic for that
	date. This information is then used to create a timeline for each time
	series. The result is a set of graphs that each contain timelines for
	a given category or cluster. These graphs are contained in an
	independently scrolling div to the left of the page.
	-- NOTE: If you wish to group the time series data by a different column
		in the CSV, use the drop down menu above the time series graphs
		to select a different column. The groups of timelines will be
		recalculated and redrawn.
2.  Click on the graph with the time series data you would like to explore
	further. This will trigger the creation of a graph in an independently
	scrolling div to the right of the time series graphs. This new graph
	is very similar to one from the Generic Mode, meaning you can use the
	dropdown menus and interact with the legend to change the appearance for
	this graph and select data to create sub-graphs with the selected data.
	For more details on the differences between this graph in Time Series
	Mode and Generic Mode, please read the next section.
	-- NOTE: If you would like to find a specific topic to view, start
		typing the name of the topic (which is assumed to be the first
		column of the CSV) in the search box above the time series
		graphs to the left of the page. The seach box will show a
		maximum of 10 autocomplete options. After entering the name of a
		topic and clicking the search button, the tool will find the
		timeline for that topic, highlight it in light green, and scroll
		the div with the time series graphs directly to the graph with
		the highlighted timeline.


Differences Between Graphs in Generic Mode and Time Series Mode:

Graphs in Time Series Mode have the following differences with those in Generic
Mode:
	-- There are 2 additional supported graph types:
		-- Timeline: In this view, the 5th column in the CSV and all
			columns after is are assumed to contain time series data
			with dates for the headers for the columns. These dates
			are parsed and used for the x-axis. The y-axis will
			range from the minimum value in any row and column with
			time series data to the maximum value to ensure that all
			timelines will fit in the graph. Each row in the CSV
			will have its own line to show the weight of the topic
			over time.
			-- NOTE: A value that cannot be parsed as a number will
				be assigned a value of 0.
		-- Bar Chart Overview: This view has the same x- and y-axis as
			the timeline, however, rather than drawing lines to
			connect values, every value has its own bar. This means
			that every row in the CSV has its own bar chart to show
			the weight of the topic over time. Since multiple bar
			charts are plotted in a single graph, each bar is given
			an opacity of 10% so that sections of bars that overlap
			will appear darker.
			-- NOTE: If there are too many dates in the CSV, no bars
				will be plotted as their widths would be too
				small.
	-- There are also additional interactions in Time Series Mode:
		-- Hovering over a node in timeline or bar chart overview will
			show the name of the topic (which is assumed to be in
			the first column of the CSV). This interaction is also
			available in the smaller categorized time series graphs
			to the left of the page.
		-- Clicking on a node in any graph view except heatmaps will
			show a popup with a timeline and word cloud for just
			that node. At the bottom of the popup is a button to
			view the raw data, if desired.
			-- NOTE: The third column in the CSV is assumed to be a
				space-separated list of the top weighted words
				in descending order.


--------------------------------------------------------------------------------
OTHER NOTES
--------------------------------------------------------------------------------

Continuous vs. Categorical Data: This tool makes assumptions on whether a column
	contains continuous (numerical) data or categorical data by checking the
	value for the column within the first row/data point. If the value can
	be successfully parsed as a number in JavaScript, the data is treated as
	continuous data. Otherwise, the data is treated as categorical.
Reloading vs. Refreshing the Page: After uploading a CSV file, the text next to
	the "Browse" button reflects which file has been selected for upload.
	If you wish to start your analysis over by refreshing the page (by 
	pressing Ctrl+R or clicking the refresh button), you will see that this
	text remains unchanged. However, this data is no longer loaded into the
	tool. In order to initialize the tool, you must click the "Browse"
	button again to load a CSV file. If you choose a different CSV file,
	this text will change to reflect the new CSV file. Instead, if you
	reload the page (by pressing Ctrl+Shift+R or going up to the URL and
	pressing Enter), all files and scripts are reloaded, which resets the
	text to "No file selected."
Scalability: Each graph is created dynamically based on the uploaded CSV file,
	the dropdown menu selections, and any legend alterations. However, this
	means that there is a limit to how many data points can be displayed.
	Barcharts are limited based on how thin the bars must be to display the
	data. If the bars are too thin to view, the barchart may not be
	graphed at all. Since heatmaps are aggregations of the data, they are
	the most scalable graph. Transitions in any graph view will also be
	effected by the amount of data. The more data that is being uploaded,
	the slower the response times will be. Ultimately, this means that this
	tool is limited by D3's capabilities and the capabilities of the
	specific web browser you are using.
CSV Format Assumptions: Although no assumptions are made about the format of
	a CSV file being used in Generic Mode (besides what was mentioned in
	the Categorical vs. Continuous Data note above), Time Series Mode makes
	specific assumptions about the columns in the CSV file. The first column
	is assumed to be the name of the topic; the second column is the name
	or number of the category, cluster, or group that the topic belongs to;
	the third column is a space-separated list of top weighted words in that
	topic in descending order; the fourth column is extra metadata; and the
	fifth column through the last column are the time series data for the
	topics. The column names for the time series data must be in a date
	format parsable by JavaScript's Date(inputDate) function. A CSV that is
	not in this format will likely result in the tool showing improper
	graphs/data or the tool crashing from being unable to process the given
	CSV file.
