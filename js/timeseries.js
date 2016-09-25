/*
 * This file contains all functions related to creating the timelines within the
 * leftContainer div of the page as well as the search and highlight feature.
 */


// Function to create a series of graphs in which each graph contains timelines
// of the same group. Clicking on a graph creates an SVG chain for users to
// interact with the data from only that graph
function createTimelines(data, categoryKeyIndex, location) {
    // Grab the keys from the data and the number of keys
    var dataKeys = Object.keys(data[0]);
    var numKeys = dataKeys.length;

    // Make the timeline search box autocomplete
    addTimelineSearchAutocomplete(data, dataKeys);

    // Add a div to the given location to contain all timelines
    location = location.append("div")
        .attr("id", "timelines")
        .style("margin", "10px 0px");

    // Add a dropdown menu to select which category to sort the timelines by
    addCategorySelector(location, data, dataKeys, categoryKeyIndex);

    // Add a br to put the timelines on a separate line from the dropdown menu
    location.append("br");

    // Intialize width and height variables to help make the different timelines
    var timelineWidth = 200;
    var timelineHeight = 200;

    // Create an ordinal scale for the x-axis based off the date names
    var xRange = [0, (timelineWidth-svgPadding*2-chartPadding*2)];
    var xScale = getTimelineXScale(getDateList(data[0]), xRange);

    // Get the categories within the specified dataKey. Based on the categories,
    // create an object to contain lists of data points that fall within each
    // category
    var categories = getCategories(data, dataKeys[categoryKeyIndex]);
    var dataGroups = {};
    var i;
    for (i = 0; i < categories.length; i++) {
        var j;
        for (j = 0; j < data.length; j++) {
            if (data[j][dataKeys[categoryKeyIndex]] == categories[i]) {
                // If there is no key called categories[i] in dataGroups,
                // assign this new key to the array [data[j]]
                if (dataGroups[categories[i]] == null) {
                    dataGroups[categories[i]] = [data[j]];
                }
                // If there is a key called categories[i] in dataGroups, just
                // add data[j] to the list already there
                else {
                    dataGroups[categories[i]].push(data[j]);
                }
            }
        }
    }

    // Iterate through all the categories in dataGroups and draw
    // categories.length+1 timelines
    var colors = d3.scale.category10();
    var k;
    for (k = 0; k < categories.length+1; k++) {
        // For the first timeline, use all the data and use a different header.
        // Otherwise, use only the data that falls within that category and use
        // a header to reflect which category that is
        var timelineData;
        var header;
        if (k == 0) {
            timelineData = data;
            header = "All Data";
        }
        else {
            timelineData = dataGroups[categories[k-1]];
            header = "Category: " + categories[k-1];
        }

        // Variables for the x- and y- padding for the timeline SVGs
        var xPadding = 35;
        var yPadding = svgPadding * 3;

        // Get the yScale to use to plot the timelines in the given category
        var yRange = [(timelineHeight-svgPadding*2-chartPadding-1), 0];
        var yScale = getTimelineYScale(timelineData, dataKeys, yRange);

        // Create the timeline at location with timelineData that has specific
        // visual attributes
        var timelineSVG = buildTimeline(location, timelineData,
            dataKeys, timelineWidth, timelineHeight, xPadding,
            yPadding, xScale, yScale, 0.1, colors(k%10), null,
            startSVGChain(timelineData, colors(k%10)));

        // Add an ID to the SVG
        timelineSVG.attr("id", "timeline-"+k);

        // Add the header to the SVG
        timelineSVG.append("text")
            .attr("x", timelineWidth/2)
            .attr("y", 10)
            .style("text-anchor", "middle")
            .style("text-align", "center")
            .style("font-size", "10px")
            .text(header);
    }
}

