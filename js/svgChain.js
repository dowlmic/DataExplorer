/*
 * This file contains all functions related to creating the SVG chain.
 */

// A helper/wrapper function to start an SVG graph chain based on data that is
// input when a timeline is clicked
function startSVGChain(data, preferredColor) {
    return function() {
        // First determine which timeline was selected and highlight the
        // corresponding SVG
        var tagType = this.tagName;
        var thisID = d3.select(this).attr("id");
        d3.select(this.parentNode).selectAll(tagType)[0].forEach( function(d) {

            if (d3.select(d).attr("id") == thisID) {
                d3.select(d).style("border", "3px solid lightgreen");
            }
            else {
                d3.select(d).style("border", "1px solid black");
            }
        });

        // Remove all elements within the mainInnerContainer to start the SVG
        // chain over
        if (svgCount > 0) {
            d3.select("#mainInnerContainer").selectAll("*").remove();
        }

        // Reset the SVG count
        svgCount = 0;

        // Create a new SVG with the data from the selected timeline to start a
        // new SVG chain
        createSVG(data, d3.select("#mainInnerContainer").append("div")
            .style("margin", "10px 0px"), preferredColor);
    }
}

// Function to dynamically create a graph at the given location based on the
// given data
function createSVG(data, location, preferredColor=d3.scale.category10()(0)) {

    // Initialize SVG div
    var svgBottomMargin = 50;
    var svgName = "svg-" + svgCount;
    var svgDiv = location.append("div")
        .attr("id", svgName)
        .style("margin-bottom", svgBottomMargin + "px");

    // Adjust the z-index of all the SVGs and their parent divs to ensure
    // dropdown menus overlay properly
    var i;
    for (i = 0; i < svgCount; i++) {
        var svg = d3.select("#svg-" + i);
        svg.style("z-index", svgCount - i + 2);
        d3.select(svg[0][0].parentNode).style("z-index", svgCount - i + 2);
    }

    // Initialize SVG data
    var currentGraph = defaultGraph;
    var dataKeys = Object.keys(data[0]);
    var xKey;
    var yKey;
    if (isTimeseries) {
        xKey = dataKeys[timelineKeyStartIndex];
        yKey = dataKeys[timelineKeyStartIndex+1];
    }
    else {
        xKey = dataKeys[1];
        yKey = dataKeys[2];
    }
    var colorKey = NO_SELECTION;
    var selectedColors = null;
    var colorScale = null;
    var sizeKey = NO_SELECTION;
    var shapeKey = NO_SELECTION;
    var shapeDict = null;

    // If this SVG is based on another one, set this SVG's data to persist the
    // visual attributes of the previous SVG
    if (svgCount > 0) {
        var prevSVGObj = svgData["svg-" + (svgCount-1)];
        currentGraph = prevSVGObj.currentGraph;
        xKey = prevSVGObj.xKey;
        yKey = prevSVGObj.yKey;
        colorKey = prevSVGObj.colorKey;
        selectedColors = prevSVGObj.selectedColors;
        preferredColor = prevSVGObj.preferredColor || preferredColor;
        colorScale = prevSVGObj.colorScale;
        sizeKey = prevSVGObj.sizeKey;
        shapeKey = prevSVGObj.shapeKey;
        shapeDict = prevSVGObj.shapeDict;
    }
    
    // Create a new SVG object for this SVG
    var svgObj = {
        name: svgName,
        currentGraph: currentGraph,
        data: data,
        dataKeys: dataKeys,
        xKey: xKey,
        prevXKey: xKey,
        yKey: yKey,
        prevYKey: yKey,
        colorKey: colorKey,
        selectedColors: selectedColors,
        colorScale: colorScale,
        preferredColor: preferredColor,
        prevColorKey: colorKey,
        sizeKey: sizeKey,
        prevSizeKey: sizeKey,
        shapeKey: shapeKey,
        prevShapeKey: shapeKey,
        shapeDict: shapeDict
    };

    // Save the new svgObj
    svgData[svgName] = svgObj;

    // Initialize divs for the graph type, x-variable, and y-variable dropdown
    // menus above the graph
    var topSelectorDiv = svgDiv.append("div")
        .style("min-width", (width+100) + "px")
        .style("z-index", 3);
    var graphSelectorDiv = topSelectorDiv.append("div")
        .attr("class", "dropdown")
        .attr("id", svgObj.name + "-graph")
        .style("z-index", 4);
    var xSelectorDiv = topSelectorDiv.append("div")
        .attr("class", "dropdown")
        .attr("id", svgObj.name + "-xaxis")
        .style("z-index", 3);
    var ySelectorDiv = topSelectorDiv.append("div")
        .attr("class", "dropdown")
        .attr("id", svgObj.name + "-yaxis")
        .style("z-index", 2);

    // Initialize the graph    
    svgDiv.append("br");
    svgObj.svg = svgDiv.append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("z-index", 1);
    svgObj.svg.append("g").attr("class", "nodes");

    // Initialize the legend and give it a maximum width equal to the width of
    // an SVG
    svgObj.legend = svgDiv.append("div")
        .attr("class", "legend")
        .style("max-width", width + "px");
    svgObj.legend.append("h3").text("Legend");

    // Initialize divs for the size, shape, and color dropdown menus below the
    // graph
    svgDiv.append("br");
    var bottomSelectorDiv = svgDiv.append("div")
        .style("min-width", (width+100) + "px")
        .style("z-index", 2);    
    var colorSelectorDiv = bottomSelectorDiv.append("div")
        .attr("class", "dropdown")
        .attr("id", svgObj.name + "-color")
        .style("z-index", 4);
    var sizeSelectorDiv = bottomSelectorDiv.append("div")
        .attr("class", "dropdown")
        .attr("id", svgObj.name + "-size")
        .style("z-index", 3);
    var shapeSelectorDiv = bottomSelectorDiv.append("div")
        .attr("class", "dropdown")
        .attr("id", svgObj.name + "-shape")
        .style("z-index", 2);
    svgDiv.append("br");

    // Create the graph type dropdown menu
    graphSelectorDiv.append("p").style("margin-left", "0px").text("Graph Type: ");
    createGraphSelector(graphSelectorDiv, svgObj);

    // Create the x-variable dropdown menu
    xSelectorDiv.append("p").text("X-Axis: ");
    createAttributeSelector(xSelectorDiv, KEY_TYPES.X_KEY,
        svgChainAttributeSelectorClick, svgObj.dataKeys, svgObj);

    // Create the y-variable dropdown menu
    ySelectorDiv.append("p").text("Y-Axis: ");
    createAttributeSelector(ySelectorDiv, KEY_TYPES.Y_KEY,
        svgChainAttributeSelectorClick, svgObj.dataKeys, svgObj);

    // Create the color dropdown menu
    colorSelectorDiv.append("p").text("Color: ");
    createAttributeSelector(colorSelectorDiv, KEY_TYPES.COLOR_KEY,
        svgChainAttributeSelectorClick, svgObj.dataKeys, svgObj);

    // Create the size dropdown menu
    sizeSelectorDiv.append("p").text("Size: ");
    createAttributeSelector(sizeSelectorDiv, KEY_TYPES.SIZE_KEY,
        svgChainAttributeSelectorClick, svgObj.dataKeys, svgObj);

    // Create the shape dropdown menu
    shapeSelectorDiv.append("p").text("Shape: ");
    createAttributeSelector(shapeSelectorDiv, KEY_TYPES.SHAPE_KEY,
        svgChainAttributeSelectorClick, svgObj.dataKeys, svgObj);

     // Create places to put the x- and y-axes
     var xPadding = svgPadding+chartPadding;
     var xYPadding = height-svgPadding-chartPadding;
     createAxesLocations(svgObj.svg, xPadding, xYPadding, svgPadding);

    // Finish creating the graph
    createGraph(svgObj);

    // Ensure that only relevant dropdown menus can be used
    changeDropDownMenusAvalable(svgObj);

    // Scroll to the new SVG
    var scroll = (height+150+svgBottomMargin)*svgCount;
    $("#mainContainer").animate({scrollTop: scroll}, 1500);

    // Increment the graph counter
    svgCount++;
}

