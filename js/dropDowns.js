/*
 * This file contains all methods to create the dropdown selectors, including
 * the graph selector and all attribute selectors.
 */


// Function to create a dropdown menu for the different graph types
function createGraphSelector(location, svgObj) {
    // Use bootstrap to create a dropdown menu at the desired location with the
    // text of the current graph
    var graphDropDown = location.append("button")
        .attr("class", "btn btn-default dropdown-toggle")
        .attr("type", "button")
        .attr("data-toggle", "dropdown")
        .text(function() {
            // Find the name of the currentGraph to use for the
            // button's text
            var graph;
            Object.keys(GRAPH_TYPES).forEach(function(graphType) {
               if (GRAPH_TYPES[graphType] == svgObj.currentGraph) {
                   graph = graphType;
                   return;
               }
            });
            return graph;
        });
        
    // Add the dropdown menu caret
    graphDropDown.append("span")
            .attr("class", "caret");

    // Add the list container for the dropdown menu items and make sure it is
    // placed under the dropdown button
    var graphDropDownElement = graphDropDown[0][0];
    var graphSelections = location.append("ul")
        .attr("class", "dropdown-menu")
        .style("margin-top", (graphDropDownElement.offsetHeight + 10) + "px")
        .style("margin-left", (function() {
            var leftMargin = graphDropDownElement.getBoundingClientRect().left - 100;
            if (isTimeseries) {
                    leftMargin -= d3.select("#leftContainer")[0][0].clientWidth;
            }
            return leftMargin + "px";
        }));

    // Add the name for each of the graph types to the dropdown menu
    var graphs = Object.keys(GRAPH_TYPES);
    var i;
    for (i = 0; i < graphs.length; i++) {
        graphSelections.append("li")
            .text(graphs[i])
            .on("click", function() {
                // Get the selected graph type
                var graph = this.innerHTML;
                var graphType = GRAPH_TYPES[graph];

                // If the graph type has changed, change the currentGraph and
                // the text of the dropdown menu
                if (svgObj.currentGraph != graphType) {
                    // Only make changes if the graph type if the  user is not
                    // switching to a heatmap or if the user is ok with not
                    // maintaining highlighted nodes
                    var shouldSwitchGraphs = true;
                    if (graphType == GRAPH_TYPES.HEATMAP) {
                        shouldSwitchGraphs = confirm("Selected nodes " +
                            "cannot maintain highlighting when switching " +
                            "to the Heatmap View. Do you wish to" +
                            " continue?");
                    }

                    if (shouldSwitchGraphs) {
                        // If the graph type is changing, change the dropdown
                        // menu text
                        graphDropDown.text(graph)
                            .append("span")
                            .attr("class", "caret");

                        // Change the currentGraph type so that the proper graph
                        // can be drawn
                        svgObj.currentGraph = graphType;

                        // Save the shapeKey so that shape selections can be
                        // persisted between scatterplot views
                        svgObj.prevShapeKey = svgObj.shapeKey;

                        // Remove all nodes
                        var thisSVG = d3.select("#" + svgObj.name).select("svg");
                        thisSVG.selectAll(".nodes").remove();
                        thisSVG.append("g").attr("class", "nodes");

                        // Create the new graph and maintain selected nodes
                        createGraph(svgObj);
                        if (svgObj.selectedData &&
                          svgObj.selectedData.length > 0) {
                            thisSVG.selectAll(".node").classed("selected", function(d) {
                               return svgObj.selectedData.indexOf(d) >= 0;
                            });
                        }

                        // Ensure that only relevant dropdown menus for visual
                        // attributes can be used
                        changeDropDownMenusAvalable(svgObj);
                    }
                }
            });
    }
}

// Create a dropdown menu to select between CSV attributes
function createAttributeSelector(location, keyType, clickFunction, dataKeys,
  svgObj, defaultText=null) {
    
    // Create the button for the dropdown menu and put the text for the key for
    // this visual attribute or the deafultText inside
    var dropDown = location.append("button")
            .attr("class", "btn btn-default dropdown-toggle")
            .attr("type", "button")
            .attr("data-toggle", "dropdown")
            .text(function() {
                if (svgObj) {
                    if (keyType == KEY_TYPES.X_KEY) {
                        return svgObj.xKey;
                    }
                    else if (keyType == KEY_TYPES.Y_KEY) {
                        return svgObj.yKey;
                    }
                    else if (keyType == KEY_TYPES.COLOR_KEY) {
                        return svgObj.colorKey;
                    }
                    else if (keyType == KEY_TYPES.SIZE_KEY) {
                        return svgObj.sizeKey;
                    }
                    else if (keyType == KEY_TYPES.SHAPE_KEY) {
                        return svgObj.shapeKey;
                    }
                }
                else {
                    return defaultText;
                }
            });

    // Add the dropdown caret
    dropDown.append("span")
            .attr("class", "caret");

    // Add the list container for the dropdown menu items and make sure it is
    // placed under the dropdown button
    var dropDownElement = dropDown[0][0];
    var selections = location.append("ul")
        .attr("class", "dropdown-menu")
        .style("margin-top", (dropDownElement.offsetHeight + 10) + "px")
        .style("margin-left", (function() {
            var leftMargin = dropDownElement.getBoundingClientRect().left - 100;
            if (isTimeseries && svgObj) {
                leftMargin -= d3.select("#leftContainer")[0][0].clientWidth;
            }
            return leftMargin + "px";
        }));
        
    // Only allow a max height of 300px for the dropdown menu items. Make the
    // menu scroll if there are too many itmes
    if (dataKeys.length > 10) {
        selections.style("height", "300px")
            .style("overflow", "hidden")
            .style("overflow-y", "scroll");
    }

    // Create a copy of dataKeys to append NO_SELECTION if appropriate without
    // altering dataKeys
    var selectionList = $.extend(true, [], dataKeys);
    if (keyType == KEY_TYPES.COLOR_KEY ||
      keyType == KEY_TYPES.SIZE_KEY || keyType == KEY_TYPES.SHAPE_KEY) {
        selectionList.unshift(NO_SELECTION);
    }


    // Iterate through the selectionList and add each selection to the dropdown
    // menu
    var i;
    for (i = 0; i < dataKeys.length; i++) {
        selections.append("li")
            .text(selectionList[i])

            // When an attribute is clicked, ensure that the button text chages
            // and that any necessary changes are made to the graph
            .on("click", function() {
                var generatedClickFunction;
                if (svgObj) {
                    clickFunction(this, dropDown, keyType, svgObj);
                }
                else {
                    clickFunction(this, dropDown);
                }
            });
    }
}