// A helper function that enables autocomplete when searching for a specific
// timeline
function addTimelineSearchAutocomplete(data, dataKeys) {
    // Make the search box autocomplete by getting an array of the names of each
    // data point (assumed to be in the first column of the CSV) and using
    // JQuery to use up to 10 items to autocomplete
    var dataNames = [];
    var i;
    for (i = 0; i < data.length; i++) {
        dataNames.push(data[i][dataKeys[0]]);
    }
    dataNames.sort();
    $(function() { $("#searchTerm").autocomplete({
            source: function(request, response) {
                var results = $.ui.autocomplete.filter(dataNames, request.term);
                response(results.slice(0, 10));
            }
        });
    });
}

// A helper function to add a dropdown menu to select which column in the CSV to
// group the timelines by
function addCategorySelector(location, data, dataKeys, categoryKeyIndex) {
    // Add the label and button for the dropdown menu
    var categorySelectorDiv = location.append("div")
        .attr("class", "dropdown")
        .style("z-index", 7);
    categorySelectorDiv.append("p")
        .style("margin", "10px auto auto 0px")
        .text("Group Timelines By: ");

    // Store the function for when an attribute is selected as a variable. This
    // allows the createAttributeSelector function in svgChain.js to be used
    var clickFunction = function(element, categoryDropDown) {
        // Get the selected category and the current category based on the DOM
        // elements
        var selectedCategory = element.innerHTML;
        var currentCategory = categoryDropDown.text();

        // If the category has changed, delete all SVG divs and redraw all
        // timelines to start over again
        if (currentCategory != selectedCategory) {
            // Remove the div with the timelines
            d3.select("#timelines").remove();

            // Delete all elements in the middleInnerContainer. This effectively
            // restarts the SVG chain
            d3.select("#mainInnerContainer").selectAll("*").remove();

            // Reset the SVG counter
            svgCount = 0;

            // Create a new set of timelines based on the selected category
            var selectedCategoryIndex = dataKeys.indexOf(selectedCategory);
            createTimelines(data, selectedCategoryIndex, d3.select("#leftContainer"));
        }
    };

    // Create a dropdown menu to select which attribute from dataKeys to use to
    // categorize the timelines in the categorySelectorDiv that calls
    // clickFunction when an item is selected. The dropdown menu default will be
    // dataKeys[categoryIndex]
    createAttributeSelector(categorySelectorDiv, null, clickFunction, dataKeys,
        null, dataKeys[categoryKeyIndex]);

    // Make a slight adjustment to the top margin of the ul element that has all
    // the categories to select in the drop down menu so that it lines up with
    // the bottom of the drop down menu button
    var categorySelections = categorySelectorDiv.select("ul");
    var currentSelectionsMargin = categorySelections.style("margin-top");
    currentSelectionsMargin = Number(currentSelectionsMargin.substring(0, currentSelectionsMargin.length-2));
    categorySelections.style("margin-top", (currentSelectionsMargin-6) + "px");
}

// A helper function to create a list of strings for all dates in the dataKeys
// with an extra date prepended and appended to the list for visual padding
function getDateList(data) {
    // Get a list of all the keys that indicate a date
    var dates = Object.keys(data).slice(timelineKeyStartIndex, data.length).map(dateCreator);

    // Initialize the list of dateNames
    var dateNames = [];

    // Calculate the number of milliseconds in a day to calculate
    // a date that is 1 day prior to the first date in the list
    var millisecondsInDay = 24*60*60*1000;
    dateNames.push(dateCreator(dates[0].getTime()-millisecondsInDay).toDateString());

    // Iterate through all the dates and push a meaningful string
    // representation of the date to the list
    for (i = 0; i < dates.length; i++) {
        dateNames.push(dates[i].toDateString());
    }

    // Add a date to the list that is 1 day after the last date in
    // the list
    dateNames.push(dateCreator(dates[i-1].getTime()+millisecondsInDay).toDateString());

    // Return the list of date strings
    return dateNames;
}

// A helper function to create a new date in the current time zone
function dateCreator(date) {
    var d = new Date(date);
    d.setTime(d.getTime() + d.getTimezoneOffset()*60*1000);
    return d;
}