// Function to dynamically create a graph within an SVG using the given svgObj
function createGraph(svgObj) {
    createScales(svgObj);

    // Place x- and y-scales
    svgObj.xAxis = d3.svg.axis()
        .scale(svgObj.xScale)
        .orient("bottom")
        .tickFormat(function(d) {
            if (svgObj.currentGraph == GRAPH_TYPES.BARCHART_OVERVIEW ||
              svgObj.currentGraph == GRAPH_TYPES.TIMELINE) {
                return d;
            }
            else {
                return formatTick(d, this);
            }
        });
    svgObj.yAxis = d3.svg.axis()
        .scale(svgObj.yScale)
        .orient("left")
        .tickFormat(function(d) { return formatTick(d, this); });

     // Create the nodes
     createNodes(svgObj);

     // Allow users to select nodes
     svgObj.svg.call(enableNodeSelection(svgObj));

     // Finish drawing/transitioning the rest of the graph
     updateGraph(svgObj);
}

// Function to create the scales for the x-axis, y-axis, color, size, and shape
function createScales(svgObj) {
    // Only use this method for creating x- and y- scales for scatterplots,
    // barcharts, and heatmaps
    if (svgObj.currentGraph == GRAPH_TYPES.SCATTERPLOT ||
      svgObj.currentGraph == GRAPH_TYPES.BARCHART ||
      svgObj.currentGraph == GRAPH_TYPES.HEATMAP) {      
      
        // Create the x-scale
        svgObj.xScale = createAxisScale(svgObj.data, svgObj.xKey, 0, (width-svgPadding*2-chartPadding*2));

        // Create the x-scale
        svgObj.yScale = createAxisScale(svgObj.data, svgObj.yKey, (height-svgPadding*2-chartPadding), 0);

        // Only create a color scale for scatterplots and barcharts
        if (svgObj.currentGraph == GRAPH_TYPES.SCATTERPLOT ||
          svgObj.currentGraph == GRAPH_TYPES.BARCHART) {
          
            // If the value in the column for the colorKey in the first row of
            // the data cannot be parsed as a number, assume the data is
            // categorical and create a dictionary to use to assign color to
            // categories
            if (isNaN(svgObj.data[0][svgObj.colorKey]) && svgObj.colorKey != NO_SELECTION) {
                
                // Get the number of categories in the data and make sure that
                // there are no more than 20 categories
                var colorCategories = getCategories(svgObj.data, svgObj.colorKey);
                if (colorCategories.length <= 20) {
                    
                    // Get a copy of the current set of selectedColors and their
                    // keys
                    var selectedColorsCopy = $.extend(true, {}, svgObj.selectedColors);
                    var selectedColorKeys = Object.keys(selectedColorsCopy);
                    
                    // Ensure the colorScale is null
                    svgObj.colorScale = null;
                    
                    // If there are no current selected colors or if the number
                    // of categories that need colors assigned to them has
                    // changed, then simply redo the selectedColors dictionary
                    if (svgObj.selectedColors == null ||
                       selectedColorKeys.length != colorCategories.length) {
                       
                        // If the number of categories is less than or equal to
                        // 10, then use D3's category10 color scale. This uses
                        // fewer colors and is more visually appealing when
                        // using less data
                        var colors;
                        if (colorCategories.length <=10) {
                            colors = d3.scale.category10();
                        }
                        // If the number of categories is greater than 10, use
                        // D3's category20 color scale
                        else {
                            colors = d3.scale.category20();
                        }
                        
                        // Reset the selectedColors dictionary to an empty
                        // object. Iterate through each of the categories,
                        // assign a color to it, and save it in the dictionary
                        svgObj.selectedColors = {};
                        var i;
                        for (i = 0; i < colorCategories.length; i++) {
                            svgObj.selectedColors[colorCategories[i]] = colors(i);
                        }
                    }
                    // If the number of categories that need colors has not
                    // changed, persist the color choices from the previous set
                    // of selectedColors
                    else {
                        // Rest the selectedColors dictionary to an empty object.
                        // Iterate through the new categories and assign them
                        // to the colors of the old categories
                        svgObj.selectedColors = {};
                        var i;
                        for (i = 0; i < colorCategories.length; i++) {
                            svgObj.selectedColors[colorCategories[i]] = selectedColorsCopy[selectedColorKeys[i]];
                        }
                    }
                }
                // If an attribute with too many categories has been selected,
                // alert the user and reset the colorKey
                else {
                    alert("There are too many categories in " + svgObj.colorKey +
                        " to visualize. Please pick a variable that has " +
                        "20 or fewer categories.");
                    svgObj.colorKey = svgObj.prevColorKey;
                    d3.select("#" + svgObj.name + "-color").select("button")
                        .text(svgObj.colorKey)
                        .append("span")
                        .attr("class", "caret");
                    return;
                }
            }
            // If the value in the column for the colorKey in the first row in
            // the CSV can be parsed as a number, then assume the data is
            // continuous and create a continuous color scale
            else if (svgObj.colorKey != NO_SELECTION) {
                // Set selectedColors to null
                svgObj.selectedColors = null;
                
                // Get the min and max values for the column for the colorKey
                // in the CSV
                var colorMinMax = getMinMax(svgObj.data, svgObj.colorKey);
                
                // If there is an existing colorScale, then persist the color
                // choices. Otherwise, start the colorScale at white and end at
                // the preferred color
                var colorRange;
                if (svgObj.colorScale != null) {
                    colorRange = $.extend(true, [], svgObj.colorScale.range());
                }
                else {
                    colorRange = ["rgb(255, 255, 255)", svgObj.preferredColor]
                }
                
                // Create the colorScale using D3
                svgObj.colorScale = d3.scale.linear()
                    .domain([colorMinMax.min, colorMinMax.max])
                    .range(colorRange);
            }
        }

        // Only create size and shape scales for scatterplots
        if (svgObj.currentGraph == GRAPH_TYPES.SCATTERPLOT) {
            // Create size scale
            
            // If the value in the column for the sizeKey in the first row in
            // the CSV can be parsed as a number, assume the data is continuous
            // and create a size scale
            if (!isNaN(svgObj.data[0][svgObj.sizeKey]) && svgObj.sizeKey != NO_SELECTION) {
                // Get the min and max values in the column for the sizeKey in
                // the CSV and create a continuous scale that maps these values
                // to a number between 20 and 200 (inclusive) for size
                var sizeMinMax = getMinMax(svgObj.data, svgObj.sizeKey);
                svgObj.sizeScale = d3.scale.linear()
                    .domain([sizeMinMax.min, sizeMinMax.max])
                    .range([20, 200]);
            }
            // If the value in the column for the sizeKey in the first row in
            // the CSV can't be parsed as a number, assume the data is
            // categorical and alert the user that the data cannot be used to
            // create a size scale. Reset the sizeKey to the prevSizeKey and
            // do not update the graph
            else if (svgObj.sizeKey != NO_SELECTION) {
                alert("The attribute " + svgObj.sizeKey + " cannot be " +
                    "used to create a size scale. Please select a " +
                    "different attribute.");
                svgObj.sizeKey = svgObj.prevSizeKey;
                d3.select("#" + svgObj.name + "-size").select("button")
                        .text(svgObj.sizeKey)
                        .append("span")
                        .attr("class", "caret");
                return;
            }

            // Create shape dictionary
            if (svgObj.shapeKey != NO_SELECTION) {
                // Assume the data is categorical and get the different
                // categories in the column for shapeKey in the CSV
                var shapeCategories = getCategories(svgObj.data, svgObj.shapeKey);
                
                // If the number of shapeCategories is less than or equal to
                // the number of supported shapes, create the shapeDict to map
                // each category to a specific shape
                if (shapeCategories.length <= SHAPES.length) {
                    // Only make changes if the shapKey is different than the
                    // prevShapeKey
                    if (svgObj.shapeKey != svgObj.prevShapeKey) {
                        // Reset the shapeDict and iterate through the
                        // shapeCategories to assign a shape to every category
                        var shapeDict = {};
                        var i;
                        for (i = 0; i < shapeCategories.length; i++) {
                            shapeDict[shapeCategories[i]] = SHAPES[i];
                        }
                        
                        // Save this shapeDict in the svgObj
                        svgObj.shapeDict = shapeDict;
                    }
                }
                // If an attribute with too many categories has been selected,
                // alert the user, reset the shapeKey, and do not update the
                // graph
                else {
                    alert("There are too many categories in " + svgObj.shapeKey +
                        " to visualize. Please pick a variable that has " +
                        SHAPES.length + " or fewer categories.");
                    svgObj.shapeKey = svgObj.prevShapeKey;
                    d3.select("#" + svgObj.name + "-shape").select("button")
                        .text(svgObj.shapeKey)
                        .append("span")
                        .attr("class", "caret");
                    return;
                }
            }
        }
    }
    // For barchart overviews and timelines, the xScales and yScales need to be
    // created differently
    else if (svgObj.currentGraph == GRAPH_TYPES.BARCHART_OVERVIEW ||
      svgObj.currentGraph == GRAPH_TYPES.TIMELINE) {
        // Create an ordinal scale for the x-axis based off the date names
        var xRange = [0, (width-svgPadding*2-chartPadding*2)];
        svgObj.xScale = getTimelineXScale(getDateList(svgObj.data[0]), xRange);

        // Create a continuous scale for the y-axis
        var yRange = [(height-svgPadding*2-chartPadding-1), 0];
        svgObj.yScale = getTimelineYScale(svgObj.data, svgObj.dataKeys, yRange);
    }
}

