/**
 * Copyright (C) 2005-2010 Alfresco Software Limited.
 *
 * This file is part of Alfresco
 *
 * Alfresco is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Alfresco is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Alfresco. If not, see <http://www.gnu.org/licenses/>.
 */
 
// Ensure Venzia root object exists
if (typeof Venzia == "undefined" || !Venzia)
{
   var Venzia = {};
}

/**
 * MDBConnectorFinder component.
 * 
 * @namespace Alfresco
 * @class Venzia.MDBConnectorFinder
 */
(function()
{
   

   /**
    * YUI Library aliases
    */
   var Dom = YAHOO.util.Dom,
      Event = YAHOO.util.Event,
      KeyListener = YAHOO.util.KeyListener;

   /**
    * Alfresco Slingshot aliases
    */
   var $html = Alfresco.util.encodeHTML,
      $hasEventInterest = Alfresco.util.hasEventInterest;
   
   /**
    * MDBConnectorFinder constructor.
    * 
    * @param {String} htmlId The HTML id of the parent element
    * @param {String} currentValueHtmlId The HTML id of the parent element
    * @return {Venzia.MDBConnectorFinder} The new MDBConnectorFinder instance
    * @constructor
    */
   Venzia.MDBConnectorFinder = function Alfresco_MDBConnectorFinder(htmlId, currentValueHtmlId)
   {
      Venzia.MDBConnectorFinder.superclass.constructor.call(this, "Venzia.MDBConnectorFinder", htmlId, ["button", "menu", "container", "resize", "datasource", "datatable"]);
      this.currentValueHtmlId = currentValueHtmlId;

      /**
       * Decoupled event listeners
       */
      this.eventGroup = htmlId;
      YAHOO.Bubbling.on("renderCurrentValueMDBC", this.onrenderCurrentValueMDBC, this);
      YAHOO.Bubbling.on("selectedItemAddedMDBC", this.onselectedItemAddedMDBC, this);
      YAHOO.Bubbling.on("selectedItemRemovedMDBC", this.onselectedItemRemovedMDBC, this);
      YAHOO.Bubbling.on("formContainerDestroyedMDBC", this.onformContainerDestroyedMDBC, this);
      YAHOO.Bubbling.on("removeListItemMDBC", this.onremoveListItemMDBC, this);

      // Initialise prototype properties
      this.pickerId = htmlId + "-picker";
      this.columns = [];
      this.selectedItems = {};
      this.isReady = false;
      
      this.options.objectRenderer = new Venzia.ObjectRenderer(this);

      return this;
   };
   
   YAHOO.extend(Venzia.MDBConnectorFinder, Alfresco.component.Base,
   {
      /**
       * Object container for initialization options
       *
       * @property options
       * @type object
       */
      options:
      {
         /**
          * Instance of an ObjectRenderer class
          *
          * @property objectRenderer
          * @type object
          */
         objectRenderer: null,

         /**
          * The selected value to be displayed (but not yet persisted)
          *
          * @property selectedValue
          * @type string
          * @default null
          */
         selectedValue: null,

         /**
          * The current value
          *
          * @property currentValue
          * @type string
          */
         currentValue: "",
         
         /**
          * The id of the item being edited
          * 
          * @property currentItem
          * @type string
          */
         currentItem: null,
         
         /**
          * Value type.
          * Whether values are passed into and out of the control as nodeRefs or other data types
          *
          * @property valueType
          * @type string
          * @default "nodeRef"
          */
         valueType: "nodeRef",

         /**
          * The name of the field that the object finder displays
          *
          * @property field
          * @type string
          */
         field: null,

         /**
          * The type of the item to find
          *
          * @property itemType
          * @type string
          */
         itemType: "cm:content",
         
         /**
          * The 'family' of the item to find can be one of the following:
          * 
          * - node
          * - category
          * - authority
          * 
          * default is "node".
          * 
          * @property itemFamily
          * @type string
          */
         itemFamily: "node",

         /**
          * Compact mode flag
          * 
          * @property compactMode
          * @type boolean
          * @default false
          */
         compactMode: false,

         /**
          * Multiple Select mode flag
          * 
          * @property multipleSelectMode
          * @type boolean
          * @default false
          */
         multipleSelectMode: true,
         
         /**
          * Determines whether a link to the target
          * node should be rendered
          *
          * @property showLinkToTarget
          * @type boolean
          * @default false
          */
         showLinkToTarget: false,
         
         /**
          * Template string or function to use for link to target nodes, must
          * be supplied when showLinkToTarget property is
          * set to true
          *
          * @property targetLinkTemplate If of type string it will be used as a template, if of type function an
          * item object will be passed as argument and link is expected to be returned by the function
          * @type (string|function)
          */
         targetLinkTemplate: null,
         
         /**
          * Number of characters required for a search
          * 
          * @property minSearchTermLength
          * @type int
          * @default 1
          */
         minSearchTermLength: 1,
         
         /**
          * Maximum number of items to display in the results list
          * 
          * @property maxSearchResults
          * @type int
          * @default 100
          */
         maxSearchResults: 100,
         
         /**
          * Flag to determine whether the added and removed items
          * should be maintained and posted separately.
          * If set to true (the default) the picker will update
          * a "${field.name}_added" and a "${field.name}_removed"
          * hidden field, if set to false the picker will just
          * update a "${field.name}" hidden field with the current
          * value.
          * 
          * @property maintainAddedRemovedItems
          * @type boolean
          * @default true
          */
         maintainAddedRemovedItems: false,
         
         /**
          * Flag to determine whether the picker is in disabled mode
          *
          * @property disabled
          * @type boolean
          * @default false
          */
         disabled: false,
         
         /**
          * Flag to indicate whether the field is mandatory
          *
          * @property mandatory
          * @type boolean
          * @default false
          */
         mandatory: false,
         
         /**
          * Relative URI of "create new item" data webscript.
          *
          * @property createNewItemUri
          * @type string
          * @default ""
          */
         createNewItemUri: "",
         
         /**
          * Icon type to augment "create new item" row.
          *
          * @property createNewItemIcon
          * @type string
          * @default ""
          */
         createNewItemIcon: "",

         /**
          * The display mode to use for the current values.
          * Allowed values are "items" or "list"
          *
          * @property extendedMode
          * @type string
          * @default "items"
          */
         displayMode: "items",

         /**
          * The actions to display next to each item/current value in "list" mode.
          * - if "event" has been set: A click will fire an event with name as defined by "event" and item info as attribute.
          * - if "link" has been set: A normal html link will be displayed with href set to the value of "link"
          * {
          *    name: {String},  // The name of the action (used as a css class name for styling)
          *    event: {Object}, // If present will be the name of the event to send
          *    link: {String|function},  // If present will set the browser to display the link provided
          *    label: {String}  // The message label key use to get the display label
          * }
          *
          * @property listActions
          * @type Array
          * @default [ ] // Note! If allowRemoveAction equals true and
          *                       options.disabled is false and
          *                       displayMode equals "list"
          *                       a remove action will be added
          */
         listItemActions: [ ],

         /**
          * Determines if items shall be removable in "list" display mode
          *
          * @property allowRemoveAction
          * @type boolean
          * @default true
          */
         allowRemoveAction: true,

         /**
          * Determines if an "Remove all" button shall be displayed in "list" display mode
          *
          * @property allowRemoveAllAction
          * @type boolean
          * @default true
          */
         allowRemoveAllAction: true,

         /**
          * Determines if an "Add/Select" button shall be displayed that will display an items picker
          *
          * @property allowSelectAction
          * @type boolean
          * @default true
          */
         allowSelectAction: true,

         /**
          * Determines if a link is rendered for content that has children, if true
          * the content's children can be navigated.
          *
          * @property allowNavigationToContentChildren
          * @type boolean
          * @default false
          */
         allowNavigationToContentChildren: false,
         
         /**
          * The label of the select button that triggers the object finder dialog
          *
          * @property selectActionLabel
          * @type string
          */
         selectActionLabel: null,
         
         /**
          * The resource id for the label of the select button that triggers the object finder dialog
          *
          * @property selectActionLabelId
          * @type string
          */
         selectActionLabelId: null,
         
         /**
          * Specifies the location the object finder should start, the following
          * values are supported:
          * 
          * - {companyhome}
          * - {userhome}
          * - {siteshome}
          * - {doclib}
          * - {self}
          * - {parent}
          * - A NodeRef
          * - An XPath
          * 
          * @property startLocation
          * @type string
          */
         startLocation: null,
         
         /**
          * Specifies the parameters to pass to the node locator service
          * when determining the start location node.
          * 
          * @property startLocationParams
          * @type string
          */
         startLocationParams: null,
         
         /**
          * Specifies the Root Node, above which the object picker will not navigate.
          * Values supported are:
          *
          * - {companyhome}
          * - {userhome}
          * - {siteshome}
          * - A NodeRef
          * - An XPath
          */
         rootNode: null,
		/**
		* NodeRef
		**/
		nodeRef:"",
		/**
		* Nombre del connector
		**/
		connectorName:"",
		/**
		* Nombre del aspecto
		**/
		aspectName:"",
		columnsName:null,
		columnsLabels:null
      },

      /**
       * Resizable columns
       * 
       * @property columns
       * @type array
       * @default []
       */
      columns: null,

      /**
       * Single selected item, for when in single select mode
       * 
       * @property singleSelectedItem
       * @type string
       */
      singleSelectedItem: null,

      /**
       * Selected items. Keeps a list of selected items for correct Add button state.
       * 
       * @property selectedItems
       * @type object
       */
      selectedItems: null,

      /**
       * Determines if this component is ready (to be called from outside)
       *
       * @property isReady
       * @type boolean
       */
      isReady: false,

      /**
       * Set multiple initialization options at once.
       *
       * @override
       * @method setOptions
       * @param obj {object} Object literal specifying a set of options
       * @return {Venzia.MDBConnectorFinder} returns 'this' for method chaining
       */
      setOptions: function MDBConnectorFinder_setOptions(obj)
      {
         Venzia.MDBConnectorFinder.superclass.setOptions.call(this, obj);
         // TODO: Do we need to filter this object literal before passing it on..?
         this.options.objectRenderer.setOptions(obj);
         
         return this;
      },
      
      /**
       * Set messages for this component.
       *
       * @method setMessages
       * @param obj {object} Object literal specifying a set of messages
       * @return {Venzia.MDBConnectorFinder} returns 'this' for method chaining
       */
      setMessages: function MDBConnectorFinder_setMessages(obj)
      {
         Venzia.MDBConnectorFinder.superclass.setMessages.call(this, obj);
         this.options.objectRenderer.setMessages(obj);
         return this;
      },

      /**
       * Populate selected items.
       *
       * @method selectItems
       * @param items {Array} Array of item ids to populate the current value with
       */
      selectItems: function MDBConnectorFinder_selectItems(items)
      {
         this.options.selectedValue = items;
         this._loadSelectedItems();
      },
      
      /**
       * Fired by YUI when parent element is available for scripting.
       * Component initialisation, including instantiation of YUI widgets and event listener binding.
       *
       * @method onReady
       */
      onReady: function MDBConnectorFinder_onReady()
      {
	var connectorLoaded = function(oRequest){
	   this.options["connector"] = oRequest.json;
            
	   YAHOO.Bubbling.fire("renderControlMDBC",
		{
		   eventGroup: this
		});

           this._createSelectedItemsControls();
	   
         if (!this.options.disabled)
         {
            // Control is NOT in view mode
            if (this.options.compactMode)
            {
               Dom.addClass(this.pickerId, "compact");
            }
         
            this._createNavigationControls();
            var itemGroupActionsContainerEl = Dom.get(this.id + "-itemGroupActions");
            if (itemGroupActionsContainerEl)
            {
               // Create an "Add/Select" button that will display a picker to add items
               if (this.options.allowSelectAction)
               {
                  var addButtonEl = document.createElement("button");
                  itemGroupActionsContainerEl.appendChild(addButtonEl);
                  
                  var addButtonLabel = this.options.selectActionLabel;
                  if (this.options.selectActionLabelId && this.options.selectActionLabelId.length !== "")
                  {
                     addButtonLabel = this.msg(this.options.selectActionLabelId);
                  }
                  this.widgets.addButton = Alfresco.util.createYUIButton(this, null, this.onAddButtonClick,
                  {
                     label: addButtonLabel,
                     disabled: true
                  }, addButtonEl);
               }
               // Create a "Remove all" button to remove all items (if component is in "list" mode)
               if (this.options.allowRemoveAllAction && this.options.displayMode == "list")
               {
                  var removeAllButtonEl = document.createElement("button");
                  itemGroupActionsContainerEl.appendChild(removeAllButtonEl);
                  this.widgets.removeAllButton = Alfresco.util.createYUIButton(this, null, this.onRemoveAllButtonClick,
                  {
                     label: this.msg("button.removeAll"),
                     disabled: true
                  }, removeAllButtonEl);
               }
            }
            if (this.options.allowRemoveAction && this.options.displayMode == "list")
            {
               this.options.listItemActions.push(
               {
                  name: "remove-list-item",
                  event: "removeListItemMDBC",
                  label: "form.control.object-picker.remove-item"
               });
            }
            this.widgets.ok = Alfresco.util.createYUIButton(this, "ok", this.onOK);
            this.widgets.cancel = Alfresco.util.createYUIButton(this, "cancel", this.onCancel);
            
            // force the generated buttons to have a name of "-" so it gets ignored in
            // JSON submit. TODO: remove this when JSON submit behaviour is configurable
            Dom.get(this.id + "-ok-button").name = "-";
            Dom.get(this.id + "-cancel-button").name = "-";
            
            this.widgets.dialog = Alfresco.util.createYUIPanel(this.pickerId,
            {
               width: "60em"
            });
            this.widgets.dialog.hideEvent.subscribe(this.onCancel, null, this);
            Dom.addClass(this.pickerId, "mdbc-finder");
         }else{
	  Dom.addClass(this.id, "mdbc-finder");
	}
	  this._loadSelectedItems();
	  
         
	};
	var connectorLoadFailed = function(oRequest){
		//TODO:añadir control de error
	};
         //load EntryObject
         Alfresco.util.Ajax.request(
         {
            url: Alfresco.constants.PROXY_URI + "mdbc/api/connector",
	    method: Alfresco.util.Ajax.GET,
	    requestContentType: Alfresco.util.Ajax.JSON,
            dataObj:
            {
               name : this.options.connectorName
            },
            successCallback:
            {
               fn: connectorLoaded,
               scope: this
            },
            failureCallback:
            {
               fn: connectorLoadFailed,
               scope: this
            },
            scope: this
         });

        
      },

      /**
       * Destroy method - deregister Bubbling event handlers
       *
       * @method destroy
       */
      destroy: function MDBConnectorFinder_destroy()
      {
         try
         {
            YAHOO.Bubbling.unsubscribe("renderCurrentValueMDBC", this.onrenderCurrentValueMDBC, this);
            YAHOO.Bubbling.unsubscribe("selectedItemAddedMDBC", this.onselectedItemAddedMDBC, this);
            YAHOO.Bubbling.unsubscribe("selectedItemRemovedMDBC", this.onselectedItemRemovedMDBC, this);
            YAHOO.Bubbling.unsubscribe("formContainerDestroyedMDBC", this.onformContainerDestroyedMDBC, this);
            YAHOO.Bubbling.unsubscribe("removeListItemMDBC", this.onremoveListItemMDBC, this);
         }
         catch (e)
         {
            // Ignore
         }
         Venzia.MDBConnectorFinder.superclass.destroy.call(this);
      },
      
      /**
       * Add button click handler, shows picker
       *
       * @method onAddButtonClick
       * @param e {object} DomEvent
       * @param p_obj {object} Object passed back from addListener method
       */
      onAddButtonClick: function MDBConnectorFinder_onAddButtonClick(e, p_obj)
      {
         // Register the ESC key to close the dialog
         if (!this.widgets.escapeListener)
         {
            this.widgets.escapeListener = new KeyListener(this.pickerId,
            {
               keys: KeyListener.KEY.ESCAPE
            },
            {
               fn: function MDBConnectorFinder_onAddButtonClick_fn(eventName, keyEvent)
               {
                  this.onCancel();
                  Event.stopEvent(keyEvent[1]);
               },
               scope: this,
               correctScope: true
            });
         }
         this.widgets.escapeListener.enable();

         this.widgets.dialog.show();
         this._createResizer();
         this._populateSelectedItems();
         this.options.objectRenderer.onPickerShow();
         
         if (!this.options.objectRenderer.startLocationResolved && (this.options.startLocation || this.options.rootNode))
         {
            this._resolveStartLocation();
         }
         else
         {
            this._fireRefreshEvent();
         }
         
         p_obj.set("disabled", true);
         Event.preventDefault(e);
      },


      /**
       * Removes all list itesm from the current value list used in "list" display mode
       *
       * @method onRemoveAllButtonClick
       * @param e {object} DomEvent
       * @param p_obj {object} Object passed back from addListener method
       */
      onRemoveAllButtonClick: function MDBConnectorFinder_onRemoveAllButtonClick(e, p_obj)
      {
         this.widgets.currentValuesDataTable.deleteRows(0, this.widgets.currentValuesDataTable.getRecordSet().getLength());
         this.selectedItems = {};
         this.singleSelectedItem = null;
         this._adjustCurrentValues();
         Event.preventDefault(e);
      },

      /**
       * Folder Up Navigate button click handler
       *
       * @method onFolderUp
       * @param e {object} DomEvent
       * @param p_obj {object} Object passed back from addListener method
       */
      onFolderUp: function MDBConnectorFinder_onFolderUp(e, p_obj)
      {
         var item = p_obj.get("value");

         YAHOO.Bubbling.fire("parentChanged",
         {
            eventGroup: this,
            label: item.name,
            nodeRef: item.nodeRef
         });
         Event.preventDefault(e);
      },

      /**
       * Create New OK button click handler
       *
       * @method onCreateNewOK
       * @param e {object} DomEvent
       * @param p_obj {object} Object passed back from addListener method
       */
      onCreateNewOK: function MDBConnectorFinder_onCreateNewOK(e, p_obj)
      {
         Event.preventDefault(e);
      },

      /**
       * Create New Cancel button click handler
       *
       * @method onCreateNewCancel
       * @param e {object} DomEvent
       * @param p_obj {object} Object passed back from addListener method
       */
      onCreateNewCancel: function MDBConnectorFinder_onCreateNewCancel(e, p_obj)
      {
         Event.preventDefault(e);
      },

      /**
       * Picker OK button click handler
       *
       * @method onOK
       * @param e {object} DomEvent
       * @param p_obj {object} Object passed back from addListener method
       */
      onOK: function MDBConnectorFinder_onOK(e, p_obj)
      {
         this.widgets.escapeListener.disable();
         this.widgets.dialog.hide();
         this.widgets.addButton.set("disabled", false);
         if (e)
         {
            Event.preventDefault(e);
         }

         YAHOO.Bubbling.fire("renderCurrentValueMDBC",
         {
            eventGroup: this
         });
      },

      /**
       * Adjust the current values, added, removed input elements according to the new selections
       * and fires event to notify form listeners about the changes.
       *
       * @method _adjustCurrentValues
       */
      _adjustCurrentValues: function MDBConnectorFinder__adjustCurrentValues()
      {
         if (!this.options.disabled)
         {
            var selectedItems = this.getSelectedItems();

           
            Dom.get(this.currentValueHtmlId).value = selectedItems.join("");
            if (Alfresco.logger.isDebugEnabled())
            {
               Alfresco.logger.debug("Hidden field '" + this.currentValueHtmlId + "' updated to '" + selectedItems.toString() + "'");
            }
                                 
            // inform the forms runtime that the control value has been updated (if field is mandatory)
            if (this.options.mandatory)
            {
               YAHOO.Bubbling.fire("mandatoryControlValueUpdated", this);
            }

            YAHOO.Bubbling.fire("formValueChanged",
            {
               eventGroup: this,
               selectedItems: selectedItems,
               selectedItemsMetaData: Alfresco.util.deepCopy(this.selectedItems)
            });

            this._enableActions();
         }
      },

      /**
       * Picker Cancel button click handler
       *
       * @method onCancel
       * @param e {object} DomEvent
       * @param p_obj {object} Object passed back from addListener method
       */
      onCancel: function MDBConnectorFinder_onCancel(e, p_obj)
      {
         this.widgets.escapeListener.disable();
         this.widgets.dialog.hide();
         this.widgets.addButton.set("disabled", false);
         if (e)
         {
            Event.preventDefault(e);
         }
      },
      
      /**
       * Triggers a search
       *
       * @method onSearch
       */
      onSearch: function MDBConnectorFinder_onSearch()
      {
         var searchTerm = Dom.get(this.pickerId + "-searchText").value;
         if (searchTerm.length < this.options.minSearchTermLength)
         {
            // show error message
            Alfresco.util.PopupManager.displayMessage(
            {
               text: this.msg("form.control.object-picker.search.enter-more", this.options.minSearchTermLength)
            });
         }
         else
         {
            // execute search
            YAHOO.Bubbling.fire("refreshItemListMDBC",
            {
               eventGroup: this,
               searchTerm: searchTerm
            });
         }
      },

      /**
       * PUBLIC INTERFACE
       */

      /**
       * Returns if an item can be selected
       *
       * @method canItemBeSelected
       * @param id {string} Item id (nodeRef)
       * @return {boolean}
       */
      canItemBeSelected: function MDBConnectorFinder_canItemBeSelected(id)
      {
         if (!this.options.multipleSelectMode && this.singleSelectedItem !== null)
         {
            return false;
         }
         return (this.selectedItems[id] === undefined);
      },

      /**
       * Returns currently selected items
       *
       * @method getSelectedItems
       * @return {array}
       */
      getSelectedItems: function MDBConnectorFinder_getSelectedItems()
      {
         var selectedItems = ['<?xml version="1.0" encoding="UTF-8"?><mdbc><rows>'];
	
         for (var item in this.selectedItems)
         {
            if (this.selectedItems.hasOwnProperty(item))
            {
	       var obj = this.selectedItems[item];
		selectedItems.push("<row>");
	       for(var name in obj) {
		  var miInteger = parseInt(obj[name]);
		   if (isNaN(miInteger) || obj[name].indexOf("/")>0) {
		   	selectedItems.push("<" + name + "><![CDATA[" + obj[name] + "]]></" + name + ">");
		   }else{
			selectedItems.push("<" + name + ">" + obj[name] + "</" + name + ">");
		   }
		}
		selectedItems.push("</row>");
              
            }
         }
	selectedItems.push("</rows></mdbc>");
         return selectedItems;
      },

      /**
       * Returns items that have been added to the current value
       *
       * @method getAddedItems
       * @return {array}
       */
      getAddedItems: function MDBConnectorFinder_getAddedItems()
      {
         var addedItems = [],
            currentItems = Alfresco.util.arrayToObject(this.options.currentValue.split(","));
         
         for (var item in this.selectedItems)
         {
            if (this.selectedItems.hasOwnProperty(item))
            {
               if (!(item in currentItems))
               {
                  addedItems.push(item);
               }
            }
         }
         return addedItems;
      },

      /**
       * Returns items that have been removed from the current value
       *
       * @method getRemovedItems
       * @return {array}
       */
      getRemovedItems: function MDBConnectorFinder_getRemovedItems()
      {
         var removedItems = [],
            currentItems = Alfresco.util.arrayToObject(this.options.currentValue.split(","));
         
         for (var item in currentItems)
         {
            if (currentItems.hasOwnProperty(item))
            {
               if (!(item in this.selectedItems))
               {
                  removedItems.push(item);
               }
            }
         }
         return removedItems;
      },

      
      /**
       * BUBBLING LIBRARY EVENT HANDLERS FOR PAGE EVENTS
       * Disconnected event handlers for inter-component event notification
       */

      /**
       * Renders current value in reponse to an event
       *
       * @method onrenderCurrentValueMDBC
       * @param layer {object} Event fired (unused)
       * @param args {array} Event parameters
       */
      onrenderCurrentValueMDBC: function MDBConnectorFinder_onrenderCurrentValueMDBC(layer, args)
      {
         // Check the event is directed towards this instance
         if ($hasEventInterest(this, args))
         {
            this._adjustCurrentValues();

            var items = this.selectedItems,
               displayValue = "";

            if (items === null)
            {
               displayValue = "<span class=\"error\">" + this.msg("form.control.object-picker.current.failure") + "</span>";            
            }
            else
            {
               var item;
               if (this.options.displayMode == "list")
               {
                  var l = this.widgets.currentValuesDataTable.getRecordSet().getLength();
                  if (l > 0)
                  {
                     this.widgets.currentValuesDataTable.deleteRows(0, l);
                  }
               }
               
               for (var key in items)
               {
                  if (items.hasOwnProperty(key))
                  {
                     item = items[key];

		        if (this.options.displayMode == "tags")
		        {
		          
		           displayValue += this.options.objectRenderer.renderItem(item, null, "<div class='tag'>{" + this.options.connector.columnDetails + "}</div>");
		           
		        }
		        else if (this.options.displayMode == "list")
		        {
		           this.widgets.currentValuesDataTable.addRow(item);
		        }
                  }
               }
               if (this.options.displayMode == "tags" && displayValue.length>0)
               {
                  Dom.get(this.id + "-currentValueDisplay").innerHTML = displayValue;
               }else if (this.options.displayMode == "tags" ){
		  Dom.get(this.id + "-currentValueDisplay").innerHTML = this.msg("label.none");
		}
            }
            this._enableActions();
         }
      },

      /**
       * Selected Item Added event handler
       *
       * @method onselectedItemAddedMDBC
       * @param layer {object} Event fired
       * @param args {array} Event parameters (depends on event type)
       */
      onselectedItemAddedMDBC: function MDBConnectorFinder_onselectedItemAddedMDBC(layer, args)
      {
         // Check the event is directed towards this instance
         if ($hasEventInterest(this, args))
         {
            var obj = args[1];
            if (obj && obj.item)
            {
               // Add the item at the correct position (sorted by name) in the selected list (if it hadn't been added already)
               var records = this.widgets.dataTable.getRecordSet().getRecords(),
                  i = 0,
                  il = records.length;
               
               for (; i < il; i++)
               {
                  if (obj.item[this.options.connector.primaryKey] == records[i].getData()[this.options.connector.primaryKey])
                  {
                     break;
                  }
               }
               if (i == il)
               {
                  this.widgets.dataTable.addRow(obj.item);
                  this.selectedItems[obj.item[this.options.connector.primaryKey]] = obj.item;
                  this.singleSelectedItem = obj.item;

                  if (obj.highlight)
                  {
                     // Make sure we scroll to the bottom of the list and highlight the new item
                     var dataTableEl = this.widgets.dataTable.get("element");
                     dataTableEl.scrollTop = dataTableEl.scrollHeight;
                     Alfresco.util.Anim.pulse(this.widgets.dataTable.getLastTrEl());
                  }
               }
               else
               {
                  Alfresco.util.PopupManager.displayMessage(
                  {
                     text: this.msg("message.item-already-added", $html(obj.item.name))
                  });
               }
            }
         }
      },

      /**
       * Selected Item Removed event handler
       *
       * @method onselectedItemRemovedMDBC
       * @param layer {object} Event fired
       * @param args {array} Event parameters (depends on event type)
       */
      onselectedItemRemovedMDBC: function MDBConnectorFinder_onselectedItemRemovedMDBC(layer, args)
      {
         // Check the event is directed towards this instance
         if ($hasEventInterest(this, args))
         {
            var obj = args[1];
            if (obj && obj.item)
            { 
               delete this.selectedItems[obj.item[this.options.connector.primaryKey]];
               this.singleSelectedItem = null;
            }
         }
      },
      
      /**
       * Notification that form is being destroyed.
       *
       * @method onformContainerDestroyedMDBC
       * @param layer {object} Event fired (unused)
       * @param args {array} Event parameters
       */
      onformContainerDestroyedMDBC: function MDBConnectorFinder_onformContainerDestroyedMDBC(layer, args)
      {
         if (this.widgets.dialog)
         {
            this.widgets.dialog.destroy();
            delete this.widgets.dialog;
         }
         if (this.widgets.resizer)
         {
            this.widgets.resizer.destroy();
            delete this.widgets.resizer;
         }
      },


      /**
       * Removes selected item from datatable used in "list" mode
       *
       * @method onremoveListItemMDBC
       * @param layer {object} Event fired (unused)
       * @param args {array} Event parameters
       */
      onremoveListItemMDBC: function MDBConnectorFinder_onremoveListItemMDBC(event, args)
      {
         if ($hasEventInterest(this, args))
         {
            var data = args[1].value,
                  rowId = args[1].rowId;
            this.widgets.currentValuesDataTable.deleteRow(rowId);
            delete this.selectedItems[data[this.options.connector.primaryKey]];
            this.singleSelectedItem = null;
            this._adjustCurrentValues();
         }
      },

      /**
       * Returns Icon datacell formatter
       *
       * @method fnRenderCellIcon
       */
      fnRenderCellIcon: function MDBConnectorFinder_fnRenderCellIcon()
      {
         var scope = this;

         /**
          * Icon datacell formatter
          *
          * @method renderCellIcon
          * @param elCell {object}
          * @param oRecord {object}
          * @param oColumn {object}
          * @param oData {object|string}
          */
         return function MDBConnectorFinder_renderCellIcon(elCell, oRecord, oColumn, oData)
         {
            var iconSize = scope.options.compactMode ? 16 : 32;
         
            oColumn.width = iconSize - 6;
            Dom.setStyle(elCell.parentNode, "width", oColumn.width + "px");

            elCell.innerHTML = scope.options.objectRenderer.renderItem(oRecord.getData(), iconSize, '<div class="icon' + iconSize + '">{icon}</div>');
         };
      },

      /**
       * Returns Icon with generic width datacell formatter
       *
       * @method fnRenderCellGenericIcon
       */
      fnRenderCellGenericIcon: function MDBConnectorFinder_fnRenderCellGenericIcon()
      {
         var scope = this;

         /**
          * Icon datacell formatter
          *
          * @method renderCellGenericIcon
          * @param elCell {object}
          * @param oRecord {object}
          * @param oColumn {object}
          * @param oData {object|string}
          */
         return function MDBConnectorFinder_renderCellGenericIcon(elCell, oRecord, oColumn, oData)
         {
            Alfresco.logger.debug("MDBConnectorFinder_renderCellGenericIcon(" + elCell + ", " + oRecord + ", " + oColumn.width + ", " + oData + ")");
            var iconSize = scope.options.compactMode ? 16 : 32;
            if (oColumn.width)
            {
               Alfresco.logger.debug("MDBConnectorFinder_renderCellGenericIcon setting width!");
               Dom.setStyle(elCell, "width", oColumn.width + (YAHOO.lang.isNumber(oColumn.width) ? "px" : ""));
               Dom.setStyle(elCell.parentNode, "width", oColumn.width + (YAHOO.lang.isNumber(oColumn.width) ? "px" : ""));
            }
            elCell.innerHTML = scope.options.objectRenderer.renderItem(oRecord.getData(), iconSize, '<div class="icon' + iconSize + '">{icon}</div>');
         };
      },

      /**
       * Returns Name / description datacell formatter
       *
       * @method fnRenderCellName
       */
      fnRenderCellName: function MDBConnectorFinder_fnRenderCellName()
      {
         var scope = this;

         /**
          * Name / description datacell formatter
          *
          * @method renderCellName
          * @param elCell {object}
          * @param oRecord {object}
          * @param oColumn {object}
          * @param oData {object|string}
          */
         return function MDBConnectorFinder_renderCellName(elCell, oRecord, oColumn, oData)
         {

            if (scope.options.compactMode)
            {
               template = '<h3 class="name">{name}</h3>';
            }
            else
            {
               template = '<h3 class="name">{name}</h3><div class="description">{description}</div>';
            }

            elCell.innerHTML = oData ;//scope.options.objectRenderer.renderItem(oRecord.getData(), 0, template);
         };
      },

      /**
       * Returns Remove item custom datacell formatter
       *
       * @method fnRenderCellRemove
       */
      fnRenderCellRemove: function MDBConnectorFinder_fnRenderCellRemove()
      {
         var scope = this;

         /**
          * Remove item custom datacell formatter
          *
          * @method renderCellRemove
          * @param elCell {object}
          * @param oRecord {object}
          * @param oColumn {object}
          * @param oData {object|string}
          */
         return function MDBConnectorFinder_renderCellRemove(elCell, oRecord, oColumn, oData)
         {
            Dom.setStyle(elCell.parentNode, "width", oColumn.width + "px");
            elCell.innerHTML = '<a href="#" class="remove-item remove-' + scope.eventGroup + '" title="' + scope.msg("form.control.object-picker.remove-item") + '" tabindex="0"><span class="removeIcon">&nbsp;</span></a>';
         };
      },


      /**
       * Returns Action item custom datacell formatter
       *
       * @method fnRenderCellListItemName
       */
      fnRenderCellListItemName: function MDBConnectorFinder_fnRenderCellListItemName()
      {

         /**
          * Action item custom datacell formatter
          *
          * @method fnRenderCellListItemName
          * @param elCell {object}
          * @param oRecord {object}
          * @param oColumn {object}
          * @param oData {object|string}
          */
         return function MDBConnectorFinder_fnRenderCellListItemName(elCell, oRecord, oColumn, oData)
         {
           
            elCell.innerHTML = "fnRenderCellListItemName";//template;
         };
      },


      /**
       * Returns Action item custom datacell formatter
       *
       * @method fnRenderCellListItemActions
       */
      fnRenderCellListItemActions: function MDBConnectorFinder_fnRenderCellListItemActions()
      {
         var scope = this;

         /**
          * Action item custom datacell formatter
          *
          * @method fnRenderCellListItemActions
          * @param elCell {object}
          * @param oRecord {object}
          * @param oColumn {object}
          * @param oData {object|string}
          */
         return function MDBConnectorFinder_fnRenderCellListItemActions(elCell, oRecord, oColumn, oData)
         {
            if (oColumn.width)
            {
               Dom.setStyle(elCell, "width", oColumn.width + (YAHOO.lang.isNumber(oColumn.width) ? "px" : ""));
               Dom.setStyle(elCell.parentNode, "width", oColumn.width + (YAHOO.lang.isNumber(oColumn.width) ? "px" : ""));
            }
            
            // While waiting for the package item actions, only render the actions (remove) in non editable mode
            if (scope.options.disabled === false) 
            {
               var links = "", link, listAction;
               for (var i = 0, il = scope.options.listItemActions.length; i < il; i++)
               {
                  listAction = scope.options.listItemActions[i];
                  if (listAction.event)
                  {
                     links += '<div class="list-action"><a href="#" class="' + listAction.name + ' ' + ' list-action-event-' + scope.eventGroup + ' ' + listAction.event+ '" title="' + scope.msg(listAction.label) + '" tabindex="0"><span class="'+ listAction.name +' removeIcon">&nbsp;</span></a></div>';
		 
                  }
                  else
                  {
                     link = null;
                     if (YAHOO.lang.isFunction(listAction.link))
                     {
                        link = listAction.link.call(this, oRecord.getData());
                     }
                     else if (YAHOO.lang.isString(listAction.link))
                     {
                        link = YAHOO.lang.substitute(listAction.link, oRecord.getData());
                     }
                     links += '<div class="list-action"><a href="' + link + '" class="' + listAction.name + '" title="' + scope.msg(listAction.label) + '" tabindex="0">' + scope.msg(listAction.label) + '</a></div>';
                  }
               }
               elCell.innerHTML = links;
            }
         };
      },

      /**
       * PRIVATE FUNCTIONS
       */

      /**
       * Gets selected or current value's metadata from the repository
       *
       * @method _loadSelectedItems
       * @private
       */
      _loadSelectedItems: function MDBConnectorFinder__loadSelectedItems(useOptions)
      {
	var me = this; 
         var arrItems = "";
         if (this.options.selectedValue)
         {
            arrItems = this.options.selectedValue;
         }
         else
         {
            arrItems = this.options.currentValue;
         }

         var onSuccess = function MDBConnectorFinder__loadSelectedItems_onSuccess(response)
         {
	    

            this.selectedItems = {};
	   if(response.responseXML.childNodes!=null && response.responseXML.childNodes[0] && response.responseXML.childNodes[0].childNodes[0] && response.responseXML.childNodes[0].childNodes[0].childNodes){
            var nodes = response.responseXML.childNodes[0].childNodes[0].childNodes;
	    for(var i=0; i<nodes.length; i++) {
		var item = {};
		var childs = nodes[i].childNodes;
		for(var j=0; j<childs.length; j++){
		       var text = childs[j].textContent;
			if(text.indexOf("<![CDATA[")>-1){
			    item[childs[j].nodeName] =  text.substring(8 ,text.indexOf("]]>"));		
			}else{
                       	    item[childs[j].nodeName] =  text;
			}
		}
		 me.selectedItems[item[me.options.connector.primaryKey]] = item;
	    } 
	   }

            YAHOO.Bubbling.fire("renderCurrentValueMDBC",
            {
               eventGroup: me
            });
         };
         
         var onFailure = function ObjectFinder__loadSelectedItems_onFailure(response)
         {
            this.selectedItems = null;
         };

	var connectionCallback = { 
		success:onSuccess,
		failure:onFailure
	};

         if (arrItems == "true")
         {

	    var url = Alfresco.constants.PROXY_URI + "mdbc/api/aspect?aspectName=" + this.options.aspectName +"&nodeRef=" + this.options.nodeRef;
	 
	    var getXML = YAHOO.util.Connect.asyncRequest("GET",url,connectionCallback); 
		
         }
         else
         {
            // if disabled show the (None) message
            if (this.options.disabled && this.options.displayMode == "items")
            {
               Dom.get(this.id + "-currentValueDisplay").innerHTML = this.msg("form.control.novalue");
            }
            
            this._enableActions();
         }
      },

      /**
       * Creates the UI Navigation controls
       *
       * @method _createNavigationControls
       * @private
       */
      _createNavigationControls: function MDBConnectorFinder__createNavigationControls()
      {
         var me = this;
         
	// only show the search box for authority mode
	Dom.setStyle(this.pickerId + "-folderUpContainer", "display", "none");
	Dom.setStyle(this.pickerId + "-navigatorContainer", "display", "none");
	Dom.setStyle(this.pickerId + "-searchContainer", "display", "block");

	// setup search widgets
	this.widgets.searchButton = new YAHOO.widget.Button(this.pickerId + "-searchButton");
	this.widgets.searchButton.on("click", this.onSearch, this.widgets.searchButton, this);

	// force the generated buttons to have a name of "-" so it gets ignored in
	// JSON submit. TODO: remove this when JSON submit behaviour is configurable
	Dom.get(this.pickerId + "-searchButton").name = "-";

	// register the "enter" event on the search text field
	var zinput = Dom.get(this.pickerId + "-searchText");
	new YAHOO.util.KeyListener(zinput, 
	{
	keys: 13
	}, 
	{
	fn: me.onSearch,
	scope: this,
	correctScope: true
	}, "keydown").enable();
        
      },

      /**
       * Creates UI controls to support Selected Items
       *
       * @method _createSelectedItemsControls
       * @private
       */
      _createSelectedItemsControls: function MDBConnectorFinder__createSelectedItemsControls()
      {
         var doBeforeParseDataFunction = function MDBConnectorFinder__createSelectedItemsControls_doBeforeParseData(oRequest, oFullResponse)
         {
            var updatedResponse = oFullResponse;

            if (oFullResponse && oFullResponse.length > 0)
            {
               var items = oFullResponse.data.items;

               // we need to wrap the array inside a JSON object so the DataTable is happy
               updatedResponse =
               {
                  items: items
               };
            }

            return updatedResponse;
         };

         var me = this;

         if (this.options.disabled === false)
         {

            // Setup a DataSource for the selected items list
            this.widgets.dataSource = new YAHOO.util.DataSource([],
            {
               responseType: YAHOO.util.DataSource.TYPE_JSARRAY,
               doBeforeParseData: doBeforeParseDataFunction
            });

            // Picker DataTable definition
            var columnDefinitions = [{key: "remove", label: "", sortable: false, formatter: this.fnRenderCellRemove(), width: 16 }];
	   /*
            [
               { key: "sdescripcionhechos", label: "Item", sortable: false, formatter: this.fnRenderCellName() },
               { key: "remove", label: "Remove", sortable: false, formatter: this.fnRenderCellRemove(), width: 16 }
            ];
	   */
	  
	    for(var i=0;i<this.options.connector.columns.length;i++){
               var c = this.options.connector.columns[i];
               if(c.visible=="true"){
		  columnDefinitions.push({key:c.name, label: c.label, sortable: false, formatter: this.fnRenderCellName(), width: c.width });
	      }
	    }

            this.widgets.dataTable = new YAHOO.widget.DataTable(this.pickerId + "-selectedItems", columnDefinitions, this.widgets.dataSource,
            {
               MSG_EMPTY: this.msg("form.control.object-picker.selected-items.empty")
            });

            // Hook remove item action click events
            var fnRemoveItemHandler = function MDBConnectorFinder__createSelectedItemsControls_fnRemoveItemHandler(layer, args)
            {
               var owner = YAHOO.Bubbling.getOwnerByTagName(args[1].anchor, "div");
               if (owner !== null)
               {
                  var target, rowId, record;

                  target = args[1].target;
                  rowId = target.offsetParent;
                  record = me.widgets.dataTable.getRecord(rowId);
                  if (record)
                  {
                     me.widgets.dataTable.deleteRow(rowId);
                     YAHOO.Bubbling.fire("selectedItemRemovedMDBC",
                     {
                        eventGroup: me,
                        item: record.getData()
                     });
                  }
               }
               return true;
            };
            YAHOO.Bubbling.addDefaultAction("remove-" + this.eventGroup, fnRemoveItemHandler, true);
         }

         // Add displayMode as class so we can separate the styling of the currentValue element
         var currentValueEl = Dom.get(this.id + "-currentValueDisplay");
         Dom.addClass(currentValueEl, "mdbc-finder-" + this.options.displayMode);
         
         if (this.options.displayMode == "list")
         {
            // Setup a DataSource for the selected items list
            var ds = new YAHOO.util.DataSource([],
            {
               responseType: YAHOO.util.DataSource.TYPE_JSARRAY,
               doBeforeParseData: doBeforeParseDataFunction
            });
		
            // Current values DataTable definition
            var currentValuesColumnDefinitions = [{key: "remove", label: "", sortable: false, formatter: this.fnRenderCellListItemActions(), width: 16 }];

	      for(var i=0;i<this.options.connector.columns.length;i++){
               var c = this.options.connector.columns[i];
	       if(c.visible=="true"){
		      currentValuesColumnDefinitions.push({key: c.name, label: c.label, sortable: false, formatter: this.fnRenderCellName(), width: c.width });
		}
	    }
           

            // Make sure the currentValues container is a div rather than a span to make sure it may become a datatable
            var currentValueId = this.id + "-currentValueDisplay";
            currentValueEl = Dom.get(currentValueId);
            if (currentValueEl.tagName.toLowerCase() == "span")
            {
               var currentValueDiv = document.createElement("div");
               currentValueDiv.setAttribute("class", currentValueEl.getAttribute("class"));
               currentValueEl.parentNode.appendChild(currentValueDiv);
               currentValueEl.parentNode.removeChild(currentValueEl);
               currentValueEl = currentValueDiv;
            }
            this.widgets.currentValuesDataTable = new YAHOO.widget.DataTable(currentValueEl, currentValuesColumnDefinitions, ds,
            {
               MSG_EMPTY: this.msg("form.control.object-picker.selected-items.empty")
            });
            this.widgets.currentValuesDataTable.subscribe("rowMouseoverEvent", this.widgets.currentValuesDataTable.onEventHighlightRow);
            this.widgets.currentValuesDataTable.subscribe("rowMouseoutEvent", this.widgets.currentValuesDataTable.onEventUnhighlightRow);

            Dom.addClass(currentValueEl, "form-element-border");
            Dom.addClass(currentValueEl, "form-element-background-color");

            // Hook action item click events
            var fnActionListItemHandler = function MDBConnectorFinder__createSelectedItemsControls_fnActionListItemHandler(layer, args)
            {
               var owner = YAHOO.Bubbling.getOwnerByTagName(args[1].anchor, "div");
               if (owner !== null)
               {
                  var target, rowId, record;

                  target = args[1].target;
                  rowId = target.offsetParent;
                  record = me.widgets.currentValuesDataTable.getRecord(rowId);
                  if (record)
                  {
                     var data = record.getData(),
                        name = YAHOO.util.Dom.getAttribute(args[1].target, "class").split(" ")[0];
                     for (var i = 0, il = me.options.listItemActions.length; i < il; i++)
                     {
                        if (me.options.listItemActions[i].name == name)
                        {
                           YAHOO.Bubbling.fire(me.options.listItemActions[i].event,
                           {
                              eventGroup: me,
                              value: data,
                              rowId: rowId
                           });
                           return true;
                        }
                     }
                  }
               }
               return true;
            };
            YAHOO.Bubbling.addDefaultAction("list-action-event-" + this.eventGroup, fnActionListItemHandler, true);
         }
      },
      
      /**
       * Populate selected items
       *
       * @method _populateSelectedItems
       * @private
       */
      _populateSelectedItems: function MDBConnectorFinder__populateSelectedItems()
      {
         // Empty results table
         this.widgets.dataTable.set("MSG_EMPTY", this.msg("form.control.object-picker.selected-items.empty"));
         this.widgets.dataTable.deleteRows(0, this.widgets.dataTable.getRecordSet().getLength());

         for (var item in this.selectedItems)
         {
            if (this.selectedItems.hasOwnProperty(item))
            {
               YAHOO.Bubbling.fire("selectedItemAddedMDBC",
               {
                  eventGroup: this,
                  item: this.selectedItems[item]
               });
            }
         }
      },
      /**
       * Fires the refreshItemListMDBC event to refresh the contents of the picker.
       * 
       * @method _fireRefreshEvent
       * @private
       */
      _fireRefreshEvent: function MDBConnectorFinder__fireRefreshEvent()
      {
        
	    // get the current search term
	    var searchTermInput = Dom.get(this.pickerId + "-searchText");
	    var searchTerm = searchTermInput.value;
	    if (searchTerm.length >= this.options.minSearchTermLength)
	    {
	       // refresh the previous search
	       YAHOO.Bubbling.fire("refreshItemListMDBC",
	       {
		  eventGroup: this,
		  searchTerm: searchTerm
	       });
	    }
	    else
	    {
	       // focus ready for a search
	       searchTermInput.focus();
	    }
         
      },
      
      /**
       * Create YUI resizer widget
       *
       * @method _createResizer
       * @private
       */
      _createResizer: function MDBConnectorFinder__createResizer()
      {
         if (!this.widgets.resizer)
         {
            var size = parseInt(Dom.get(this.pickerId + "-body").offsetWidth, 10) - 2,
               heightFix = 0;
            this.columns[0] = Dom.get(this.pickerId + "-left");
            this.columns[1] = Dom.get(this.pickerId + "-right");
            this.widgets.resizer = new YAHOO.util.Resize(this.pickerId + "-left",
            {
                handles: ["r"],
                minWidth: 200,
                maxWidth: (size - 200)
            });
            // The resize handle doesn't quite get the element height correct, so it's saved here
            heightFix = this.widgets.resizer.get("height");
            
            this.widgets.resizer.on("resize", function(e)
            {
                var w = e.width;
                Dom.setStyle(this.columns[0], "height", "");
                Dom.setStyle(this.columns[1], "width", (size - w - 8) + "px");
            }, this, true);

            this.widgets.resizer.on("endResize", function(e)
            {
               // Reset the resize handle height to it's original value
               this.set("height", heightFix);
            });

            this.widgets.resizer.fireEvent("resize",
            {
               ev: 'resize',
               target: this.widgets.resizer,
               width: size / 2
            });
         }
      },

      /**
       * Determines whether the picker is in 'authority' mode.
       *
       * @method _enableActions
       * @private
       */
      _enableActions: function MDBConnectorFinder__enableActions()
      {
         if (this.widgets.removeAllButton)
         {
            // Enable the remove all button if there is any items
            this.widgets.removeAllButton.set("disabled", this.widgets.currentValuesDataTable.getRecordSet().getLength() === 0);
         }
         if (this.widgets.addButton)
         {
            // Enable the add button
            this.widgets.addButton.set("disabled", false);                  
         }

         if (!this.options.disabled && !this.isReady)
         {
            this.isReady = true;
            YAHOO.Bubbling.fire("MDBConnectorFinderReady",
            {
               eventGroup: this
            });
         }
      }
   });
})();