// A helper function to create an x-scale for timeseries data
function getTimelineXScale(dateNames, range) {
    // Create an ordinal scale for the x-axis based off the date names
    return d3.scale.ordinal()
        .domain(dateNames)
        .rangePoints(range);
}

// A helper function to create a y-scale for timeseries data. This scale will
// have a domain from the minimum value in data to the maximum value in data
function getTimelineYScale(data, dataKeys, yRange) {

    // Get an array of all values in any datapoint in data
    var values = [];
    for (i = 0; i < data.length; i++) {
        var j;
        for (j = timelineKeyStartIndex; j < dataKeys.length; j++) {
            var value = data[i][dataKeys[j]];
            if (isNaN(value)) {
                values.push(0);
            }
            else {
                values.push(value);
            }
        }
    }
    
    // Get the min and max values from the array of values
    minValue = Math.min.apply(null, values);
    maxValue = Math.max.apply(null, values);

    // Create a continuous scale for the y-axis that has a domain from the
    // minValue to the maxValue
    return d3.scale.linear()
        .domain([minValue, maxValue])
        .range(yRange);
}

// Function that creates a timeline at the given location with the given data
// using specific visual attributes
function buildTimeline(location, data, dataKeys, timelineWidth,
  timelineHeight, xPadding, yPadding, xScale, yScale, lineOpacity, lineColor,
  onNodeClick=null, onGraphClick=null) {

    // Create the x- and y-axes using xScale and yScale
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom");
    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left")
        .tickFormat(function(d) { return formatTick(d, this); });

    // Create the SVG for this timeline using the given width and height
    // variables and add onGraphClick as the onclick function
    var timelineSVG = location.append("svg")
        .attr("width", timelineWidth)
        .attr("height", timelineHeight)
        .style("z-index", 1)
        .on("click", onGraphClick);

     // Create places to put the x- and y-axes
     var xYPadding = timelineHeight-chartPadding+svgPadding;
     createAxesLocations(timelineSVG, xPadding, xYPadding, yPadding);

    // Place the x- and y-axes on the  timeline
    timelineSVG.select("#x-axis")
        .transition()
        .duration(1000)
        .call(xAxis);
    timelineSVG.select("#y-axis")
        .transition()
        .duration(1000)
        .call(yAxis);

    // Ensure the x-axis doesn't have too many tick marks
    hideTimelineTicks(timelineSVG, 2);

    // Place the timelines on the SVG, each of which will have the class "node"
    placeTimelineNodes(timelineSVG, data, dataKeys, xScale, yScale,
        xPadding, yPadding, lineColor, lineOpacity);

    // Return the SVG object if it's needed
    return timelineSVG;
}

// Create locations to place the x- and y- axes
function createAxesLocations(location, xPadding, xYPadding, yYPadding) {
    location.append("g")
            .attr("id", "x-axis")
            .attr("class", "axis")
            .attr("transform", "translate(" + xPadding + "," + xYPadding + ")");
    location.append("g")
            .attr("id", "y-axis")
            .attr("class", "axis")
            .attr("transform", "translate(" + xPadding + "," + yYPadding + ")");
}

// Hide some of the ticks on the x-axis of the timeline so that they are still
// legible
function hideTimelineTicks(timelineSVG, numDesiredTicks) {
    // Select all the tick marks
    var xTicks = timelineSVG.select("#x-axis").selectAll(".tick");
    
    // Calculate the mod number to use when iterating through the ticks
    var tickModNum = xTicks[0].length/(numDesiredTicks-1);
    
    // Iterate through the ticks. When i%tickModNum != 0 or the tick is not at
    // the end of the axis, hide the tick
    xTicks.each(function (d, i) {
        if (Math.floor(i%tickModNum) != 0 && i != xTicks[0].length-1) {
            d3.select(this).style("visibility", "hidden");
        }
    });
}