// A helper function to create an x-axis or y-axis scale for scatterplots,
// barcharts, and heatmaps
function createAxisScale(data, key, rangeMin, rangeMax) {
        // If the value in the first row of the CSV in the column for the given
        // key cannot be parsed as a number, assume that the data is categorical
        // and create a categorical scale
        if (isNaN(data[0][key])) {
            // Get a list of categories within the data and prepend "" and
            // append " " to provide padding in the scale
            var categories = getCategories(data, key);
            categories.push(" ");
            categories.unshift("");
            
            // Create a scale for the axis that will span from rangeMin to
            // rangeMax
            return d3.scale.ordinal()
                .domain(categories)
                .rangePoints([rangeMin, rangeMax]);
        }
        // If the value in the first row of the CSV in the column for the given
        // key can be parse as a number, assume the data is continuous and
        // create a continuous scale
        else {
            // Get the min and the max values within the column for the given
            // key
            var minMax = getMinMax(data, key);
            
            // Calculate a scale padding to help the graph look more appealing
            var axisScalePadding;
            if (minMax.min == minMax.max) {
                axisScalePadding = 0.1*minMax.max;
            }
            else {
                axisScalePadding = (minMax.max - minMax.min)*scalePadding;
            }
            
            // Create a continuous scale from min-axisScalePadding to
            // max+axisScalePadding that will span the from rangeMin to rangeMax.
            // Also, make sure the tick marks don't have crazy values by calling
            // nice()
            return d3.scale.linear()
                .domain([minMax.min-axisScalePadding, minMax.max+axisScalePadding])
                .range([rangeMin, rangeMax])
                .nice();
        }
}

