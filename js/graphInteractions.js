/*
 * This file contains all functions for graph interactions that are longer than
 * a couple lines of code.
 */


// Open a dialog when users click on a node for timeline data
function openNodeDialog(datapoint, svgObj) {
    // Grab a list of dataKeys
    var dataKeys = Object.keys(datapoint);

    // Create a dialog with the datapoint's name for the title, a div for a
    // timeline for just this datapoint, a word cloud, and a button that shows
    // the raw JSON data
    var nodeName = datapoint[dataKeys[0]];
    var dataString = JSON.stringify(datapoint).replace(/"/g, " ");
    dataString = dataString.substring(2, dataString.length-1);
    var content = $("<div><div id='" + nodeName + "' style='text-align: center;'><h1>"
        + nodeName + "</h1>" +
        "<div id='nodeTimeline'></div><br><br><div id='wordCloud'></div>" +
        "<br><br><button onclick='alert(\"" + dataString +
        "\");'>View Raw Data</button></div></div>");
    $(content).dialog({
        // When the dialog is closed, remove it from the DOM
        close: function() { $(this).dialog("destroy"); }
    });


    // Variables for the width and height for both the timeline and word cloud
    var graphWidth = 300;
    var graphHeight = 300;

    // Make sure the popup window is big enough
    var timelineDiv = d3.select("#"+nodeName).select("#nodeTimeline");
    timelineDiv[0][0].parentNode.parentNode.parentNode.style.width = "auto";

    // Variables for the x- and y- padding for the timeline SVGs
    var xPadding = 35;
    var yPadding = svgPadding;

    // Determine the xScale and yScale to use for the timeline
    var xRange = [0, (graphWidth-svgPadding-chartPadding*2)];
    var xScale = getTimelineXScale(getDateList(datapoint), xRange);
    var yRange = [(graphHeight-chartPadding-1), 0];
    var yScale = getTimelineYScale([datapoint], dataKeys, yRange);

    // Create the timeline inside the timelineDiv
    buildTimeline(timelineDiv, [datapoint], dataKeys, graphWidth,
      graphHeight, xPadding, yPadding, xScale, yScale, 1, svgObj.preferredColor)

    // Create an SVG for the word clouds
    var wordCloud = d3.select("#"+datapoint[dataKeys[0]]).select("#wordCloud")
        .append("svg")
            .attr("width", graphWidth)
            .attr("height", graphHeight)
            .style("margin", "auto")
            .style("z-index", 1);

    // Assume that the list of key words are contained in the third column of
    // the CSV and that they are separated by spaces
    var wordList = datapoint[dataKeys[2]].split(" ");
    
    // Assume that the first words are the most important and create an ordinal
    // scale to use to determine the word's size
    var fontScale = d3.scale.ordinal()
        .domain(wordList)
        .rangePoints([40, 8]);
        
    // For each word, append a text element to the SVG, place it in a random
    // location in the word cloud, give it a color, and determine the size of
    // the text based on its assumed importance
    var colors = d3.scale.category10();
    wordCloud.selectAll("text")
        .data(wordList)
        .enter()
            .append("text")
                .attr("x", function() {
                    // Get a random x-coordinate between 0 and 3/4 of the
                    // graphWidth. This ensures that the text does not go too
                    // far to the right of the SVG
                    var x = Math.random()*(graphWidth-svgPadding*2)*3/4;
                    return x;
                })
                .attr("y", function() {
                    // Get a random y-coordinate between svgPadding*2 and
                    // graphHeight-svgPadding*4. This helps ensure that the text
                    // will not be too low or too high in the SVG
                    return Math.random()*(graphHeight-svgPadding*4)+svgPadding*2;
                })
                .style("fill", function(d) { return colors(d); })
                .style("font-size", function(d) { return fontScale(d) + "px"; })
                .style("font-weight", "bold")
                .text(function(d) { return d; })
                .append("title").text(function(d) { return d; });
}

// Function to allow users to select nodes by dragging a selection within the
// graph
function enableNodeSelection(svgObj) {
    return d3.behavior.drag()
        // When dragging begins, remove any existing rect and create a new one.
        // dragstart seems to be equivalent to mousedown
        .on("dragstart", function() {
            // Remove a rectangle if it already exists
            var rectID = "rect-" + svgObj.name;
            d3.select("#" + rectID).remove();

            // Create a new rectangle for the selection
            var mouseCoords = d3.mouse(this);
            svgObj.svg.append("rect")
                .attr("id", rectID)
                .attr("x", mouseCoords[0])
                .attr("init-x", mouseCoords[0])
                .attr("y", mouseCoords[1])
                .attr("init-y", mouseCoords[1])
                .attr("width", 0)
                .attr("height", 0)
                .style("fill", "green")
                .style("stroke", "black")
                .style("opacity", 0.1);
        })
        // While the user is dragging, change the size and location of the rect
        // to reflect their selection
        .on("drag", function() {
            // Grab mouse properties and the initial rectangle's coordinates
            var mouseCoords = d3.mouse(this);
            var rectID = "#rect-" + svgObj.name;
            var rect = d3.select(rectID);
            var startX = rect.attr("init-x");
            var startY = rect.attr("init-y");

            // Calculate the new width of the rect. If the width is negative,
            // then the user is dragging to the left and the x-coordinate should
            // be updated
            var width = mouseCoords[0] - startX;
            if (width < 0) {
                rect.attr("x", mouseCoords[0]);
                width = -width;
            }

            // Calculate the new height of the rect. If the height is negative,
            // then the user is dragging up and the y-coordinate should be
            // updated
            var height = mouseCoords[1] - startY;
            if (height < 0) {
                rect.attr("y", mouseCoords[1]);
                height = -height;
            }

            // Update the rectangle's width and height
            d3.select(rectID)
                .attr("width", width)
                .attr("height", height);
        })
        // When the user stops dragging, get the final boundaries of the rect,
        // determine what data should be selected, and remove the rect
        .on("dragend", function() {
            // Get the final bounding coordinates for the rectangle
            var rectID = "#rect-" + svgObj.name;
            var rect = d3.select(rectID);
            var width = Number(rect.attr("width"));
            var height = Number(rect.attr("height"));

            // Only change selection if the interaction was not a click
            var minSize = 3;
            if (width >= minSize && height >= minSize) {
                // Calculate box bounds
                var x1 = Number(rect.attr("x"));
                var y1 = Number(rect.attr("y"));
                var x2 = x1 + width;
                var y2 = y1 + height;
                
                // Swap variables to make later logic easier
                if (x1 > x2) {
                    var temp = x1;
                    x1 = x2;
                    x2 = temp;
                }
                if (y1 > y2) {
                    var temp = y1;
                    y1 = y2;
                    y2 = temp;
                }

                // Determine which nodes fall within the rectangle
                var nodes = d3.select("#"+svgObj.name).selectAll(".node");
                var filteredNodes = nodes.filter(function(d, i) {
                    // Get the coordinates of the current node
                    var x = calculateXCoord(d, svgObj);
                    var y = calculateYCoord(d, svgObj);

                    // If the currentGraph is a scatterplot, then the points
                    // selected will lie within the selection box
                    if (svgObj.currentGraph == GRAPH_TYPES.SCATTERPLOT) {
                        return x1 < x && x < x2 && y1 < y && y < y2;
                    }
                    // If the currentGraph is a barchart, then the bars selected
                    // will have a y-coordinate that is less than the
                    // y-coordinate of the selection box's upper bounds and an
                    // x-coordinate that is between the box's left and right
                    // bounds. Effectively, this means that the selection box
                    // be have passed through at least half the bar horizontally
                    // for the bar to be selected
                    else if (svgObj.currentGraph == GRAPH_TYPES.BARCHART) {
                        return x1 < x && x < x2 && y < y2;
                    }
                    // If the currentGraph is a heatmap, then the squares
                    // selected will either be contained within the selection
                    // box or the square will contain at least one of the box's
                    // bounds
                    else if (svgObj.currentGraph == GRAPH_TYPES.HEATMAP) {
                        // Recalculate box bounds to be relative to the square's
                        // data only for the first square evaluated as this
                        // calculation will persist to future calculations
                        if (i == 0) {
                            var xOffset = -svgPadding - chartPadding;
                            var Xs = getHeatmapValues(x1, x2, svgObj.xScale, true, xOffset);
                            x1 = Xs[0];
                            x2 = Xs[1];
                            
                            var yOffset = -svgPadding;
                            var Ys = getHeatmapValues(y1, y2, svgObj.yScale, false, yOffset);
                            y1 = Ys[0];
                            y2 = Ys[1];
                        }
                        
                        // Call a helper function to determine which squares
                        // should be selected
                        return determineHeatmapSelection(x1, x2, y1, y2, d, svgObj);
                    }
                    // If the currentGraph is a barchart overview, the selection
                    // box must contain all bars in a single node's barchart
                    // overview to select that node. Effectively, this means
                    // that the selection box must be at least as wide as the
                    // graph and taller than the tallest bar in the node's
                    // barchart overview for the node to be selected
                    else if (svgObj.currentGraph == GRAPH_TYPES.BARCHART_OVERVIEW) {
                        return determineBarchartOverviewSelection(x1, x2, y1, y2, d, svgObj);
                    }
                    // If the currentGraph is a timeline, the selection box must
                    // contain all lines in a single node's timeline to select
                    // the node. Effectively, this means that the selection box
                    // must be at least as wide as the graph and taller than the
                    // highest line in the node's timeline for the node to be
                    // selected
                    else if (svgObj.currentGraph == GRAPH_TYPES.TIMELINE) {
                        return determineTimelineSelection(x1, x2, y1, y2, d, svgObj);
                    }
                    // If any other graph is implemented, log out to the console
                    // that there is no selection algorithm yet for that graph
                    // type and do not select any nodes
                    else {
                        console.log("Selection for " + svgObj.currentGraph +
                            "is not implemented.");
                        return false;
                    }
                });

                // Delete the rectangle
                rect.remove();

                // Create an array of new data to create a new graph with
                svgObj.selectedData = [];
                filteredNodes.each(function(d) {
                    // If the currentGraph is a heatmap, then the
                    // selectedData must be recalculated since the
                    // data is stored differently
                    if (svgObj.currentGraph == GRAPH_TYPES.HEATMAP) {
                        svgObj.selectedData.push.apply(svgObj.selectedData, d.data);
                    }
                    else {
                        svgObj.selectedData.push(d); 
                    }
                });

                // Only update the selection if new data has been
                // selected
                if (svgObj.selectedData.length > 0) {

                    // Select/Highlight only the newly selected nodes
                    nodes.classed("selected", false);
                    filteredNodes.classed("selected", true);

                    // Remove all graphs that were related to the previous selection
                    var dashIndex = svgObj.name.indexOf("-");
                    var svgNum = Number(svgObj.name.substring(dashIndex+1, svgObj.name.length));
                    var currentNum = svgNum+1;
                    var relatedSVG = d3.select("#svg-" + currentNum);
                    while (relatedSVG[0][0]) {
                        relatedSVG.remove();
                        currentNum++;    
                        relatedSVG = d3.select("#svg-" + currentNum);
                    }

                    // Reset the svgCount
                    svgCount = svgNum + 1;

                    // Create a new graph with the selectedData
                    createSVG(svgObj.selectedData,
                        d3.select("#mainInnerContainer").append("div")
                            .style("margin", "10px 0px"));
                }
            }
        });
}

// A helper function to recalculate the coordinates for the selection box
// when the user is selecting squares in a heatmap
function getHeatmapValues(value1, value2, scale, isXScale, offset) {
    // The existence of the scale's invert function is used to determine whether
    // the data is continuous or categorical
    if (scale.invert) {
        // For continuous data, the new coordinates must apply the given offest
        // and use the invert function to produce a pixel location relative to
        // the graph's data
        value1 = scale.invert(value1 + offset);
        value2 = scale.invert(value2 + offset);
    }
    else {
        // For categorical data, begin by calculating the pixel location
        // relative to the graph and grabbing the scale's range
        value1 = value1 + offset;
        value2 = value2 + offset;
        var range = scale.range();

        // Use a helper function to get the index of the categorical value that
        // represents which categorical value acts as the bound for the
        // selection box
        value1 = getIndexBound(value1, range, isXScale);
        value2 = getIndexBound(value2, range, isXScale);
    }
    
    // Return both values at once using an array
    return [value1, value2];
}

// A helper function to find the array index that represents the bound for the
// selection box
function getIndexBound(value, array, arrayIsIncreasing) {
    var i;
    // If the array is increasing (i.e. is a scale for x-coordinates), iterate
    // until the given value is greater than the value at that index in the
    // array
    if (arrayIsIncreasing) {
        for (i = 0; value > array[i]; i++) {}
    }
    // If the array is deacreasing (i.e. is a scale for y-coordinates), iterate
    // until the given value is less than the value at that index in the array
    else {
        for (i = 0; value < array[i]; i++) {}
    }
    
    // Return the index of the array
    return i;
}

// A helper function to determine which squares in the heatmap should be
// selected. A square will only be selected if the selection box contains the
// square or if the selection box's bounds go through the sqaure
function determineHeatmapSelection(x1, x2, y1, y2, dataPoint, svgObj) {
    // For the current square, calculate the relative x-coordinates for the left
    // and right edges
    var dx1;
    var dx2;
    // The existence of the invert function helps to determine if the data is
    // categorical or continuous
    if (svgObj.xScale.invert) {
        // For continuous data, the x-coordinates will simply be the x attribute
        // of the square plus with square's width
        dx1 = dataPoint.x;
        dx2 = dataPoint.x + dataPoint.width;   
    }
    else {
        // For categorical data, the x-coordinates will be the index of the
        // square's x attribute in the xScale's domain and this index plus the
        // square's width
        dx1 = svgObj.xScale.domain().indexOf(dataPoint.x);
        dx2 = dx1 + dataPoint.width;
    }

    // For the current square, calculate the
    // relative y-coordinates for the top and
    // bottom edges
    var dy1;
    var dy2;
    // The existence of the yScale's invert function is used to determine
    // whether the data is continuous or categorical
    if (svgObj.yScale.invert) {
        // For continuous data, this is simply the square's y attribute plus the
        // sqaure's height
        dy1 = dataPoint.y + dataPoint.height;
        dy2 = dataPoint.y;
    }
    else {
        // For categorical data, the y-coordinates will be the index of the
        // square's y attribute in the yScale's domain plus the square's height
        dy1 = svgObj.yScale.domain().indexOf(dataPoint.y) + dataPoint.height;
        dy2 = dy1 - dataPoint.height;
    }

    // Determine if the square's x- or y-coordinates lie within the selection
    // box or if the selection box's boundaries lie within the square
    var xIn = x1 < dx1 && dx1 < x2;
    var boxXIn = (dx1 <= x1 && x1 < dx2) ||
        (dx1 < x2 && x2 <= dx2);
    var yIn = y2 < dy1 && dy1 < y1;
    var boxYIn = ((dy2 < y1 && y1 <= dy1) ||
        (dy2 <= y2 && y2 < dy1));

    // Only return true for the proper conditions
    return ((xIn && yIn) || (xIn && boxYIn) || (boxXIn && yIn) ||
        (boxXIn && boxYIn));
}

// A helper function to determine which barchart overviews to select. A barchart
// overview will only be selected if all bars for that node are contained within
// the selection box
function determineBarchartOverviewSelection(x1, x2, y1, y2, dataPoint, svgObj) {
    // Get the numKeys, calculate the bar width, and set the barPadding
    var numKeys = svgObj.dataKeys.length;
    var barWidth = (width - svgPadding*2 - chartPadding*2) *
        (1 - scalePadding*2)/numKeys - 5;
    var barPadding = 5;

    // For this dataPoint, iterate through all the dataKeys to determine if the
    // dataPoint's value assoicated with each key lies within the selection box
    var timelineInSelection = true;
    var i;
    for (i = timelineKeyStartIndex;
      timelineInSelection && i < svgObj.dataKeys.length; i++) {
        // Get the x-value for this bar in the barchart overview for this
        // datapoint
        var key = svgObj.dataKeys[i];
        var dateString = dateCreator(key).toDateString();
        var x = svgObj.xScale(dateString) + svgPadding + chartPadding - barWidth/2;

        // Get the y-value for this bar in the barchart overview for this
        // dataPoint
        var value = Number(dataPoint[key]);
        var y;
        // If the value in the CSV for this dataKey isNaN, set the y-value to
        // be the minimum height of bar in a barchart overview
        if (isNaN(value)) {
            y = svgObj.yScale(svgObj.yScale.domain()[0]) + barPadding - 1;
        }
        // Otherwise, calculate the bar's height in a barchart overview
        else {
            y = svgObj.yScale(value) + barPadding - 1;
        }
        
        // Make sure that the bar is in the selection box
        if (!(x1 < x && x < x2 && y1 < y && y < y2)) {
            timelineInSelection = false;
        }
    }
    
    // Return the boolean value for whether the barchart overview for this
    // dataPoint should be selected
    return timelineInSelection;
}

// A helper function to determine which timelines to select. A timeline will
// only be selected if all lines in a timeline are within the selection box
function determineTimelineSelection(x1, x2, y1, y2, dataPoint, svgObj) {
    // Iterate through all the dataKeys to determine whether all lines in the
    // given dataPoint's timeline lie within the selection box
    var timelineInSelection = true;
    var i;
    for (i = timelineKeyStartIndex;
      timelineInSelection && i < svgObj.dataKeys.length-1; i++) {
          
        // Calculate the first y-value for the line
        var key1 = svgObj.dataKeys[i];
        var dy1 = Number(dataPoint[key1]);
        // If the value in the CSV for this dataKey isNaN, set the y-value to
        // be the minimum value in a timeline
        if (isNaN(dy1)) {
            dy1 = svgObj.yScale(svgObj.yScale.domain()[0]);
        }
        // Otherwise, calculate the y-value for the line
        else {
            dy1 = svgObj.yScale(dy1);
        }

        // Calculate the second y-value for the line
        var key2 = svgObj.dataKeys[i+1];
        var dy2 = Number(dataPoint[key2]);
        // If the value in the CSV for this dataKey isNaN, set the y-value to
        // be the minimum value in a timeline
        if (isNaN(dy2)) {
            dy2 = svgObj.yScale(svgObj.yScale.domain()[0]);
        }
       // Otherwise, calculate the y-value for the line
       else {
            dy2 = svgObj.yScale(dy2);
        }

        // Calculate dx1 and dx2 from the dates/keys
        var dateString1 = dateCreator(key1).toDateString();
        var dateString2 = dateCreator(key2).toDateString();
        var dx1 = svgObj.xScale(dateString1) + svgPadding + chartPadding;
        var dx2 = svgObj.xScale(dateString2) + svgPadding + chartPadding;
        
        // Make a final adjustment to dy1 and dy2
        dy1 = dy1 + svgPadding;
        dy2 = dy2 + svgPadding;
        
        // Make sure the line lies within the selection box's bounds
        if (!(x1 < dx1 && dx1 < x2 && x1 < dx2 && dx2 < x2 &&
          y1 < dy1 && dy1 < y2 && y1 < dy2 && dy2 < y2)) {
            timelineInSelection = false;
        }
    }
    
    // Return the boolean value for whether the timeline for this dataPoint
    // should be selected
    return timelineInSelection;
}