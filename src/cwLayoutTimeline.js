/* Copyright (c) 2012-2013 Casewise Systems Ltd (UK) - All rights reserved */

/*global cwAPI, jQuery */
(function(cwApi, $) {
  "use strict";
  if (cwApi && cwApi.cwLayouts && cwApi.cwLayouts.cwLayoutTimeline) {
    var cwLayoutTimeline = cwApi.cwLayouts.cwLayoutTimeline;
  } else {
    // constructor
    var cwLayoutTimeline = function(options, viewSchema) {
      cwApi.extend(this, cwApi.cwLayouts.CwLayout, options, viewSchema); // heritage
      this.viewSchema = viewSchema;
      cwApi.registerLayoutForJSActions(this); // execute le applyJavaScript après drawAssociations
      this.construct(options);
    };
  }

  cwLayoutTimeline.prototype.construct = function(options) {
    try {
      this.config = JSON.parse(this.options.CustomOptions["configuration"]);
    } catch (e) {
      console.log(e);
      this.config = { nodes: {}, stack: true };
    }
  };

  cwLayoutTimeline.prototype.getOption = function(options, name, splitter) {
    options = this.options.CustomOptions[options];
    this[name] = [];
    if (options) {
      var optionList = options.split(splitter);
      var optionSplit;
      for (var i = 0; i < optionList.length; i += 1) {
        if (optionList[i] !== "") {
          this[name].push(optionList[i]);
        }
      }
    }
  };

  cwLayoutTimeline.prototype.getItemDisplayString = function(item) {
    return cwAPI.customLibs.utils.getItemDisplayString(this.viewSchema.ViewName, item);
  };

  cwLayoutTimeline.prototype.parseNode = function(child, callback) {
    for (var associationNode in child.associations) {
      if (child.associations.hasOwnProperty(associationNode)) {
        for (var i = 0; i < child.associations[associationNode].length; i += 1) {
          var nextChild = child.associations[associationNode][i];
          callback(nextChild, associationNode);
        }
      }
    }
  };

  cwLayoutTimeline.prototype.simplify = function(child, father, level) {
    var childrenArray = [];
    var filterArray = [];
    var filtersGroup = [];
    var filteredFields = [];
    var groupFilter = {};
    var element, filterElement, groupFilter;
    var self = this;

    if (child && child.associations) {
      this.parseNode(child, function(nextChild, associationNode) {
        let config = self.config.nodes[nextChild.nodeID];
        if (config === undefined) config = {};
        if (config.isHidden) {
          // jumpAndMerge when hidden
          childrenArray = childrenArray.concat(self.simplify(nextChild, father, level + 1));
        } else {
          // adding regular node
          element = {};
          element.content = self.getItemDisplayString(nextChild);
          element.sort = nextChild.name;
          element.treeLevel = level;
          if (father) element.id = nextChild.object_id + "_" + nextChild.objectTypeScriptName + "_" + father.id;
          else element.id = nextChild.object_id + "_" + nextChild.objectTypeScriptName;
          element.objectTypeScriptName = nextChild.objectTypeScriptName;
          if (config && config.isLane === true) {
            element.group = father;
            element.children = self.simplify(nextChild, element, level + 1);
            if (element.children.length > 0) {
              element.nestedGroups = [];
              for (var k = 0; k < element.children.length; k += 1) {
                element.nestedGroups.push(element.children[k].id);
              }
            }
            self.timelineGroups.add(element);
            childrenArray.push(element);
            self.createTimelineItem(nextChild, element, element.id, config);
          } else {
            father.children = self.simplify(nextChild, father, level + 1);
            self.createTimelineItem(nextChild, element, father.id, config);
          }
        }
      });
    }
    return childrenArray;
  };

  cwLayoutTimeline.prototype.createTimelineItem = function(item, elem, group, config) {
    var self = this;
    if (config === undefined) return;
    for (let step in config.steps) {
      if (config.steps.hasOwnProperty(step) && config.steps[step].startProp && (config.steps[step].endProp || config.steps[step].type === "point" || config.steps[step].type === "box")) {
        let timelineItem = {};
        timelineItem.id = "timeElement_" + elem.id + "_" + step;
        timelineItem.group = group;
        if (config.steps[step].cds === "" || config.steps[step].cds == undefined) {
          timelineItem.content = "";
        } else {
          timelineItem.content = cwAPI.customLibs.utils.getCustomDisplayString(config.steps[step].cds, item);
        }

        timelineItem.start = item.properties[config.steps[step].startProp];
        if (config.steps[step].endProp) timelineItem.end = item.properties[config.steps[step].endProp];

        if (config.steps[step].tooltip !== undefined && config.steps[step].tooltip !== "") {
          timelineItem.title = cwAPI.customLibs.utils.getCustomDisplayString(config.steps[step].tooltip + "<@@><##>", item);
        }

        timelineItem.type = config.steps[step].type;
        if (config.steps[step].textColor === undefined) {
          config.steps[step].textColor = "#FFFFFF";
        }
        if (config.steps[step].backgroundColor === undefined) {
          config.steps[step].backgroundColor = "#26276d";
        }
        if (config.steps[step].borderColor === undefined) {
          config.steps[step].borderColor = "#26276d";
        }
        timelineItem.style = "color: " + config.steps[step].textColor + "; background-color: " + config.steps[step].backgroundColor + "; border-color: " + config.steps[step].borderColor + ";";

        self.timelineItems.add(timelineItem);
      }
    }
  };

  // obligatoire appeler par le system
  cwLayoutTimeline.prototype.drawAssociations = function(output, associationTitleText, object) {
    var cpyObj = $.extend({}, object);
    var assoNode = {};

    this.originalObject = $.extend({}, object);
    var simplifyObject,
      i,
      assoNode = {},
      isData = false;
    // keep the node of the layout
    assoNode[this.mmNode.NodeID] = object.associations[this.mmNode.NodeID];
    // complementary node
    /*this.complementaryNode.forEach(function(nodeID) {
      if (object.associations[nodeID]) {
        assoNode[nodeID] = object.associations[nodeID];
      }
    });*/
    cpyObj.nodeID = this.nodeID;
    cpyObj.associations = assoNode;

    this.JSONobjects = cpyObj;
    output.push('<div class="cw-visible cwLayoutTimelineButtons" id="cwLayoutTimelineButtons_' + this.nodeID + '">');
    if (cwApi.currentUser.PowerLevel === 1) output.push('<a class="btn page-action no-text fa fa-cogs" id="cwTimelineButtonsExpertMode' + this.nodeID + '" title="Expert mode"></i></a>');
    output.push('<a class="btn page-action no-text fa fa-arrows-alt" id="cwTimelineButtonsFit' + this.nodeID + '" title="' + $.i18n.prop("deDiagramOptionsButtonFitToScreen") + '"></a>');
    output.push('<a class="btn page-action no-text fa fa-download" id="cwTimelineButtonsDownload' + this.nodeID + '" title="' + $.i18n.prop("download") + '"></a>');
    output.push('<a class="btn page-action no-text fa fa-cubes" id="cwTimelineButtonsStack' + this.nodeID + '" title="' + $.i18n.prop("stack") + '"></a>');
    output.push("</div>");
    output.push('<div class="cw-visible" id="cwLayoutTimeline_' + this.nodeID + '"></div>');
  };

  cwLayoutTimeline.prototype.applyJavaScript = function() {
    var self = this;
    var libToLoad = [];

    if (cwAPI.isDebugMode() === true) {
      self.createTimeline();
    } else {
      libToLoad = ["modules/vis/vis.min.js"];
      // AsyncLoad
      cwApi.customLibs.aSyncLayoutLoader.loadUrls(libToLoad, function(error) {
        if (error === null) {
          self.createTimeline();
        } else {
          cwAPI.Log.Error(error);
        }
      });
    }
  };

  // Expert Mode Button Event
  cwLayoutTimeline.prototype.enableExpertModeButtonEvent = function() {
    var expertButton = document.getElementById("cwTimelineButtonsExpertMode" + this.nodeID);
    if (expertButton) {
      expertButton.addEventListener("click", this.manageExpertMode.bind(this));
    }
  };

  cwLayoutTimeline.prototype.enableStackButtonEvent = function() {
    var stackButton = document.getElementById("cwTimelineButtonsStack" + this.nodeID);
    if (stackButton) {
      stackButton.addEventListener("click", this.manageStackButton.bind(this));
    }
  };

  cwLayoutTimeline.prototype.enableFitButtonEvent = function() {
    var stackButton = document.getElementById("cwTimelineButtonsFit" + this.nodeID);
    var self = this;
    if (stackButton) {
      stackButton.addEventListener("click", function() {
        self.timeLineUI.fit();
      });
    }
  };

  // manage Expert Mode
  cwLayoutTimeline.prototype.manageStackButton = function(event) {
    var self = this;
    if (self.config.stack === true) {
      self.config.stack = false;
      event.target.title = $.i18n.prop("activate_stack_mode");
      event.target.classList.remove("selected");
      self.stackTimeline();
    } else {
      self.config.stack = true;
      event.target.title = $.i18n.prop("deactivate_stack_mode");
      event.target.classList.add("selected");
      self.unStackTimeline();
    }
  };
  cwLayoutTimeline.prototype.stackTimeline = function() {
    let options = {
      stack: this.config.stack,
      stackSubgroups: this.config.stack,
    };
    this.timeLineUI.setOptions(options);
  };

  cwLayoutTimeline.prototype.unStackTimeline = function() {
    let options = {
      stack: this.config.stack,
      stackSubgroups: this.config.stack,
    };
    this.timeLineUI.setOptions(options);
  };

  cwLayoutTimeline.prototype.deleteCurrentTimeline = function() {
    this.timeLineUI.destroy();
    var timeLineContainer = document.getElementById("cwLayoutTimeline_" + this.nodeID);
    timeLineContainer.innerHTML = "";
  };

  cwLayoutTimeline.prototype.createTimeline = function() {
    this.enableExpertModeButtonEvent();
    this.enableStackButtonEvent();
    this.enableFitButtonEvent();

    this.getAndParseData();
    this.createVisTimeline();
  };

  cwLayoutTimeline.prototype.updateTimeline = function() {
    this.getAndParseData();
    this.deleteCurrentTimeline();
    this.createVisTimeline();
  };

  // Building network
  cwLayoutTimeline.prototype.getAndParseData = function() {
    this.timelineGroups = new vis.DataSet();
    this.timelineItems = new vis.DataSet();
    this.simplify(this.JSONobjects, { id: this.nodeID }, 1);
  };

  // Building network
  cwLayoutTimeline.prototype.createVisTimeline = function() {
    var timeLineContainer = document.getElementById("cwLayoutTimeline_" + this.nodeID);

    // set height
    var titleReact = document.querySelector("#cw-top-bar").getBoundingClientRect();
    var topBarReact = document.querySelector(".page-top").getBoundingClientRect();
    var canvaHeight = window.innerHeight - titleReact.height - topBarReact.height;

    function customOrder(a, b) {
      // order by id
      return b.start - a.start;
    }

    var options = {
      groupOrder: "sort", // groupOrder can be a property name or a sorting function,
      stack: this.config.stack,
      stackSubgroups: this.config.stack,
      orientation: "both",
      verticalScroll: true,
      maxHeight: canvaHeight,
    };

    if (this.stack == true) options.order = customOrder;

    this.timeLineUI = new vis.Timeline(timeLineContainer, this.timelineItems, this.timelineGroups, options);

    // Set first time bar
    this.timeLineUI.addCustomTime(new Date(), "customTimeBar");

    this.timeLineUI.on("timechanged", function(properties) {
      var timeBar = document.getElementsByClassName(properties.id)[0];
      if (timeBar.childElementCount > 1) timeBar.removeChild(timeBar.lastChild);
      var div = document.createElement("div");
      div.innerText = properties.time;
      timeBar.append(div);
    });
  };

  cwApi.cwLayouts.cwLayoutTimeline = cwLayoutTimeline;
})(cwAPI, jQuery);