// A helper function to get the number of categories in the given data based on
// the given key
function getCategories(data, key) {
    // Intialize a blank list to store all the categories found
    var categories = [];
    
    // Iterate through each datapoint and look at the value associated with the
    // given key. If it's not already in the caregories list, add it
    var i;
    for (i = 0; i < data.length; i++) {
        var value = data[i][key];
        if (categories.indexOf(value) < 0) {
            categories.push(value);
        }
    }
    
    // Return the list of categories
    return categories;
}

// A helper function to get the min and max in the given data based on the given
// key
function getMinMax(data, key) {
    // Initialize a blank list to store all the values in all rows of the data
    // for the given key
    var values = [];
    
    // Iterate through each datapoint and add the value associated with the
    // given key to the array
    var i;
    for (i = 0; i < data.length; i++) {
        var value = data[i][key];
        values.push(value);
    }
    
    // Get the min and max values from the array
    var min = Math.min(...values);
    var max = Math.max(...values);
    
    // Return the min and max together in an object
    return new Object({ min: min, max: max });;
}

// Function to create the nodes for the graph based on the properties in svgObj
function createNodes(svgObj) {
     // For scatterplots and barcharts, there is one point/bar per data point
     if (svgObj.currentGraph == GRAPH_TYPES.SCATTERPLOT ||
       svgObj.currentGraph == GRAPH_TYPES.BARCHART) {
       
        // Create g elements for each data point to hold the nodes
         svgObj.nodes = d3.select("#" + svgObj.name).select(".nodes")
            .selectAll(".node")
            .data(svgObj.data)
            .enter()
                .append("g");
                
        // If the currentGraph is a scatterplot, append a path element with the
        // class "node"
        if (svgObj.currentGraph == GRAPH_TYPES.SCATTERPLOT) {
            svgObj.nodes.append("path").attr("class", "node");
        }
        // if the currentGraph is a barchart, append a rect element with the
        // class "node"
        else if (svgObj.currentGraph == GRAPH_TYPES.BARCHART) {
            svgObj.nodes.append("rect").attr("class", "node");
        }
        
        // Append a title element to all nodes that will show the x- and y-
        // values for that node
        svgObj.nodes.append("title")
            .text(function(d) { return d[svgObj.xKey] + ", " + d[svgObj.yKey]; });
     }
     // For heatmaps, data is aggregated into individual rect elements
     else if (svgObj.currentGraph == GRAPH_TYPES.HEATMAP) {
         // Get the attributes to help determine the coordinates and size of the
         // heatmap squares
         var xAttributes = getHeatmapSquareAttributes(svgObj.xScale);
         var yAttributes = getHeatmapSquareAttributes(svgObj.yScale);

         // Initialize a list to contain the data for each square in the heatmap
         svgObj.heatData = [];

         // Iterate through each row in the heatmap, starting with the bottom
         // row
         var yCoord = yAttributes.min;
         var i;
         for (i = 0; i < yAttributes.numRowsOrCols; i++) {
             // Get the y-coordinate for the left side and height of the heatmap
             // square relative to the data
             var yValue = getHeatmapSquareCoordinate(yCoord, svgObj.yScale,
                yAttributes.isNaN);
             var squareHeight = getHeatmapSquareLength(i,
                yAttributes.numRowsOrCols, svgObj.yScale, yAttributes.step,
                yAttributes.isNaN);

             // Iterate through each column, starting from the left
             var xCoord = xAttributes.min;
             var j;
             for (j = 0; j < xAttributes.numRowsOrCols; j++) {
                 // Get the x-coordinate and width of the heatmap sqaure
                 // relative to the data
                 var xValue = getHeatmapSquareCoordinate(xCoord, svgObj.xScale,
                    xAttributes.isNaN);
                 var squareWidth = getHeatmapSquareLength(j,
                    xAttributes.numRowsOrCols, svgObj.xScale, xAttributes.step,
                    xAttributes.isNaN);

                 // Initialize the data for the current square and add it to
                 // heatData
                 svgObj.heatData.push({ count: 0, x: xValue, y: yValue,
                     width: squareWidth, height: squareHeight, data:[] });

                 // Increment the xCoord to caclulate the next x bin
                 xCoord += xAttributes.step;
             }

             // Increment the yCoord to calculate the next y bin
             yCoord += yAttributes.step;
         }

         // Iterate through each data point and determine which heatmap square
         // it falls within. For that heatmap square, increment its count and
         // add the data point to the square's data array
         svgObj.data.forEach(function(d, i) {
             // Calculate the col in the heatmap that this datapoint falls in
             var x = d[svgObj.xKey];
             if (isNaN(x)) {
                 x = svgObj.xScale.domain().indexOf(x);
             }
             var col = Math.floor((x - xAttributes.min) / xAttributes.step);
             
             // Calculate the row in the heatmap that this datapoint falls in
             var y = d[svgObj.yKey];
             if (isNaN(y)) {
                 y = svgObj.yScale.domain().indexOf(y);
             }
             var row = Math.floor((y - yAttributes.min) / yAttributes.step);

             // Based on the row and col, find the index of the heatmap square
             // that this datapoint falls in. Increment its count and add the
             // datapoint to the square's data array
             var index = row*xAttributes.numRowsOrCols + col;
             svgObj.heatData[index].count++;
             svgObj.heatData[index].data.push(d);
         });

        // Since the number of squares can change, remove all existing nodes.
        // This prevents issues when transitioning the heatmap to different
        // squares
        var thisSVG = d3.select("#" + svgObj.name).select("svg");
        thisSVG.selectAll(".nodes").remove();
        thisSVG.append("g").attr("class", "nodes");

         // Add the squares to the screen
         svgObj.nodes = d3.select("#" + svgObj.name).select(".nodes")
            .selectAll(".node")
            .data(svgObj.heatData)
            .enter()
                .append("g")
                .append("rect")
                .attr("class", "node");
     }
     // For barchart overviews, every row has a set of bars
     else if (svgObj.currentGraph == GRAPH_TYPES.BARCHART_OVERVIEW) {
         // For every node, append a g element with the class "node"
         svgObj.nodes = d3.select("#" + svgObj.name).select(".nodes")
            .selectAll(".node")
            .data(svgObj.data)
            .enter()
                .append("g")
                .attr("class", "node");

         // Calculate the total width for a single bar
         var numKeys = svgObj.dataKeys.length;
         var barWidth = (width - svgPadding*2 - chartPadding*2)*(1 - scalePadding*2)/numKeys - 5;
         var barPadding = 5;
                
         // For every g with the class "node", append a set of bars for the
         // barchart overview for this datapoint
         svgObj.nodes.each(function(d, i) {
             // Select the element to append the rect elements to
            var selection = d3.select(svgObj.nodes[0][i]);

            // Iterate through all the date keys, skipping the keys for metadata
            var i;
            for (i = timelineKeyStartIndex; i < numKeys; i++) {
                // Calculate the height of this bar
                var key = svgObj.dataKeys[i];
                var value = Number(d[key]);
                var barHeight;
                // For timeseries data, all values should be numbers. If the
                // value can't be parsed as a number, then set the bar's height
                // to the minimum height
                if (isNaN(value)) {
                    barHeight = svgObj.yScale(svgObj.yScale.domain()[0]);
                }
                // If the value in the CSV can be parsed as a number, set the
                // bar's height using the value and the yScale
                else {
                    barHeight = svgObj.yScale(value);
                }

                // Get the string representation for this date/column name
                var dateString = dateCreator(key).toDateString();

                // Put the rect element as a child of the selected element
                selection.append("rect")
                    .attr("x", svgObj.xScale(dateString) + svgPadding + chartPadding - barWidth/2)
                    .attr("y", barHeight + barPadding - 1)
                    .attr("width", barWidth)
                    .attr("height", height - barHeight - svgPadding - chartPadding - barPadding)
                    .style("fill", svgObj.preferredColor)
                    .style("opacity", 0.1);
            }
            
            // Append a title to the node to show the name of the topic on
            // hover. The topic name is assumed to be in the fist column of the
            // CSV
            // TODO: The tooltip shows the topic name of the topmost bar. For
            // this view, this may be confusing to some users as the bar that
            // they are hovering over may not be the bar that they think since
            // the bars all overlap. It may be better to graph bars so that the
            // tallest bar is drawn first
            selection.append("title").text(d[svgObj.dataKeys[0]]);
         });
     }
     // For timelines, every row has a timeline
     else if (svgObj.currentGraph == GRAPH_TYPES.TIMELINE) {
         // Grab the SVG div to put the timelines and calculate the x- and y-
         // padding
         var location = d3.select("#" + svgObj.name);
         var xPadding = svgPadding + chartPadding;
         var yPadding = svgPadding;
         
         // Use a helper function to plot the timelines
         placeTimelineNodes(location, svgObj.data, svgObj.dataKeys,
            svgObj.xScale, svgObj.yScale, xPadding, yPadding,
            svgObj.preferredColor, 0.2);
     }

     // Allow clicking nodes to view data for timeseries data
     if (isTimeseries && svgObj.currentGraph != GRAPH_TYPES.HEATMAP) {
         d3.select("#"+svgObj.name).selectAll(".node")
            .on("click", function(d) { openNodeDialog(d, svgObj); });
     }
}