// Place the timelines in the SVG. Each timeline will have a g element with the
// class "node" that will contain a series of line elements that are created
// based on the given visual attribtues
function placeTimelineNodes(location, data, dataKeys, xScale, yScale,
  xPadding, yPadding, lineColor, lineOpacity) {
      
    // Create a group object for the nodes and append a group node for each
    // datapoint
    location.append("g").attr("class", "nodes");
    var nodes = location.select(".nodes")
        .selectAll(".node")
        .data(data)
        .enter()
            .append("g")
            .attr("class", "node");

     // Create a tooltip for each timeline that shows the assumed name for that
     // datapoint
     nodes.append("title").text(function(d) { return d[dataKeys[0]]; });

     // For each node, calculate the x- and y-coordinates for the next line and
     // draw it
     nodes.each(function(d, i) {
         // Select the element to append the line elements to
        var selection = d3.select(nodes[0][i]);

        // Iterate through all the date keys, skipping the keys for metadata
        var i;
        for (i = timelineKeyStartIndex; i < dataKeys.length-1; i++) {
            // Calculate the y-coordinates for the line
            var key1 = dataKeys[i];
            var y1 = getTimelineYCoordinate(Number(d[key1]), yScale);

            var key2 = dataKeys[i+1];
            var y2 = getTimelineYCoordinate(Number(d[key2]), yScale);
            

            // Translate the dates for x1 and x2
            var dateString1 = dateCreator(key1).toDateString();
            var dateString2 = dateCreator(key2).toDateString();

            // Create the next line segment for this timeline
            selection.append("line")
                .attr("x1", xScale(dateString1) + xPadding)
                .attr("y1", y1 + yPadding)
                .attr("x2", xScale(dateString2) + xPadding)
                .attr("y2", y2 + yPadding)
                .style("stroke", lineColor)
                .style("opacity", lineOpacity);
        }
     });
}

// A helper function to calculate the y-coordinate for a timeline
function getTimelineYCoordinate(value, scale) {
    // If the y-value is NaN, set it to the minimum value
    if (isNaN(value)) {
        return scale(scale.domain()[0]);
    }
    // Otherwise, use the yScale to determine the y-coordinate
    else {
        return scale(value);
    }
}

// Function that drives the search feature when searching for a timeline in the
// leftContainer
function searchForTimeline(data) {
    // Determine what the user is searching for
    var searchInput = d3.select("#searchTerm")[0][0];
    var targetName = searchInput.value;
    
    // Get the dataKeys
    var dataKeys = Object.keys(data[0]);

    // Search for the desired timeline
    var targetObj;
    var i;
    for (i = 0; i < data.length; i++) {
        if (data[i][dataKeys[0]] == targetName) {
            targetObj = data[i];
            break;
        }
    }

    // If the desired timeline was found, highlight it and scroll to it
    if (targetObj) {
        // Grab all the nodes and make none of them be selected
        var nodes = d3.select("#timelines").selectAll(".node");
        nodes.classed("selected", false);
        nodes.selectAll("line").style("opacity", 0.1);

        // Get the categoryIndex to help find the SVG with the desired timeline
        var clusterKey = d3.select("#timelines").select("button").text();
        var categories = getCategories(data, clusterKey);
        var categoryIndex = categories.indexOf(targetObj[clusterKey]);

        // Grab the SVG with the desired timeline and iterate through each
        // timeline until the right one is found
        var targetTimeline = d3.select("#timeline-"+(categoryIndex+1));
        var targetLine = targetTimeline.selectAll(".node").filter(function (d) {
            return d == targetObj;
        });
        
        // Once the desired timeline is found, select it
        targetLine.classed("selected", true);
        targetLine.selectAll("line").style("opacity", 1);

        // Scroll to the div with the desired timeline
        var scroll = $(targetTimeline[0][0]).position().top -
            targetTimeline.attr("height") +
            d3.select("#leftContainer")[0][0].scrollTop - 110;
        $("#leftContainer").animate({scrollTop: scroll}, 1500);
    }
    // If the desired timeline wasn't found, alert the user and reset the search
    // box
    else {
        alert("Could not find data with name '" + targetName + "'");
        searchInput.value = "";
    }

}