/**
 * ObjectRenderer component.
 * 
 * @namespace Alfresco
 * @class Venzia.ObjectRenderer
 */
(function()
{
   /**
    * YUI Library aliases
    */
   var Dom = YAHOO.util.Dom;

   /**
    * Alfresco Slingshot aliases
    */
   var $html = Alfresco.util.encodeHTML,
      $hasEventInterest = Alfresco.util.hasEventInterest;

   /**
    * Internal constants
    */
   var IDENT_CREATE_NEW = "~CREATE~NEW~";


   /**
    * ObjectRenderer constructor.
    * 
    * @param {object} Instance of the MDBConnectorFinder
    * @return {Venzia.ObjectRenderer} The new ObjectRenderer instance
    * @constructor
    */
   Venzia.ObjectRenderer = function(MDBConnectorFinder)
   {
      this.MDBConnectorFinder = MDBConnectorFinder;
      
      Venzia.ObjectRenderer.superclass.constructor.call(this, "Venzia.ObjectRenderer", MDBConnectorFinder.pickerId, ["button", "menu", "container", "datasource", "datatable"]);
      /**
       * Decoupled event listeners
       */
      this.eventGroup = MDBConnectorFinder.eventGroup;
      YAHOO.Bubbling.on("renderControlMDBC", this.onRenderControlMDBC, this);
      YAHOO.Bubbling.on("refreshItemListMDBC", this.onrefreshItemListMDBC, this);
      YAHOO.Bubbling.on("selectedItemAddedMDBC", this.onSelectedItemChanged, this);
      YAHOO.Bubbling.on("selectedItemRemovedMDBC", this.onSelectedItemChanged, this);

      // Initialise prototype properties
      this.addItemButtons = {};
      this.startLocationResolved = false;
      this.createNewItemId = null;

      return this;
   };
   
   YAHOO.extend(Venzia.ObjectRenderer, Alfresco.component.Base,
   {
      /**
       * Object container for initialization options
       *
       * @property options
       * @type object
       */
      options:
      {
         /**
          * Parent node for browsing
          *
          * @property parentNodeRef
          * @type string
          */
         parentNodeRef: "",

         /**
          * The type of the item to find
          *
          * @property itemType
          * @type string
          */
         itemType: "cm:content",
         
         /**
          * The 'family' of the item to find can be one of the following:
          * 
          * - node
          * - category
          * - authority
          * 
          * default is "node".
          * 
          * @property itemFamily
          * @type string
          */
         itemFamily: "node",

         /**
          * Parameters to be passed to the data webscript
          *
          * @property params
          * @type string
          */
         params: "",

         /**
          * Compact mode flag
          * 
          * @property compactMode
          * @type boolean
          * @default false
          */
         compactMode: false,

         /**
          * Maximum number of items to display in the results list
          * 
          * @property maxSearchResults
          * @type int
          * @default 100
          */
         maxSearchResults: 100,
         
         /**
          * Relative URI of "create new item" data webscript.
          *
          * @property createNewItemUri
          * @type string
          * @default ""
          */
         createNewItemUri: "",
         
         /**
          * Icon type to augment "create new item" row.
          *
          * @property createNewItemIcon
          * @type string
          * @default ""
          */
         createNewItemIcon: ""
      },

      /**
       * Object container for storing button instances, indexed by item id.
       * 
       * @property addItemButtons
       * @type object
       */
      addItemButtons: null,

      /**
       * Create new item input control Dom Id
       * 
       * @property createNewItemId
       * @type string
       */
      createNewItemId: null,
      
      /**
       * Flag to indicate whether the start location (if present)
       * has been resolved yet or not
       * 
       * @property startLocationResolved
       * @type boolean
       */
      startLocationResolved: false,
      
      /**
       * Fired by YUI when parent element is available for scripting.
       * Component initialisation, including instantiation of YUI widgets and event listener binding.
       *
       * @method onReady
       */
      onReady: function ObjectRenderer_onReady()
      {
         
      },
      onCreateControl: function ObjectRenderer_onCreateControl(){
   	this._createControls();
      },
      /**
       * Destroy method - deregister Bubbling event handlers
       *
       * @method destroy
       */
      destroy: function ObjectRenderer_destroy()
      {
         try
         {
	    YAHOO.Bubbling.unsubscribe("renderControlMDBC", this.onRenderControlMDBC, this);
            YAHOO.Bubbling.unsubscribe("refreshItemListMDBC", this.onrefreshItemListMDBC, this);
            YAHOO.Bubbling.unsubscribe("selectedItemAddedMDBC", this.onSelectedItemChanged, this);
            YAHOO.Bubbling.unsubscribe("selectedItemRemovedMDBC", this.onSelectedItemChanged, this);
         }
         catch (e)
         {
            // Ignore
         }
         Venzia.ObjectRenderer.superclass.destroy.call(this);
      },

      
      /**
       * PUBLIC INTERFACE
       */

      /**
       * The picker has just been shown
       *
       * @method onPickerShow
       */
      onPickerShow: function ObjectRenderer_onPickerShow()
      {
         this.addItemButtons = {};
         Dom.get(this.MDBConnectorFinder.pickerId).focus();
      },

      /**
       * Generate item icon URL
       *
       * @method getIconURL
       * @param item {object} Item object literal
       * @param size {number} Icon size (16, 32)
       */
      getIconURL: function ObjectRenderer_getIconURL(item, size)
      {
         return Alfresco.constants.URL_RESCONTEXT + 'components/images/filetypes/' + Alfresco.util.getFileIcon(item.name, item.type, size);
      },
      
      /**
       * Render item using a passed-in template
       *
       * @method renderItem
       * @param item {object} Item object literal
       * @param iconSize {number} Icon size (16, 32)
       * @param template {string} String with "{parameter}" style placeholders
       */
      renderItem: function ObjectRenderer_renderItem(item, iconSize, template)
      {
         var me = this;
     
         var renderHelper = function ObjectRenderer_renderItem_renderHelper(p_key, p_value, p_metadata)
         {
            if (p_key.toLowerCase() == "icon")
            {
               return '<img src="' + me.getIconURL(item, iconSize) + '" width="' + iconSize + '" alt="default column" title="default column" />'; 
            }
            return $html(p_value);
         };
         
         return YAHOO.lang.substitute(template, item, renderHelper);
      },

      /**
       * BUBBLING LIBRARY EVENT HANDLERS FOR PAGE EVENTS
       * Disconnected event handlers for inter-component event notification
       */

      /**
       * Refresh item list event handler
       *
       * @method onrefreshItemListMDBC
       * @param layer {object} Event fired
       * @param args {array} Event parameters (depends on event type)
       */
      onRenderControlMDBC: function ObjectRenderer_onRenderControlMDBC(layer, args)
      {   
         // Check the event is directed towards this instance
         if ($hasEventInterest(this, args))
         {
            this._createControls();
         }
      },

      /**
       * BUBBLING LIBRARY EVENT HANDLERS FOR PAGE EVENTS
       * Disconnected event handlers for inter-component event notification
       */

      /**
       * Refresh item list event handler
       *
       * @method onrefreshItemListMDBC
       * @param layer {object} Event fired
       * @param args {array} Event parameters (depends on event type)
       */
      onrefreshItemListMDBC: function ObjectRenderer_onrefreshItemListMDBC(layer, args)
      {   
         // Check the event is directed towards this instance
         if ($hasEventInterest(this, args))
         {
            var searchTerm = "";
            var obj = args[1];
            if (obj && obj.searchTerm)
            {
               searchTerm = obj.searchTerm;
            }
            this._updateItems(this.options.parentNodeRef, searchTerm);
         }
      },

      /**
       * Selected Item Changed event handler
       * Handles selectedItemAddedMDBC and selectedItemRemovedMDBC events
       *
       * @method onSelectedItemChanged
       * @param layer {object} Event fired
       * @param args {array} Event parameters (depends on event type)
       */
      onSelectedItemChanged: function ObjectRenderer_onSelectedItemChanged(layer, args)
      {   
         // Check the event is directed towards this instance
         if ($hasEventInterest(this, args))
         {
            var obj = args[1];
            if (obj && obj.item)
            {
               var button;
               for (var id in this.addItemButtons)
               {
                  if (this.addItemButtons.hasOwnProperty(id))
                  {
                     button = this.addItemButtons[id];
                     Dom.setStyle(button, "display", this.MDBConnectorFinder.canItemBeSelected(id) ? "inline" : "none");
                  }
               }
            }
         }
      },

      /**
       * Returns Icon datacell formatter
       *
       * @method fnRenderItemIcon
       */
      fnRenderItemIcon: function ObjectRenderer_fnRenderItemIcon()
      {
         var scope = this;
      
         /**
          * Icon datacell formatter
          *
          * @method renderItemIcon
          * @param elCell {object}
          * @param oRecord {object}
          * @param oColumn {object}
          * @param oData {object|string}
          */
         return function ObjectRenderer_renderItemIcon(elCell, oRecord, oColumn, oData)
         {
            var iconSize = scope.options.compactMode ? 16 : 32;

            oColumn.width = iconSize - 6;
            Dom.setStyle(elCell.parentNode, "width", oColumn.width + "px");

            // Create New item cell type
            if (oRecord.getData("type") == IDENT_CREATE_NEW)
            {
               Dom.addClass(this.getTrEl(elCell), "create-new-row");
               var obj =
               {
                  type: scope.options.createNewItemIcon,
                  description: scope.msg("form.control.object-picker.create-new")
               };
               elCell.innerHTML = scope.renderItem(obj, iconSize, '<div class="icon' + iconSize + '"><span class="new-item-overlay"></span>{icon}</div>');
               return;
            }

            elCell.innerHTML = scope.renderItem(oRecord.getData(), iconSize, '<div class="icon' + iconSize + '">{icon}</div>');
         };
      },

      /**
       * Returns Name datacell formatter
       *
       * @method fnRenderItemName
       */
      fnRenderItemName: function ObjectRenderer_fnRenderItemName()
      {
         var scope = this;
      
         /**
          * Name datacell formatter
          *
          * @method renderItemName
          * @param elCell {object}
          * @param oRecord {object}
          * @param oColumn {object}
          * @param oData {object|string}
          */
         return function ObjectRenderer_renderItemName(elCell, oRecord, oColumn, oData)
         {
            var template = '';

            // Create New item cell type
            if (oRecord.getData("type") == IDENT_CREATE_NEW)
            {
               scope.createNewItemId = Alfresco.util.generateDomId();
               elCell.innerHTML = '<input id="' + scope.createNewItemId + '" type="text" class="create-new-input" tabindex="0" />';
               return;
            }

            if (oRecord.getData("isContainer") ||
                (!oRecord.getData("isContainer") && (scope.options.allowNavigationToContentChildren || oRecord.getData("type") == "cm:category")))
            {
               template += '<h3 class="item-name"><a href="#" class="theme-color-1 parent-' + scope.eventGroup + '">{name}</a></h3>';
            }
            else
            {
               template += '<h3 class="item-name">{name}</h3>';
            }

            if (!scope.options.compactMode)
            {
               template += '<div class="description">{description}</div>';
            }

            elCell.innerHTML = oData ;//scope.renderItem(oRecord.getData(), 0, template);
         };
      },

      /**
       * Returns Add button datacell formatter
       *
       * @method fnRenderCellAdd
       */
      fnRenderCellAdd: function ObjectRenderer_fnRenderCellAdd()
      {
         var scope = this;
      
         /**
          * Add button datacell formatter
          *
          * @method renderCellAvatar
          * @param elCell {object}
          * @param oRecord {object}
          * @param oColumn {object}
          * @param oData {object|string}
          */
         return function ObjectRenderer_renderCellAdd(elCell, oRecord, oColumn, oData)
         {
            Dom.setStyle(elCell.parentNode, "width", oColumn.width + "px");
            
            var containerId = Alfresco.util.generateDomId();

            if (true)//oRecord.getData("selectable"))
            {
               var id = oRecord.getData(scope.MDBConnectorFinder.options.connector.primaryKey),
                  style = "";

               if (!scope.MDBConnectorFinder.canItemBeSelected(id))
               {
                  style = 'style="display: none"';
               }

               elCell.innerHTML = '<a id="' + containerId + '" href="#" ' + style + ' class="add-item add-' + scope.eventGroup + '" title="' + scope.msg("form.control.object-picker.add-item") + '" tabindex="0"><span class="addIcon">&nbsp;</span></a>';
               scope.addItemButtons[id] = containerId;
            }
         };
      },

      /**
       * PRIVATE FUNCTIONS
       */

      /**
       * Creates UI controls
       *
       * @method _createControls
       */
      _createControls: function ObjectRenderer__createControls()
      {
         var me = this;

	 // DataTable column defintions
         var columnDefinitions = [{ key: "add", label: "", sortable: false, formatter: this.fnRenderCellAdd(), width: 16 }],fields = [];
	/*
         [
	     { key: "add", label: "", sortable: false, formatter: this.fnRenderCellAdd(), width: 16 },
             { key: "sdescripcionhechos", label: "Item", sortable: false, formatter: this.fnRenderItemName()}
         ];
       */
	 for(var i=0;i<this.MDBConnectorFinder.options.connector.columns.length;i++){
               var c = this.MDBConnectorFinder.options.connector.columns[i];
	       fields.push({key:c.name});
               if(c.visible=="true"){
		   columnDefinitions.push({key:c.name, label: c.label, sortable: false, formatter: this.fnRenderItemName(), width: c.width });
	      }
	    }



         // DataSource definition  
         var pickerChildrenUrl = Alfresco.constants.PROXY_URI + "mdbc/api/connector/search";
         this.widgets.dataSource = new YAHOO.util.DataSource(pickerChildrenUrl,
         {
            responseType: YAHOO.util.DataSource.TYPE_XML,
            connXhrMode: "queueRequests",
	    useXPath : true,
            responseSchema:
            {
               resultNode: "row",
	       fields: fields 
            }
         });
	
        
         initialMessage = this.msg("form.control.object-picker.items-list.search");
         

         this.widgets.dataTable = new YAHOO.widget.DataTable(this.id + "-results", columnDefinitions, this.widgets.dataSource,
         {
            renderLoopSize: 100,
            initialLoad: false,
            MSG_EMPTY: initialMessage,
            width:"30em", 
	    height:"10em"
         });

         // Hook add item action click events (for Compact mode)
         var fnAddItemHandler = function ObjectRenderer__createControls_fnAddItemHandler(layer, args)
         {
            var owner = YAHOO.Bubbling.getOwnerByTagName(args[1].anchor, "div");
            if (owner !== null)
            {
               var target, rowId, record;

               target = args[1].target;
               rowId = target.offsetParent;
               record = me.widgets.dataTable.getRecord(rowId);
               if (record)
               {
                  YAHOO.Bubbling.fire("selectedItemAddedMDBC",
                  {
                     eventGroup: me,
                     item: record.getData(),
                     highlight: true
                  });
               }
            }
            return true;
         }; 

	YAHOO.Bubbling.addDefaultAction("add-" + this.eventGroup, fnAddItemHandler, true);

        
      },
      
      /**
       * Updates item list by calling data webscript
       *
       * @method _updateItems
       * @param nodeRef {string} Parent nodeRef
       * @param searchTerm {string} Search term
       */
      _updateItems: function ObjectRenderer__updateItems(nodeRef, searchTerm)
      {
         // Empty results table - leave tag entry if it's been rendered
         if (this.createNewItemId !== null)
         {
            this.widgets.dataTable.deleteRows(1, this.widgets.dataTable.getRecordSet().getLength() - 1);
         }
         else
         {
            this.widgets.dataTable.set("MSG_EMPTY", this.msg("form.control.object-picker.items-list.loading"));
            this.widgets.dataTable.deleteRows(0, this.widgets.dataTable.getRecordSet().getLength());
         }
         
         var successHandler = function ObjectRenderer__updateItems_successHandler(sRequest, oResponse, oPayload)
         {
            this.options.parentNodeRef = oResponse.meta.parent ? oResponse.meta.parent.nodeRef : nodeRef;
            this.widgets.dataTable.set("MSG_EMPTY", this.msg("form.control.object-picker.items-list.empty"));
            if (this.createNewItemId !== null)
            {
               this.widgets.dataTable.onDataReturnAppendRows.call(this.widgets.dataTable, sRequest, oResponse, oPayload);
            }
            else
            {
               this.widgets.dataTable.onDataReturnInitializeTable.call(this.widgets.dataTable, sRequest, oResponse, oPayload);
            }
         };
         
         var failureHandler = function ObjectRenderer__updateItems_failureHandler(sRequest, oResponse)
         {
            if (oResponse.status == 401)
            {
               // Our session has likely timed-out, so refresh to offer the login page
               window.location.reload();
            }
            else
            {
               try
               {
                  var response = YAHOO.lang.JSON.parse(oResponse.responseText);
                  this.widgets.dataTable.set("MSG_ERROR", response.message);
                  this.widgets.dataTable.showTableMessage(response.message, YAHOO.widget.DataTable.CLASS_ERROR);
               }
               catch(e)
               {
               }
            }
         };
         
         // build the url to call the pickerchildren data webscript
         var url =  this._generatePickerChildrenUrlParams(searchTerm);
         
         if (Alfresco.logger.isDebugEnabled())
         {
            Alfresco.logger.debug("Generated pickerchildren url fragment: " + url);
         }
         
         // call the pickerchildren data webscript
         this.widgets.dataSource.sendRequest(url,
         {
            success: successHandler,
            failure: failureHandler,
            scope: this
         });
         
         // the start location is now resolved
         this.startLocationResolved = true;
      },
      
      /**
       * Generates the query parameters for the pickerchildren webscript URL.
       * 
       * @method _generatePickerChildrenUrlParams
       * @param searchTerm The search term
       * @return The generated URL
       */
      _generatePickerChildrenUrlParams: function ObjectRenderer__generatePickerChildrenUrlParams(searchTerm)
      {
         var params = "?search=" + encodeURIComponent(searchTerm) + 
                      "&size=" + this.options.maxSearchResults +
			"&connector="+ this.options.connectorName;
         
         if (this.options.params)
         {
            params += "&" + encodeURI(this.options.params);
         }
         
         return params;
      }
   });
})();