// A helper function to calculate the min, step, number of columns or rows, and
// determine whether the values should be considered NaN. These attributes are
// used to calculate the coordinates, width, and height associated with each
// heatmap square
function getHeatmapSquareAttributes(scale) {
     // Assuming the the values are continuous, domain()[0] and domain()[1]
     // should be the endpoints for the values
     var min = scale.domain()[0];
     var max = scale.domain()[1];

     // If the x-values are not continuous, xMin should be "" and xMax should be
     // NaN. In this case, min and max should be changed to the indices of the
     // first and last data elements in scale.domain()
     var NaN = false;
     if (min == "" && isNaN(max)) {
         NaN = true;
         min = 1;
         max = scale.domain().length-2;
     }
     
     // Calculate the number of rows or cols in the heatmap and the step (which
     // will be translated to width and height) for each square
     var numRowsOrCols;
     var step;
     // For continuous data scales, there is an invert function. The existence
     // of this function is used to determine how to calculate numRowsOrCols and
     // step
     if (scale.invert) {
         // For continuous data, numRowsOrCols can be set to the sqaure root of
         // numHeatSquares and step can be set to the number to increment each
         // square's x- or y-value by
         numRowsOrCols = Math.floor(Math.sqrt(numHeatSquares));
         step = Math.abs(max - min) / numRowsOrCols;
     }
     else {
         // For categorical data, the step is set to be the number of
         // ticks/indices to skip over to get to the next x- or y-value
         var numDesiredRows = Math.floor(Math.sqrt(numHeatSquares));
         step = Math.floor((scale.domain().length-2)/numDesiredRows);
         if (step == 0) {
             step = 1;
         }

         // numRowsOrCols is set to be the number of squares that can cover step
         // ticks/indices rounded up
         numRowsOrCols = Math.ceil((scale.domain().length-2)/step);
     }
     
     // Return an object with all the attributes calculated for a heatmap's
     // xScale or yScale
     return { min: min, step: step, numRowsOrCols: numRowsOrCols, isNaN: NaN };
}

