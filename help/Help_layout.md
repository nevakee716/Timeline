| **Name** | **Layout Timeline** | **Version** | 
| --- | --- | --- |
| **Updated by** | Mathias PFAUWADEL | 2.0 |


## Patch Notes

* 2.0 : Adding Expert Mode, not compatible anymore with old configuration
* 1.5 : Adding option to have object as time element, and also complementary node
* 1.4 : You can choose if you want to stack or not. You can have point date
* 1.3 : Allow you to group children objects by step
* 1.1 : Work on tab, objectPage
* 1.0 : 1st version working

## To be Done

* SearchText Box
* More Options
* Filter
* Export
* Editable


## Description 
Allow you to display DateProperty of your objects (and their associated objects) in a Timeline. The Layout support multiple level of association, and the customDisplay string. It will also work with the customdisplay string enhanced.

## Screen Shot
<img src="https://raw.githubusercontent.com/nevakee716/Timeline/master/screen/1.jpg" alt="Drawing" style="width: 95%;"/>
You can expend/collapse the list of associated objects. You can zoom with mouse wheel and the scale time will adapt.

## Node Configuration

Select all the object you need inside evolve, don't forget to check the needed time properties inside evolve nodes
Publish your evolve site.
When going on the timeline page, you will see an empty timeline
<img src="https://raw.githubusercontent.com/nevakee716/Timeline/master/screen/2.jpg" alt="Drawing" style="width: 95%;"/>
If you are a system admistrator, you will see a cogs icon allowing to go in expert mode when clicking on it
<img src="https://raw.githubusercontent.com/nevakee716/Timeline/master/screen/3.jpg" alt="Drawing" style="width: 95%;"/>
You will now see the evolve node structure of your page.
In this exemple we have Application and their application component

When clicking on a node, you will see different options

<img src="https://raw.githubusercontent.com/nevakee716/Timeline/master/screen/4.jpg" alt="Drawing" style="width: 95%;"/>

### Is lane

If is lane is check, the objects of the node will be displayed inside the timeline
You can have multiple level of association
<img src="https://raw.githubusercontent.com/nevakee716/Timeline/master/screen/5.jpg" alt="Drawing" style="width: 95%;"/>

### Collapsed By Default : 

if check, the lane will be collapsed and the children won't be displayed


### Complementary Node (this work the same as the network):

If you want to add a side Node, use this option 
For exemple, if you are on the objectPage of an application, you want to display sent and received flow. Put the timeline under the associationNode of the sent flow, then add the node id of the received flow in this option.

### Hidden Nodes : 

This node will be hidden, and the children will be displayed instead

## Step Configuration

Now, we have all our item inside the timeline, we need now to take care of the time step that will be displayed inside the timeline
Right click on a node to create some time step
<img src="https://raw.githubusercontent.com/nevakee716/Timeline/master/screen/6.jpg" alt="Drawing" style="width: 95%;"/>
then click on the new step, you can right click on it to delete or rename it
<img src="https://raw.githubusercontent.com/nevakee716/Timeline/master/screen/7.jpg" alt="Drawing" style="width: 95%;"/>

### Custom Display String : 

Same as in evolve designer, this text will appear inside the time element
<img src="https://raw.githubusercontent.com/nevakee716/Timeline/master/screen/8.jpg" alt="Drawing" style="width: 95%;"/>


### Tooltip : 

When hover an element, you can display more information, synthax is the same as the custom display string
<img src="https://raw.githubusercontent.com/nevakee716/Timeline/master/screen/9.jpg" alt="Drawing" style="width: 95%;"/>

### Type : 

There are 4 types of time element : 
- Range 

<img src="https://raw.githubusercontent.com/nevakee716/Timeline/master/screen/10.jpg" alt="Drawing" style="width: 95%;"/>

- Background

<img src="https://raw.githubusercontent.com/nevakee716/Timeline/master/screen/12.jpg" alt="Drawing" style="width: 95%;"/>

- Point

<img src="https://raw.githubusercontent.com/nevakee716/Timeline/master/screen/13.jpg" alt="Drawing" style="width: 95%;"/>

- Box

<img src="https://raw.githubusercontent.com/nevakee716/Timeline/master/screen/11.jpg" alt="Drawing" style="width: 95%;"/>


### Start Date Property : 

The Property Type that will define the start date of your time Element. If the property value is empty, the time element won't be rendered

### End Date (not available if type is Point or box)

The Property Type that will define the enddate of your time Element. 

### Select Value for Empty Date : 

If the end date is empty, you can select a default behaviour, the timeline can : 
- not display the time element
- put the end date as today
- put the end date in 5 years
<img src="https://raw.githubusercontent.com/nevakee716/Timeline/master/screen/14.jpg" alt="Drawing" style="width: 95%;"/>


### Extend End Date // Children Steps : 

This option allow you to extend a date depending on children steps.

For exemple, our application has an end date for the production phase, if our application has a component with an end date further in time, we want the end date of our application to be extended to the end date of our component
before : 
<img src="https://raw.githubusercontent.com/nevakee716/Timeline/master/screen/15.jpg" alt="Drawing" style="width: 95%;"/>
after : 
<img src="https://raw.githubusercontent.com/nevakee716/Timeline/master/screen/16.jpg" alt="Drawing" style="width: 95%;"/>


### Color : 

You can choose the text, background, border of the time element

## Save Configuration inside for evolve designer

Once your finished your configuration, please click ok on the save tab
<img src="https://raw.githubusercontent.com/nevakee716/Timeline/master/screen/18.jpg" alt="Drawing" style="width: 95%;"/>

It will copy the configuration inside your clipboard, then paste it inside your page in evolve designer
<img src="https://raw.githubusercontent.com/nevakee716/Timeline/master/screen/17.jpg" alt="Drawing" style="width: 95%;"/>
