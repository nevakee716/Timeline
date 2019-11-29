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
      cwApi.registerLayoutForJSActions(this); // execute le applyJavaScript après drawAssociations
      this.construct(options);
    };
  }

  // manage Expert Mode
  cwLayoutTimeline.prototype.manageExpertMode = function(event) {
    var self = this;
    cwApi.CwAsyncLoader.load("angular", function() {
      if (self.expertMode === true) {
        self.expertMode = false;
        event.target.title = $.i18n.prop("activate_expert_mode");
        event.target.classList.remove("selected");
        cwAPI.CwPopout.hide();
      } else {
        self.expertMode = true;
        event.target.title = $.i18n.prop("deactivate_expert_mode");
        event.target.classList.add("selected");
        cwApi.CwPopout.showPopout($.i18n.prop("expert_mode"));

        cwApi.CwPopout.setContent(self.createExpertModeElement());
        self.setEventForExpertMode();
        self.selectTab("timelineNodes");
        self.selectTab("timelineNodes");
        cwApi.CwPopout.onClose(function() {
          self.expertMode = false;
          event.target.title = $.i18n.prop("activate_expert_mode");
        });
      }
    });
  };

  // manage Expert Mode
  cwLayoutTimeline.prototype.createExpertModeElement = function() {
    var self = this;
    var tab = [];
    var tabs = ["timelineNodes"]; //, "general"];
    var expertModeConfig = document.createElement("div");
    expertModeConfig.className = "cwLayoutTimelineExpertModeConfig";
    expertModeConfig.id = "cwLayoutTimelineExpertModeConfig" + this.nodeID;

    var cwLayoutTimelineExpertModeContainerTab = document.createElement("div");
    cwLayoutTimelineExpertModeContainerTab.className = "cwLayoutTimelineExpertModeContainerTab";
    cwLayoutTimelineExpertModeContainerTab.id = "cwLayoutTimelineExpertModeContainerTab" + this.nodeID;
    expertModeConfig.appendChild(cwLayoutTimelineExpertModeContainerTab);

    var expertModeContainer = document.createElement("div");
    expertModeContainer.className = "cwLayoutTimelineExpertModeContainer";
    expertModeContainer.id = "cwLayoutTimelineExpertModeContainer";
    expertModeConfig.appendChild(expertModeContainer);

    tabs.forEach(function(t) {
      let tab = document.createElement("div");
      tab.className = "cwLayoutTimelineExpertModeTabs";
      tab.id = t;
      tab.innerText = $.i18n.prop(t);
      cwLayoutTimelineExpertModeContainerTab.appendChild(tab);
    });
    let tabElem = document.createElement("div");
    tabElem.className = "cwLayoutTimelineExpertModeTabs";
    tabElem.id = "saveconfiguration";
    tabElem.innerHTML = '<i class="fa fa-floppy-o" aria-hidden="true"></i>';
    cwLayoutTimelineExpertModeContainerTab.appendChild(tabElem);

    return expertModeConfig;
  };

  cwLayoutTimeline.prototype.selectTab = function(id) {
    var self = this,
      loader = cwApi.CwAngularLoader;
    loader.setup();

    if (id === "saveconfiguration") {
      cwAPI.customLibs.utils.copyToClipboard(JSON.stringify(this.config));
    }
    let templatePath = cwAPI.getCommonContentPath() + "/html/cwTimeline/" + id + ".ng.html" + "?" + Math.random();
    this.unselectTabs();
    let t = document.querySelector("#" + id);
    t.className += " selected";

    var $container = $("#cwLayoutTimelineExpertModeContainer");

    loader.loadControllerWithTemplate(t.id, $container, templatePath, function($scope) {
      $scope.metamodel = cwAPI.mm.getMetaModel();
      $scope.config = self.config;
      $scope.cwApi = cwApi;

      $scope.toggle = function(c, e) {
        if (c.hasOwnProperty(e)) delete c[e];
        else c[e] = true;
      };

      $scope.toggleArray = function(c, e) {
        var i = c.indexOf(e);
        if (i === -1) c.push(e);
        else c.splice(i, 1);
      };

      if (self["controller_" + t.id] && $scope.config) self["controller_" + t.id]($container, templatePath, $scope);
    });
  };
  cwLayoutTimeline.prototype.setEventForExpertMode = function() {
    var self = this;
    let matches = document.querySelectorAll(".cwLayoutTimelineExpertModeTabs");
    for (let i = 0; i < matches.length; i++) {
      let t = matches[i];
      t.addEventListener("click", function(event) {
        self.selectTab(t.id);
      });
    }
  };

  cwLayoutTimeline.prototype.unselectTabs = function(tabs) {
    let matches = document.querySelectorAll(".cwLayoutTimelineExpertModeTabs");
    for (let i = 0; i < matches.length; i++) {
      let t = matches[i];
      t.className = t.className.replaceAll(" selected", "");
    }
  };

  cwLayoutTimeline.prototype.bootstrapFilter = function(id, value) {
    window.setTimeout(function(params) {
      $("#" + id).selectpicker();
      $("#" + id).selectpicker("val", value);
    }, 1000);
  };

  cwLayoutTimeline.prototype.nodeIDToFancyTree = function(node, noLoop) {
    var self = this;
    var exportNode = {};
    if (node === undefined) {
      node = this.viewSchema.NodesByID[this.nodeID];
    }
    exportNode.text = node.NodeName;
    exportNode.NodeID = node.NodeID;
    exportNode.children = [];
    exportNode.objectTypeScriptName = node.ObjectTypeScriptName;
    exportNode.SortedChildren = node.SortedChildren;
    exportNode.state = {
      opened: true,
    };

    if (noLoop !== true) {
      if (this.config.nodes[node.NodeID] && this.config.nodes[node.NodeID].steps) {
        for (let s in this.config.nodes[node.NodeID].steps) {
          if (this.config.nodes[node.NodeID].steps.hasOwnProperty(s)) {
            let c = this.stepToFancyTree(this.config.nodes[node.NodeID].steps[s], s);
            c.objectTypeScriptName = node.ObjectTypeScriptName;
            c.NodeID = node.NodeID;

            exportNode.children.push(c);
          }
        }
      }
      node.SortedChildren.forEach(function(n) {
        exportNode.children.push(self.nodeIDToFancyTree(self.viewSchema.NodesByID[n.NodeId]));
      });
    }

    return exportNode;
  };

  cwLayoutTimeline.prototype.stepToFancyTree = function(step, id) {
    let node = {};
    node.id = id;
    node.text = step.text;
    node.type = "file";
    node.state = {
      opened: true,
    };
    return node;
  };

  cwLayoutTimeline.prototype.controller_timelineNodes = function($container, templatePath, $scope) {
    $scope.ng = {};
    $scope.treeID = "cwLayoutTimelineExpertModeNodesConfigTree" + this.nodeID;
    $scope.optionString = {};
    $scope.updateTimeline = this.updateTimeline.bind(this);

    var tmpsource = [],
      source = [],
      self = this;
    let q = cwApi.getQueryStringObject();
    let tab = "tab0";

    if (q.cwtabid) tab = q.cwtabid;
    if (this.viewSchema.Tab && this.viewSchema.Tab.Tabs) {
      this.viewSchema.Tab.Tabs.forEach(function(t) {
        if (t.Id === tab) {
          t.Nodes.forEach(function(n) {
            source.push(self.nodeIDToFancyTree(self.viewSchema.NodesByID[n]));
          });
        }
      });
    } else {
      self.viewSchema.RootNodesId.forEach(function(n) {
        source.push(self.nodeIDToFancyTree(self.viewSchema.NodesByID[n]));
      });
    }

    if (cwApi.isIndexPage() === false) {
      tmpsource.push(self.nodeIDToFancyTree(self.viewSchema.NodesByID[self.viewSchema.RootNodesId[0]]));
      tmpsource[0].children = source;
      source = tmpsource;
    }

    $scope.loadtree = function() {
      // define right click action on the jstree
      function contextMenu(node) {
        var items = {};
        var tree = $("#" + $scope.treeID).jstree(true);
        if (node.type !== "file") {
          items.createStep = {
            label: "Create Step",
            icon: "fa fa-plus",
            action: function(questo) {
              let newNodeID = tree.create_node(node, { text: "Step", type: "file", NodeID: node.original.NodeID, objectTypeScriptName: node.original.objectTypeScriptName }, node.children.length - node.original.SortedChildren.length);
              if ($scope.config.nodes[node.original.NodeID] === undefined) $scope.config.nodes[node.original.NodeID] = { steps: {} };
              $scope.config.nodes[node.original.NodeID].steps[newNodeID] = { cds: "{name}" };
            },
          };
        } else {
          items.renameStep = {
            label: "Rename Step",
            icon: "fa fa-pencil",
            action: function(obj) {
              tree.edit(node);
            },
          };
          items.deleteStep = {
            label: "Delete Step",
            icon: "fa fa-trash",
            action: function(obj) {
              tree.delete_node($(node));
              delete $scope.config.nodes[node.original.NodeID].steps[node];
              self.updateTimeline();
            },
          };
        }
        return items;
      }

      $(".cwLayoutTimelineExpertModeNodesConfigTree")
        // onselect event
        .on("changed.jstree", function(e, data) {
          if (data.node && data.node.original) {
            if (data.node.type === "default") {
              $scope.ng.selectedNode = data.node.original;
              $scope.ng.selectedStep = undefined;
              $scope.ng.nodeID = data.node.original.NodeID;
              if ($scope.config.nodes[data.node.original.NodeID] === undefined) $scope.config.nodes[data.node.original.NodeID] = { steps: {} };
              $scope.ng.nodeConfig = $scope.config.nodes[data.node.original.NodeID];
              if ($scope.ng.nodeConfig === undefined) $scope.ng.nodeConfig = {};
              $scope.$apply();
            } else if (data.node.type === "file") {
              $scope.ng.selectedNode = undefined;
              $scope.ng.selectedStep = data.node.original;
              $scope.ng.stepConfig = $scope.config.nodes[data.node.original.NodeID].steps[data.node.id];
              $scope.ng.stepConfig.text = data.node.text;
              $scope.objectType = cwAPI.mm.getObjectType(data.node.original.objectTypeScriptName);
              $scope.$apply();
            }
          }
        })
        .jstree({
          core: {
            data: source,
            check_callback: true,
          },
          types: {
            default: {
              valid_children: ["file"],
            },
            file: {
              icon: "fa fa-cube",
              valid_children: [],
            },
          },
          plugins: ["contextmenu", "types"],
          contextmenu: {
            select_node: false,
            items: contextMenu,
          },
        });
    };
  };

  cwApi.cwLayouts.cwLayoutTimeline = cwLayoutTimeline;
})(cwAPI, jQuery);