// A helper function to get the coordinate to associate with a heatmap square.
// This will either be the given coord for continuous data or the value in the
// scale's domain at the index coord
function getHeatmapSquareCoordinate(coord, scale, NaN) {
    if (NaN) {
        return scale.domain()[coord];
     }
     else {
         return coord;
     }
}

// A helper function to calculate the width or height of a heatmap square
function getHeatmapSquareLength(index, numRowsOrCols, scale, step, NaN) {
    // For categorical data, NaN will be true. At the last row or column, the
    // width or height of the heatmap square should be the remainder of
    // the amount of data in scale.domain()%step. Otherwise, the width or height
    // should just be step
    var remainderLength = (scale.domain().length-2) % step;
    if (index == numRowsOrCols-1 && NaN && remainderLength != 0) {
         return remainderLength;
     }
     else {
         return step;
     }
}

// A helper function to ensure that tick labels aren't too long
function formatTick(tickLabel, location) {
    // Only change tick labels if their labels are strings and if their lengths
    // are too long
    if (isNaN(tickLabel) && tickLabel.length > maxLabelLength) {
        // Use a title element to show the entire tick label when a user hovers
        // over the tick
        d3.select(location.parentNode).append("title").text(tickLabel);
        
        // Retirn "..." and the last maxLabelLength characters of the tick label
        return "..." + tickLabel.substring(tickLabel.length-maxLabelLength, tickLabel.length);
    }
    else {
        return tickLabel;
    }
}