// Function to handle changing the key and visual attributes for this SVG when a
// key for a visual attribute is selected from a dropdown menu
function svgChainAttributeSelectorClick(element, dropDown, keyType, svgObj) {
    // After getting the selectedKey, determine what key the user is attempting
    // to change. If the selection is different, then update the key's value and
    // trigger updateGraph to reflect this new choice
    var keyChanged = false;
    var selectedKey = element.innerHTML;
    if (keyType == KEY_TYPES.X_KEY) {
        if (svgObj.xKey != selectedKey) {
            svgObj.prevXKey = svgObj.xKey;
            svgObj.xKey = selectedKey;
            keyChanged = true;
        }
    }
    else if (keyType == KEY_TYPES.Y_KEY) {
        if (svgObj.yKey != selectedKey) {
            svgObj.prevYKey = svgObj.yKey;
            svgObj.yKey = selectedKey;
            keyChanged = true;
        }
    }
    else if (keyType == KEY_TYPES.COLOR_KEY) {
        if (svgObj.colorKey != selectedKey) {
            svgObj.prevColorKey = svgObj.colorKey;
            svgObj.colorKey = selectedKey;
            keyChanged = true;
        }
    }
    else if (keyType == KEY_TYPES.SIZE_KEY) {
        if (svgObj.sizeKey != selectedKey) {
            svgObj.prevSizeKey = svgObj.sizeKey;
            svgObj.sizeKey = selectedKey;
            keyChanged = true;
        }
    }
    else if (keyType == KEY_TYPES.SHAPE_KEY) {
        if (svgObj.shapeKey != selectedKey) {
            svgObj.prevShapeKey = svgObj.shapeKey;
            svgObj.shapeKey = selectedKey;
            keyChanged = true;
        }
    }

    // Only trigger changes if the key has changed
    if (keyChanged) {
        // Change the text of the dropdown menu
        dropDown.text(selectedKey)
            .append("span")
            .attr("class", "caret");
        // Redraw the graph
        createGraph(svgObj);
        // Update the tooltips for the nodes, if applicable
        d3.select("#"+svgObj.name).selectAll(".node").each(function(d) {
            d3.select(this.parentNode).select("title")
                .text(d[svgObj.xKey] + ", " + d[svgObj.yKey])
        });
    }
}

// A helper function to determine which selector buttons should be enabled
// based on the currentGraph
function changeDropDownMenusAvalable(svgObj) {
    // Initiate the ID tags for the different dropdown menu buttons
    var startIDTag = "#" + svgObj.name + "-";

    // For scatterplots, all dropdown menus should be available
    if (svgObj.currentGraph == GRAPH_TYPES.SCATTERPLOT) {
        d3.select(startIDTag + "xaxis").select("button")[0][0].disabled = false;
        d3.select(startIDTag + "yaxis").select("button")[0][0].disabled = false;
        d3.select(startIDTag + "color").select("button")[0][0].disabled = false;
        d3.select(startIDTag + "size").select("button")[0][0].disabled = false;
        d3.select(startIDTag + "shape").select("button")[0][0].disabled = false;
    }
    // For barcharts, the size and shape dropdown menus should be disabled
    else if (svgObj.currentGraph == GRAPH_TYPES.BARCHART) {
        d3.select(startIDTag + "xaxis").select("button")[0][0].disabled = false;
        d3.select(startIDTag + "yaxis").select("button")[0][0].disabled = false;
        d3.select(startIDTag + "color").select("button")[0][0].disabled = false;
        d3.select(startIDTag + "size").select("button")[0][0].disabled = true;
        d3.select(startIDTag + "shape").select("button")[0][0].disabled = true;
    }
    // For heatmaps, the color, size, and shape dropdown menus should be disabled
    else if (svgObj.currentGraph == GRAPH_TYPES.HEATMAP) {
        d3.select(startIDTag + "xaxis").select("button")[0][0].disabled = false;
        d3.select(startIDTag + "yaxis").select("button")[0][0].disabled = false;
        d3.select(startIDTag + "color").select("button")[0][0].disabled = true;
        d3.select(startIDTag + "size").select("button")[0][0].disabled = true;
        d3.select(startIDTag + "shape").select("button")[0][0].disabled = true;
    }
    // For barchart overviews or timelines, all dropdown menus for visual
    // attributes should be disabled
    else if (svgObj.currentGraph == GRAPH_TYPES.BARCHART_OVERVIEW ||
      svgObj.currentGraph == GRAPH_TYPES.TIMELINE) {
        d3.select(startIDTag + "xaxis").select("button")[0][0].disabled = true;
        d3.select(startIDTag + "yaxis").select("button")[0][0].disabled = true;
        d3.select(startIDTag + "color").select("button")[0][0].disabled = true;
        d3.select(startIDTag + "size").select("button")[0][0].disabled = true;
        d3.select(startIDTag + "shape").select("button")[0][0].disabled = true;
      }
}