// Function to finish drawing/transitioning the graph by assigning coordinates
// and visual attributes
function updateGraph(svgObj) {
    // Get the ID tag for the given svgObj
    var svgID = "#" + svgObj.name;
    
    // Initialize heatColorScale in case it is needed for a heatmap
    var heatColorScale;

    // For scatterplots, heatmaps, or barcharts, add the data to the nodes, give
    // them a linear transition, and assign the proper fill color
    if (svgObj.currentGraph == GRAPH_TYPES.SCATTERPLOT ||
      svgObj.currentGraph == GRAPH_TYPES.BARCHART ||
      svgObj.currentGraph == GRAPH_TYPES.HEATMAP) {
      
        // Update the nodes' data and make them transition linearly
        var nodes = d3.select(svgID).selectAll(".node")
            .data(function() {
                if (svgObj.currentGraph == GRAPH_TYPES.HEATMAP) {
                    return svgObj.heatData;
                }
                else {
                    return svgObj.data;
                }
            })
            .transition().ease("linear").duration(1000);

        // If the currentGraph is a heatmap, create the heatColorScale
        if (svgObj.currentGraph == GRAPH_TYPES.HEATMAP) {
            // Create an array of counts to find the max and min counts
            var counts = [];
            var i;
            for (i = 0; i < svgObj.heatData.length; i++) {
                counts.push(svgObj.heatData[i].count);
            }
            var countMin = Math.min(...counts);
            var countMax = Math.max(...counts);

            // Create even steps between the countMin and countMax
            var countSteps = [];
            for (i = 0; i < 5; i++) {
                countSteps.push(countMin + ((countMax - countMin) / 5 * i));
            }

            // Using countSteps, create a colorScale that ranges from
            // light yellow to orange to red to dark red
            heatColorScale = d3.scale.linear()
                .domain(countSteps)
                .range(["#ffffcc", "#fed976", "#fd8d3c", "#e31a1c", "#b30000"]);
        }

        // Determine the color of the nodes based on the colorKey
        nodes.style("fill", function (d) {
            // If the graph is a heatmap, use the heatColorScale
            if (svgObj.currentGraph == GRAPH_TYPES.HEATMAP) {
                return heatColorScale(d.count);
            }
            // If selectedColors != null, then use it for categorical colors
            else if (svgObj.colorKey != NO_SELECTION && svgObj.selectedColors != null) {
                return svgObj.selectedColors[d[svgObj.colorKey]];
            }
            // If colorScale != null, then use it for continuous colors
            else if (svgObj.colorKey != NO_SELECTION && svgObj.colorScale != null) {
                return svgObj.colorScale(d[svgObj.colorKey]);
            }
            // Default to preset preferredColor if no color choices are available
            else {
                return svgObj.preferredColor;
            }
        });
    }

    // For scatterplots, each node is a path element that can be manipulated to
    // have the color, size, and shape attributes desired
    if (svgObj.currentGraph == GRAPH_TYPES.SCATTERPLOT) {
        // Determine the size and shape of the nodes based on sizeKey
        // and shapeKey respectively
        nodes.attr("d", d3.svg.symbol()
            .size(function(d) {
                if (svgObj.sizeKey != NO_SELECTION) {
                    return svgObj.sizeScale(d[svgObj.sizeKey]);
                }
                else {
                    return 75;
                }   
            })
            .type(function(d) {
                if (svgObj.shapeKey != NO_SELECTION) {
                    return svgObj.shapeDict[d[svgObj.shapeKey]];
                }
                else {
                    return "circle";
                }
            })
        )
        // Determine x- and y-corrdinates to use to transition the path element
        // to the proper location on the graph
        .attr("transform", function(d) {
            var x = calculateXCoord(d, svgObj);
            var y = calculateYCoord(d, svgObj);
            return "translate(" + x + "," + y + ")";
        });
    }
    // For barcharts, each node is a rectangle that needs to have the x- and y-
    // coordinates, width, and height calculated in pixels
    else if (svgObj.currentGraph == GRAPH_TYPES.BARCHART) {
        // Calculate what the width of each bar should be
        var numXValues = getCategories(svgObj.data, svgObj.xKey).length;
        var barWidth = (width - svgPadding*2 - chartPadding*2)*(1 - scalePadding*2)/numXValues - 3;

        // Ensure that the bar widths aren't too big or too small
        // If they are too small, alert the user
        var canDrawGraph = true;
        var maxBarWidth = 60;
        if (barWidth < 1.5) {
            carDrawGraph = false;
            alert("There are too many categories in " + svgObj.xKey
                + " to display bars. Please choose a different variable.");
            if (svgObj.xKey != svgObj.prevXKey) {
                svgObj.xKey = svgObj.prevXKey;
                d3.select("#" + svgObj.name + "-xaxis").select("button")
                        .text(svgObj.xKey)
                        .append("span")
                        .attr("class", "caret");
                createGraph(svgObj);
            }
            return;
        }
        // If the bars are too wide, reset the barWidth to the maxBarWidth
        else if (barWidth > maxBarWidth) {
            barWidth = maxBarWidth;
        }

        // If the bar widths are not too small, draw the graph
        if (canDrawGraph) {
            nodes.attr("x", function(d) { return calculateXCoord(d, svgObj) - barWidth/2; })
                .attr("y", function(d) { return calculateYCoord(d, svgObj); })
                .attr("width", barWidth)
                .attr("height", function(d) {
                    return height - calculateYCoord(d, svgObj) - svgPadding - chartPadding - 1;
                })
                .style("opacity", 0.1);
        }
    }
    // For heatmaps, each heatmap square is a rect element that needs to have its
    // x- and y- coordinates, width, and height calculated
    else if (svgObj.currentGraph == GRAPH_TYPES.HEATMAP) {
        // Draw the squares
        nodes.attr("x", function(d) {
                // If there is only 1 column, then make the square start at the
                // leftmost position on the graph
                if (svgObj.xScale.domain().length == 3) {
                    return svgPadding + chartPadding;
                }
                // If there are more columns, then calculate the square's
                // position using it's x attribute
                else {
                    // Calculate the x-offset for the square
                    var xOffset = getHeatmapSquareOffset(d.x, svgObj.xScale);
                    
                    return svgObj.xScale(d.x) + svgPadding + chartPadding
                        - xOffset;
                }
            })
            .attr("y", function(d) {
                // Since the square's y attribute is the y-value associated with
                // its data, the y position used to map the sqaure to the screen
                // must have its height in pixels subtracted from the y position.
                // Therefore, the square's height must be calculated first
                var graphHeight = height - svgPadding*2 - chartPadding;
                d.squareHeight = getHeatmapLength(d.y, svgObj.yScale, d.height,
                    graphHeight, svgObj.data, svgObj.yKey);


                // Calculate the final y-coordinate of the heatmap sqaure
                // If there is only 1 row, make the y-position of the square the
                // topmost position on the graph
                if (svgObj.yScale.domain().length == 3) {
                    return svgPadding;
                }
                // Otherwise, determine the y-position and subtract the square's
                // height and add the offset and svgPadding
                else {
                    // Calculate the y-offset for the square
                    var yOffset = getHeatmapSquareOffset(d.y, svgObj.yScale);
                    
                    return svgObj.yScale(d.y) +
                        svgPadding - d.squareHeight - yOffset;
                }
            })
            .attr("width", function(d) {
                // Calculate the width of the square using a helper function
                var graphWidth = width - svgPadding*2 - chartPadding*2;
                return getHeatmapLength(d.x, svgObj.xScale, d.width, graphWidth,
                    svgObj.data, svgObj.xKey);
            })
            // The height for the square has already been calculated. The saved
            // value for this calculation is used
            .attr("height", function(d) { return d.squareHeight; });
    }

    // Remove old axes and transition new axes
    var xAxis = d3.select(svgID).select("#x-axis");
    xAxis.selectAll("g").remove();
    xAxis.transition()
        .duration(1000)
        .call(svgObj.xAxis);

    var yAxis = d3.select(svgID).select("#y-axis");
    yAxis.selectAll("g").remove();
    yAxis.transition()
        .duration(1000)
        .call(svgObj.yAxis);

    // Ensure there aren't too many ticks showing on the axes
    // For scatterplots, heatmaps, and barcharts, the hideSomeTicks helper is
    // called
    if (svgObj.currentGraph != GRAPH_TYPES.BARCHART_OVERVIEW &&
      svgObj.currentGraph != GRAPH_TYPES.TIMELINE) {
      
        hideSomeTicks(xAxis);
        hideSomeTicks(yAxis);
    }
    // For barchart overviews and timelines, the hideTimelineTicks helper is
    // called
    else {
        hideTimelineTicks(svgObj.svg, 8);
    }

    // Create the graph legend
    createGraphLegend(svgObj, heatColorScale);
}

// Helper function to calculate the x-coordinate of a data point
function calculateXCoord(dataPoint, svgObj) {
    // If the value for the given dataPoint isNaN, return 0
    if (isNaN(svgObj.xScale(dataPoint[svgObj.xKey]))) {
        return 0;
    }
    // Otherwise, calculate and return its x-coordinate in the SVG
    else {
        return svgPadding + chartPadding + svgObj.xScale(dataPoint[svgObj.xKey]);
    }
}

// Helper function to calculate the y-coordinate of a data point
function calculateYCoord(dataPoint, svgObj) {
    // If the value for the given dataPoint isNaN, return 0
    if (isNaN(svgObj.yScale(dataPoint[svgObj.yKey]))) {
        return 0;
    }
    // Otherwise, calculate and retirn its y-coordinate in the SVG
    else {
        return svgPadding + svgObj.yScale(dataPoint[svgObj.yKey]);
    }
}

// A helper function to calculate the x- and y-offest. For squares that have
// categorical data for the x- or y-values, the offset should be 1/2 a tick mark
// to make the sqaure centered around the ticks it covers. Otherwise, no offset
// is needed
function getHeatmapSquareOffset(value, scale) {
    // For categorical data, value will be NaN. To help align the
    // squares with the tick marks, the square should be offset by
    // half the width of a tick mark
    if (isNaN(value)) {
        return getTickDistance(1, scale) / 2;
    }
    // For continuous data, no offset is needed
    else {
        return 0;
    }
}

// A helper function to get the distance between two tick marks that are
// numTicks apart on a given scale
function getTickDistance(numTicks, scale) {
    // Get the position of the beginning tick mark and of the numTicks tick mark
    var begin = scale(scale.domain()[0]);
    var end = scale(scale.domain()[numTicks]);
    
    // Return the distance between the two tick marks
    return end - begin;
}

// A helper function to get the width or height of a heatmap square
function getHeatmapLength(value, scale, length, graphLength, data, key) {
    // If there is only 1 row/col, return the graph's width or height (passed as
    // graphLength
    if (scale.domain().length == 3) {
        return graphLength;
    }
    // If there are more rows/cols, for categorical data, value will be NaN. The
    // width/height of the sqaure should be set to the distance bewteen the last
    // tick and the length-to-last tick
    else if (isNaN(value)) {
        // For categorical data, the length is the number of ticks this square
        // should cover. This can be used to calculate the width/height of the
        // square in pixels.
        return Math.abs(getTickDistance(length, scale));
    }
    // For continuous data, the sqaure's width/height is the distance between
    // the tick for the first value and the tick for firstValue+length
    else {
        var minMax = getMinMax(data, key);
        var begin = scale(minMax.min);
        var end = scale(minMax.min + length);
        return Math.abs(end - begin);
    }
}

// Helper function to hide some ticks on the graph. The maximum number of ticks
// to show is 10, with endppints always shown
function hideSomeTicks(location) {
    // Set the maxTicks to 10 and grab all the ticks in the given axis location
    var maxTicks = 10;
    var ticks = location.selectAll(".tick");
    
    // If the number of ticks is greater than maxTicks, iterate through them all
    // and only let ones at speficic intervals be visible. This ensures that
    // only maxTicks (potentially maxTicks+1) ticks are visible. This also keeps
    // ticks lined up properly to draw barcharts
    if (ticks[0].length > maxTicks) {
        // Calculate the interval to show ticks at
        var tickMod = Math.floor(ticks[0].length/maxTicks);
        
        // Iterate through all ticks and assign them the proper class to make
        // them visible or invisible
        ticks.attr("class", function (d, i) {
            // If the index is either the proper interval or an enpoint, show it
            if (i%tickMod == 0 || i == ticks.length-1) {
                return "tick visible";
            }
            else {
                return "tick invisible";
            }
         });
    }
    // If the number of ticks is less than or equal to maxTicks, show them all
    else {
        ticks.attr("class", "tick visible");
    }
}